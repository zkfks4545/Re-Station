import { describe, expect, it } from 'vitest'
import type { Message } from '../../types.js'
import { cocktails } from '../cocktails/index.js'
import {
  createDialogueSessionState,
  dialogueSessionReducer,
  sessionTopicForRoute,
  type DialogueSessionAction,
  type DialogueSessionState,
} from '../session/dialogue-session.js'
import { transitionSessionAffect } from '../session/session-affect.js'
import {
  createConversationContext,
  updateConversationContext,
} from './conversation-context.js'
import { createConversationContextSnapshot } from './conversation-context-snapshot.js'
import {
  runConversationReplay,
  type ConversationReplayPlayer,
  type ConversationReplaySnapshot,
} from './conversation-replay.js'
import { DialogueService, type DialogueServiceRequest } from './dialogue-service.js'
import type { DialogueAction } from './action-resolver.js'
import {
  compatibleControlTransitions,
  compatibleTopicTransition,
  consumePreferenceEvidence,
  type PreferenceEvidence,
} from './decision-shadow.js'
import { createRecommendationState, extractRecommendationSignals } from '../recommendation/state.js'
import { getQuestionById } from '../recommendation/question-engine.js'
import {
  appendRecommendationResume,
  classifyRecommendationInterruption,
  planCompatibleRecommendationInterruption,
} from './conversation-expansion.js'

const service = new DialogueService(cocktails)
const mojito = cocktails.find(({ name }) => name === '모히토')
if (!mojito) throw new Error('모히토 fixture is missing')

function snapshot(overrides: Partial<ConversationReplaySnapshot> = {}): ConversationReplaySnapshot {
  return {
    input: '입력',
    intent: 'general-chat',
    route: 'general',
    action: 'respond',
    primaryTopic: 'smalltalk',
    speechAct: 'statement',
    entityId: null,
    controlIntent: null,
    preferenceProjection: 'none',
    preferenceProjectionCompatible: true,
    interruptionTopic: null,
    interruptionPlanCompatible: null,
    move: 'respond',
    transitionPlan: 'none',
    blockedBySession: false,
    phase: 'conversation',
    mode: 'conversation',
    topic: 'smalltalk',
    pendingQuestion: null,
    suspendedQuestion: null,
    safetyLocked: false,
    selectedCocktailId: null,
    responsePlanId: null,
    expression: 'talk',
    reply: '응답',
    ...overrides,
  }
}

function actionKey(action: DialogueAction): string {
  if (action.type === 'recommend') return `${action.type}:${action.mode}`
  if (action.type === 'continueStory') return `${action.type}:${action.topic}:${action.cocktailId ?? 'none'}`
  if ('cocktailId' in action) return `${action.type}:${action.cocktailId}`
  return action.type
}

function transitionKey(action: DialogueSessionAction): string {
  if (action.type === 'set-mode') return `${action.type}:${action.mode}`
  if (action.type === 'set-topic') return `${action.type}:${action.topic}:${action.cocktailId ?? 'none'}`
  return action.type
}

function createDialogueReplayPlayer(initialSession = createDialogueSessionState('conversation')): ConversationReplayPlayer {
  let session: DialogueSessionState = initialSession
  let conversationContext = createConversationContext()
  let preferenceEvidence: PreferenceEvidence[] = []
  let legacyPreferenceState = createRecommendationState()
  const messages: Message[] = []

  return (input) => {
    const activeQuestion = getQuestionById(session.pendingQuestion?.questionId ?? null)
    const legacyInterruption = activeQuestion
      ? classifyRecommendationInterruption(input, activeQuestion)
      : null
    const request: DialogueServiceRequest = {
      text: input,
      messages: [...messages, { role: 'user', text: input }],
      conversationContext,
      session: {
        phase: session.phase,
        activeRecommendationSession: session.mode === 'recommendation' && !legacyInterruption,
        allowRecommendationRoutes: session.mode === 'recommendation' && !legacyInterruption,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: session.order.alcoholStarTotal,
        totalUserMessages: messages.filter(({ role }) => role === 'user').length + 1,
        conversationTurnCount: session.dialogue.turnCount,
        sessionAffect: session.sessionAffect,
        sessionTopic: session.sessionTopic,
        topicCocktailId: session.topicCocktailId,
        pendingQuestion: session.pendingQuestion,
      },
      displayedCocktail: null,
      continuationContext: createConversationContextSnapshot(session, conversationContext),
    }
    const resolution = service.resolve(request)
    const interruptionPlan = planCompatibleRecommendationInterruption(
      legacyInterruption,
      resolution.understanding,
      resolution.move,
    )
    const preferenceConsumption = consumePreferenceEvidence(
      preferenceEvidence,
      legacyPreferenceState,
      resolution.understanding.preferenceSignals,
      extractRecommendationSignals(input),
      {
        scope: { type: 'session' },
        observedAtTurn: messages.filter(({ role }) => role === 'user').length + 1,
        context: { includeSession: true },
      },
    )
    preferenceEvidence = preferenceConsumption.ledger
    legacyPreferenceState = preferenceConsumption.legacyState
    const turn = resolution.blockedBySession
      ? null
      : resolution.directResponse?.turn ?? service.buildMainTurn(request, resolution, {
          outcome: null,
          sessionAffect: session.sessionAffect,
        })

    if (!resolution.blockedBySession) {
      for (const event of [...resolution.contextEvents, ...(resolution.directResponse?.contextEvents ?? [])]) {
        conversationContext = updateConversationContext(conversationContext, event)
      }
      const controlTransitions = compatibleControlTransitions(
        resolution.routeResult.route,
        resolution.move,
      )
      if (legacyInterruption) {
        session = dialogueSessionReducer(session, interruptionPlan?.transition ?? {
          type: 'suspend-question', topic: legacyInterruption.topic,
        })
      } else {
        const topicTransition = compatibleTopicTransition(resolution.move, resolution.understanding)
          ?? {
            type: 'set-topic' as const,
            topic: sessionTopicForRoute(resolution.routeResult.route),
            cocktailId: resolution.routeResult.matchedCocktailId ?? null,
          }
        session = dialogueSessionReducer(session, topicTransition)
      }
      if (controlTransitions) {
        for (const transition of controlTransitions) {
          session = dialogueSessionReducer(session, transition)
        }
      }
      if (resolution.routeResult.route !== 'safety') {
        session = dialogueSessionReducer(session, {
          type: 'set-session-affect',
          affect: transitionSessionAffect(session, {
            candidate: resolution.classifiedIntent.metadata.keywordAffect,
            route: resolution.routeResult.route,
            input,
          }),
        })
      }
    }

    messages.push({ role: 'user', text: input })
    const reply = turn && legacyInterruption && activeQuestion
      ? appendRecommendationResume(turn.reply, activeQuestion)
      : turn?.reply ?? null
    if (reply) messages.push({ role: 'bartender', text: reply })

    return {
      input,
      intent: resolution.classifiedIntent.intent,
      route: resolution.routeResult.route,
      action: actionKey(resolution.action),
      primaryTopic: resolution.understanding.primaryTopic.value,
      speechAct: resolution.move.speechAct,
      entityId: resolution.understanding.entities.find(({ type, id }) => type === 'cocktail' && id)?.id ?? null,
      controlIntent: resolution.understanding.controlIntents[0]?.value ?? null,
      preferenceProjection: preferenceConsumption.signals
        .map(({ field, value }) => `${field}:${String(value)}`)
        .sort()
        .join(',') || 'none',
      preferenceProjectionCompatible: preferenceConsumption.compatibleWithLegacy,
      interruptionTopic: legacyInterruption?.topic ?? null,
      interruptionPlanCompatible: legacyInterruption ? interruptionPlan !== null : null,
      move: resolution.move.type,
      transitionPlan: resolution.move.transitions.map(transitionKey).join(',') || 'none',
      blockedBySession: resolution.blockedBySession,
      phase: session.phase,
      mode: session.mode,
      topic: session.sessionTopic,
      pendingQuestion: session.pendingQuestion?.kind ?? null,
      suspendedQuestion: session.suspendedQuestion?.kind ?? null,
      safetyLocked: session.safetyLocked,
      selectedCocktailId: resolution.directResponse?.cocktail?.id
        ?? resolution.routeResult.matchedCocktailId
        ?? null,
      responsePlanId: turn?.responsePlanId ?? null,
      expression: turn?.expression ?? null,
      reply,
    }
  }
}

describe('conversation replay', () => {
  it('classifies state, decision, presentation, and wording differences by severity', () => {
    const result = runConversationReplay({
      id: 'severity-contract',
      turns: [{
        input: '입력',
        expected: {
          safetyLocked: true,
          route: 'safety',
          expression: 'stern',
          reply: '기준 문장',
        },
      }],
    }, () => snapshot())

    expect(result.differences.map(({ field, severity }) => [field, severity])).toEqual([
      ['safetyLocked', 'critical'],
      ['route', 'major'],
      ['expression', 'review'],
      ['reply', 'allowed'],
    ])
    expect(result.blockingDifferences.map(({ field }) => field)).toEqual([
      'safetyLocked',
      'route',
    ])
  })

  it('replays smalltalk and character follow-up through the real dialogue service', () => {
    const scenario = {
      id: 'smalltalk-character-followup',
      turns: [
        {
          input: '여긴 뭐하는 곳이에요',
          expected: {
            intent: 'bar-setting',
            route: 'general',
            action: 'respond',
            primaryTopic: 'world-building',
            speechAct: 'question',
            entityId: null,
            controlIntent: null,
            move: 'respond',
            transitionPlan: 'set-topic:world-building:none',
            phase: 'conversation',
            mode: 'conversation',
            topic: 'world-building',
            pendingQuestion: null,
            responsePlanId: 'karua.small-talk.bar-intro',
          },
        },
        {
          input: '당신은?',
          expected: {
            intent: 'character-query',
            route: 'character-query',
            action: 'respond',
            primaryTopic: 'character',
            speechAct: 'question',
            entityId: null,
            controlIntent: null,
            move: 'respond',
            transitionPlan: 'set-topic:character:none',
            phase: 'conversation',
            mode: 'conversation',
            topic: 'character',
            pendingQuestion: null,
            responsePlanId: 'karua.small-talk.character-query',
          },
        },
      ],
    } as const

    const first = runConversationReplay(scenario, createDialogueReplayPlayer())
    const second = runConversationReplay(scenario, createDialogueReplayPlayer())
    const stableFields = (value: ConversationReplaySnapshot) => Object.fromEntries(
      Object.entries(value).filter(([field]) => field !== 'reply' && field !== 'expression'),
    )

    expect(first.blockingDifferences).toEqual([])
    expect(second.snapshots.map(stableFields)).toEqual(first.snapshots.map(stableFields))
  })

  it('replays preference evidence against the legacy projection before consumption', () => {
    const result = runConversationReplay({
      id: 'preference-evidence-compatibility',
      turns: [
        {
          input: '탄산은 별로지만 사이다는 좋아해',
          expected: { preferenceProjectionCompatible: true },
        },
        {
          input: '오늘은 독한 게 당겨',
          expected: {
            preferenceProjection: 'alcoholPreference:high,taste.alcohol_strength:0.8',
            preferenceProjectionCompatible: true,
          },
        },
      ],
    }, createDialogueReplayPlayer())

    expect(result.blockingDifferences).toEqual([])
  })

  it('replays recommendation interruption planning, fallback, and exact-question resume', () => {
    let session = dialogueSessionReducer(createDialogueSessionState('conversation'), {
      type: 'set-mode', mode: 'recommendation',
    })
    session = dialogueSessionReducer(session, {
      type: 'set-topic', topic: 'recommendation', cocktailId: null,
    })
    session = dialogueSessionReducer(session, {
      type: 'set-pending-question',
      question: {
        sessionId: 'recommendation-1', questionId: 'flavor-profile',
        kind: 'recommendation-flavor', topic: 'recommendation', askedAtTurn: 1,
      },
    })
    const result = runConversationReplay({
      id: 'recommendation-conversation-expansion',
      turns: [
        {
          input: '시에스타는 어떤 사람이야?',
          expected: {
            interruptionTopic: 'character',
            interruptionPlanCompatible: true,
            mode: 'recommendation',
            topic: 'character',
            pendingQuestion: 'recommendation-flavor',
            suspendedQuestion: 'recommendation-flavor',
          },
        },
        {
          input: '양자역학이 뭐야?',
          expected: {
            interruptionTopic: 'knowledge',
            interruptionPlanCompatible: false,
            mode: 'recommendation',
            topic: 'knowledge',
            pendingQuestion: 'recommendation-flavor',
            suspendedQuestion: 'recommendation-flavor',
          },
        },
      ],
    }, createDialogueReplayPlayer(session))
    const resumePrompt = getQuestionById('flavor-profile')!.prompt.replace(/[.?!…！？]+$/, '')

    expect(result.blockingDifferences).toEqual([])
    expect(result.snapshots.every(({ reply }) => reply?.includes(resumePrompt))).toBe(true)
  })

  it('fails closed when safety interrupts a pending recommendation question', () => {
    let session = dialogueSessionReducer(createDialogueSessionState('conversation'), {
      type: 'set-mode', mode: 'recommendation',
    })
    session = dialogueSessionReducer(session, {
      type: 'set-topic', topic: 'recommendation', cocktailId: null,
    })
    session = dialogueSessionReducer(session, {
      type: 'set-pending-question',
      question: {
        sessionId: 'recommendation-1', questionId: 'base-spirit',
        kind: 'recommendation-base', topic: 'recommendation', askedAtTurn: 1,
      },
    })

    const result = runConversationReplay({
      id: 'recommendation-safety-interruption',
      turns: [{
        input: '죽고 싶어요',
        expected: {
          route: 'safety',
          action: 'respond',
          primaryTopic: 'safety',
          speechAct: 'safety-disclosure',
          entityId: null,
          controlIntent: 'safety',
          move: 'safety',
          transitionPlan: 'lock-safety',
          blockedBySession: false,
          phase: 'safetyLocked',
          mode: 'conversation',
          topic: 'safety',
          pendingQuestion: null,
          suspendedQuestion: null,
          safetyLocked: true,
          expression: 'stern',
        },
      }],
    }, createDialogueReplayPlayer(session))

    expect(result.blockingDifferences).toEqual([])
  })

  it('keeps farewell FSM state when recommendation is blocked', () => {
    const session = dialogueSessionReducer(createDialogueSessionState('conversation'), {
      type: 'enter-farewell', entryKind: 'standard',
    })
    const result = runConversationReplay({
      id: 'farewell-blocks-recommendation',
      turns: [{
        input: '다른 걸 추천해줘',
        expected: {
          route: 'general',
          action: 'recommend:preference',
          primaryTopic: 'recommendation',
          speechAct: 'request',
          entityId: null,
          controlIntent: null,
          move: 'recommend',
          transitionPlan: 'set-topic:recommendation:none',
          blockedBySession: true,
          phase: 'farewell',
          mode: 'conversation',
          topic: 'smalltalk',
          safetyLocked: false,
          selectedCocktailId: null,
        },
      }],
    }, createDialogueReplayPlayer(session))

    expect(result.blockingDifferences).toEqual([])
  })

  it('consumes a compatible recommendation-cancel transition plan', () => {
    let session = dialogueSessionReducer(createDialogueSessionState('conversation'), {
      type: 'set-mode', mode: 'recommendation',
    })
    session = dialogueSessionReducer(session, {
      type: 'set-topic', topic: 'recommendation', cocktailId: null,
    })
    session = dialogueSessionReducer(session, {
      type: 'set-pending-question',
      question: {
        sessionId: 'recommendation-1', questionId: 'flavor-profile',
        kind: 'recommendation-flavor', topic: 'recommendation', askedAtTurn: 1,
      },
    })
    const result = runConversationReplay({
      id: 'recommendation-cancel-control-transition',
      turns: [{
        input: '추천 취소',
        expected: {
          route: 'recommendation-cancel',
          action: 'respond',
          primaryTopic: 'session',
          speechAct: 'cancel',
          entityId: null,
          controlIntent: 'cancel-recommendation',
          move: 'cancel-recommendation',
          transitionPlan: 'set-mode:conversation',
          blockedBySession: false,
          phase: 'conversation',
          mode: 'conversation',
          topic: 'smalltalk',
          pendingQuestion: null,
          suspendedQuestion: null,
          safetyLocked: false,
        },
      }],
    }, createDialogueReplayPlayer(session))

    expect(result.blockingDifferences).toEqual([])
  })

  it('consumes story topic and cocktail entity from the planned transition', () => {
    const result = runConversationReplay({
      id: 'story-topic-entity-transition',
      turns: [{
        input: '모히토 유래 알려줘',
        expected: {
          route: 'story-query',
          action: `continueStory:story:${mojito.id}`,
          primaryTopic: 'story',
          speechAct: 'question',
          entityId: mojito.id,
          controlIntent: null,
          move: 'continue-story',
          transitionPlan: `set-topic:cocktail-story:${mojito.id}`,
          blockedBySession: false,
          phase: 'conversation',
          mode: 'conversation',
          topic: 'cocktail-story',
          safetyLocked: false,
        },
      }],
    }, createDialogueReplayPlayer())

    expect(result.blockingDifferences).toEqual([])
  })
})
