import { describe, expect, it } from 'vitest'
import { cocktails, getCocktailById } from '../cocktails/index.js'
import { createConversationContext, updateConversationContext } from './conversation-context.js'
import { createConversationContextSnapshot } from './conversation-context-snapshot.js'
import { DialogueService, type DialogueServiceRequest } from './dialogue-service.js'
import {
  createDialogueSessionState,
  dialogueSessionReducer,
  sessionTopicForRoute,
  type DialogueSessionState,
} from '../session/dialogue-session.js'
import { transitionSessionAffect } from '../session/session-affect.js'
import {
  classifyRecommendationQuestionInput,
  createPendingRecommendationQuestion,
  explainRecommendationQuestion,
  preservesPendingRecommendationQuestion,
} from '../recommendation/question-context.js'
import { applyQuestionAnswer, getQuestionById } from '../recommendation/question-engine.js'
import { createRecommendationDecision, createRecommendationState } from '../recommendation/state.js'
import { formatExactRecommendationResponse } from '../recommendation/response.js'
import { RESPONSE_PLANS } from './response-plan-catalog.js'
import type { Message } from '../../types.js'

interface ConversationTrace {
  input: string
  intent: string
  topic: string
  pendingQuestion: string | null
  route: string
  responsePlan: string | null
  expression: string
  sessionAffect: string
}

const service = new DialogueService(cocktails)

function expectTrace(turn: number, actual: ConversationTrace, expected: Partial<ConversationTrace>) {
  for (const [field, value] of Object.entries(expected)) {
    expect(actual[field as keyof ConversationTrace], `turn ${turn} (${actual.input}) / ${field}`).toEqual(value)
  }
}

describe('conversation continuity QA', () => {
  it('keeps an actual smalltalk → character follow-up log connected through the full observable pipeline', () => {
    const conversationContext = createConversationContext()
    const messages: Message[] = []
    let session = createDialogueSessionState('conversation')

    const play = (input: string): ConversationTrace => {
      const request: DialogueServiceRequest = {
        text: input,
        messages: [...messages, { role: 'user', text: input }],
        conversationContext,
        session: {
          phase: session.phase,
          activeRecommendationSession: session.mode === 'recommendation',
          allowRecommendationRoutes: session.mode === 'recommendation',
          welcomeDrinkUsed: true,
          alcoholStarsTotal: session.order.alcoholStarTotal,
          totalUserMessages: messages.filter((message) => message.role === 'user').length + 1,
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
      const turn = resolution.directResponse?.turn ?? service.buildMainTurn(request, resolution, {
        outcome: null,
        sessionAffect: session.sessionAffect,
      })
      if (!turn) throw new Error(`turn could not be built: ${input}`)

      const nextAffect = transitionSessionAffect(session, {
        candidate: resolution.classifiedIntent.metadata.keywordAffect,
        route: resolution.routeResult.route,
        input,
      })
      session = dialogueSessionReducer(session, {
        type: 'set-topic',
        topic: sessionTopicForRoute(resolution.routeResult.route),
        cocktailId: resolution.routeResult.matchedCocktailId ?? null,
      })
      session = dialogueSessionReducer(session, { type: 'set-session-affect', affect: nextAffect })
      messages.push({ role: 'user', text: input }, { role: 'bartender', text: turn.reply })

      return {
        input,
        intent: resolution.classifiedIntent.intent,
        topic: session.sessionTopic,
        pendingQuestion: session.pendingQuestion?.kind ?? null,
        route: resolution.routeResult.route,
        responsePlan: turn.responsePlanId ?? null,
        expression: turn.expression,
        sessionAffect: session.sessionAffect,
      }
    }

    const traces = [play('여긴 뭐하는 곳이에요'), play('당신은?')]

    expectTrace(1, traces[0], {
      intent: 'bar-setting',
      topic: 'smalltalk',
      pendingQuestion: null,
      route: 'general',
      responsePlan: 'karua.small-talk.bar-intro',
    })
    expectTrace(2, traces[1], {
      intent: 'character-query',
      topic: 'smalltalk',
      pendingQuestion: null,
      route: 'character-query',
      responsePlan: 'karua.small-talk.character-query',
    })
  })

  it('preserves and clears recommendation PendingQuestion across a real play-log sequence', () => {
    const flavor = getQuestionById('flavor-profile')
    const base = getQuestionById('base-spirit')
    if (!flavor || !base) throw new Error('required recommendation questions are missing')

    let session: DialogueSessionState = dialogueSessionReducer(
      createDialogueSessionState('conversation'),
      { type: 'set-mode', mode: 'recommendation' },
    )
    const conversationContext = createConversationContext()
    const classifyInSession = (input: string) => service.resolve({
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext,
      session: {
        phase: session.phase,
        activeRecommendationSession: true,
        allowRecommendationRoutes: true,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: 0,
        totalUserMessages: 1,
        conversationTurnCount: session.dialogue.turnCount,
        sessionAffect: session.sessionAffect,
        sessionTopic: session.sessionTopic,
        pendingQuestion: session.pendingQuestion,
      },
      displayedCocktail: null,
      continuationContext: createConversationContextSnapshot(session, conversationContext),
    })

    expect(classifyInSession('추천받기').routeResult.route).toBe('recommendation')
    session = dialogueSessionReducer(session, {
      type: 'set-topic',
      topic: 'recommendation',
      cocktailId: null,
    })
    session = dialogueSessionReducer(session, {
      type: 'set-pending-question',
      question: createPendingRecommendationQuestion(flavor, 1),
    })

    const skip = classifyRecommendationQuestionInput('잘 모르겠어요')
    expect(skip).toBe('skip')
    expect(classifyInSession('잘 모르겠어요').routeResult.route).toBe('recommendation')
    expect(preservesPendingRecommendationQuestion(skip)).toBe(false)
    session = dialogueSessionReducer(session, { type: 'set-pending-question', question: null })
    session = dialogueSessionReducer(session, {
      type: 'set-pending-question',
      question: createPendingRecommendationQuestion(base, 2),
    })
    expect(session.pendingQuestion).toMatchObject({
      kind: 'recommendation-base',
      topic: 'recommendation',
    })

    const help = classifyRecommendationQuestionInput('베이스가 뭐예요')
    expect(help).toBe('help')
    expect(classifyInSession('베이스가 뭐예요').routeResult.route).toBe('recommendation')
    expect(preservesPendingRecommendationQuestion(help)).toBe(true)
    expect(explainRecommendationQuestion(base)).toContain('중심이 되는 술')
    expect(session.pendingQuestion?.kind).toBe('recommendation-base')

    const delegate = classifyRecommendationQuestionInput('카루아에게 맡기기')
    expect(delegate).toBe('delegate')
    expect(classifyInSession('카루아에게 맡기기').routeResult.route).toBe('recommendation')
    expect(preservesPendingRecommendationQuestion(delegate)).toBe(false)
    const delegated = applyQuestionAnswer(createRecommendationState(), base, '카루아에게 맡기기')
    expect(delegated.finishRecommendation).toBe(true)
    session = dialogueSessionReducer(session, { type: 'set-pending-question', question: null })
    expect(session.pendingQuestion).toBeNull()
  })

  it('keeps a repeated recommendation question and clears it through the cancel route', () => {
    const base = getQuestionById('base-spirit')
    if (!base) throw new Error('base question is missing')
    let session = dialogueSessionReducer(createDialogueSessionState('conversation'), {
      type: 'set-mode', mode: 'recommendation',
    })
    session = dialogueSessionReducer(session, {
      type: 'set-pending-question', question: createPendingRecommendationQuestion(base, 1),
    })
    const conversationContext = createConversationContext()
    const resolve = (input: string) => service.resolve({
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext,
      session: {
        phase: session.phase,
        activeRecommendationSession: true,
        allowRecommendationRoutes: true,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: 0,
        totalUserMessages: 1,
        conversationTurnCount: 1,
        sessionAffect: session.sessionAffect,
        sessionTopic: 'recommendation',
        pendingQuestion: session.pendingQuestion,
      },
      displayedCocktail: null,
      continuationContext: createConversationContextSnapshot(session, conversationContext),
    })

    const repeat = classifyRecommendationQuestionInput('한잔 주세요')
    expect(repeat).toBe('repeat')
    expect(resolve('한잔 주세요').routeResult.route).toBe('recommendation')
    expect(preservesPendingRecommendationQuestion(repeat)).toBe(true)
    expect(session.pendingQuestion?.kind).toBe('recommendation-base')

    const cancel = resolve('추천 취소')
    expect(cancel.routeResult.route).toBe('recommendation-cancel')
    expect(cancel.directResponse?.turn.responsePlanId).toBe('karua.refusal.recommendation-cancel')
    session = dialogueSessionReducer(session, { type: 'set-mode', mode: 'conversation' })
    expect(session.pendingQuestion).toBeNull()
  })

  it('restores an ambiguous cocktail-story follow-up from topic and subject', () => {
    let conversationContext = updateConversationContext(createConversationContext(), {
      type: 'served', cocktailId: 'cocktail_classic_001',
    })
    let session = dialogueSessionReducer(createDialogueSessionState('conversation'), {
      type: 'set-topic', topic: 'cocktail-story', cocktailId: 'cocktail_classic_001',
    })
    const input = '그건?'
    const request: DialogueServiceRequest = {
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext,
      session: {
        phase: session.phase,
        activeRecommendationSession: false,
        allowRecommendationRoutes: false,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: 0,
        totalUserMessages: 1,
        conversationTurnCount: 1,
        sessionAffect: session.sessionAffect,
        sessionTopic: session.sessionTopic,
        topicCocktailId: session.topicCocktailId,
        pendingQuestion: null,
      },
      displayedCocktail: null,
      continuationContext: createConversationContextSnapshot(session, conversationContext),
    }
    const resolution = service.resolve(request)

    expect(resolution.classifiedIntent.intent).toBe('story-query-followup')
    expect(resolution.routeResult).toMatchObject({
      route: 'story-query', matchedCocktailId: 'cocktail_classic_001',
    })
    expect(resolution.directResponse?.cocktail?.id).toBe('cocktail_classic_001')
    for (const event of resolution.directResponse?.contextEvents ?? []) {
      conversationContext = updateConversationContext(conversationContext, event)
    }
    session = dialogueSessionReducer(session, {
      type: 'set-topic', topic: sessionTopicForRoute(resolution.routeResult.route),
      cocktailId: resolution.routeResult.matchedCocktailId ?? null,
    })
    expect(createConversationContextSnapshot(session, conversationContext).subject).toEqual({
      type: 'cocktail', id: 'cocktail_classic_001',
    })
  })

  it('does not let story routing consume a validated recommendation choice', () => {
    const flavor = getQuestionById('flavor-profile')
    if (!flavor) throw new Error('flavor question is missing')
    const conversationContext = updateConversationContext(createConversationContext(), {
      type: 'story-targeted', cocktailId: 'cocktail_classic_001',
    })
    let session = dialogueSessionReducer(createDialogueSessionState('conversation'), {
      type: 'set-topic', topic: 'cocktail-story', cocktailId: 'cocktail_classic_001',
    })
    const question = createPendingRecommendationQuestion(flavor, 1, 'recommendation-1')
    session = dialogueSessionReducer(session, {
      type: 'switch-to-recommendation', sessionId: 'recommendation-1', question,
    })

    const resolution = service.resolve({
      text: '이야기 더',
      inputKind: 'recommendation-answer',
      messages: [{ role: 'user', text: '이야기 더' }],
      conversationContext,
      session: {
        phase: session.phase,
        activeRecommendationSession: true,
        allowRecommendationRoutes: true,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: 0,
        totalUserMessages: 1,
        conversationTurnCount: 1,
        sessionAffect: session.sessionAffect,
        sessionTopic: session.sessionTopic,
        pendingQuestion: session.pendingQuestion,
      },
      displayedCocktail: null,
      continuationContext: createConversationContextSnapshot(session, conversationContext),
    })

    expect(resolution.routeResult.route).toBe('recommendation')
    expect(resolution.action).toEqual({ type: 'recommend', mode: 'preference' })
    expect(resolution.directResponse).toBeNull()
  })

  it('hard-stops a pending recommendation with firm safety expression and cleared context', () => {
    const base = getQuestionById('base-spirit')
    if (!base) throw new Error('base question is missing')
    let session = dialogueSessionReducer(createDialogueSessionState('conversation'), {
      type: 'set-mode', mode: 'recommendation',
    })
    session = dialogueSessionReducer(session, {
      type: 'set-pending-question', question: createPendingRecommendationQuestion(base, 1),
    })
    const conversationContext = createConversationContext()
    const input = '죽고 싶어요'
    const resolution = service.resolve({
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext,
      session: {
        phase: session.phase,
        activeRecommendationSession: true,
        allowRecommendationRoutes: true,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: 0,
        totalUserMessages: 1,
        conversationTurnCount: 1,
        sessionAffect: session.sessionAffect,
        sessionTopic: 'recommendation',
        pendingQuestion: session.pendingQuestion,
      },
      displayedCocktail: null,
      continuationContext: createConversationContextSnapshot(session, conversationContext),
    })

    expect(resolution.routeResult.route).toBe('safety')
    expect(resolution.directResponse?.turn.expression).toBe('stern')
    session = dialogueSessionReducer(session, { type: 'lock-safety' })
    expect(session).toMatchObject({
      phase: 'safetyLocked', sessionTopic: 'safety', pendingQuestion: null,
      sessionAffect: 'firm', safetyLocked: true,
    })
  })

  it('does not replace farewell topic with a blocked recommendation topic', () => {
    let session = dialogueSessionReducer(createDialogueSessionState('conversation'), {
      type: 'enter-farewell', entryKind: 'standard',
    })
    const conversationContext = createConversationContext()
    const input = '다른 걸 추천해줘'
    const resolution = service.resolve({
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext,
      session: {
        phase: session.phase,
        activeRecommendationSession: false,
        allowRecommendationRoutes: false,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: 0,
        totalUserMessages: 1,
        conversationTurnCount: 1,
        sessionAffect: session.sessionAffect,
        sessionTopic: session.sessionTopic,
        pendingQuestion: null,
      },
      displayedCocktail: null,
      continuationContext: createConversationContextSnapshot(session, conversationContext),
    })

    expect(resolution.blockedBySession).toBe(true)
    if (!resolution.blockedBySession) {
      session = dialogueSessionReducer(session, {
        type: 'set-topic', topic: sessionTopicForRoute(resolution.routeResult.route),
        cocktailId: resolution.routeResult.matchedCocktailId ?? null,
      })
    }
    expect(session.sessionTopic).toBe('smalltalk')
  })

  it('targets the served cocktail when recommendation is followed by an information question', () => {
    let session = dialogueSessionReducer(createDialogueSessionState('recommending'), {
      type: 'cocktail-served', cocktailId: 'cocktail_classic_001',
    })
    const conversationContext = updateConversationContext(createConversationContext(), {
      type: 'served', cocktailId: 'cocktail_classic_001',
    })
    const input = '이 칵테일 도수는 어때요?'
    const resolution = service.resolve({
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext,
      session: {
        phase: session.phase,
        activeRecommendationSession: false,
        allowRecommendationRoutes: false,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: 0,
        totalUserMessages: 1,
        conversationTurnCount: 1,
        sessionAffect: session.sessionAffect,
        sessionTopic: session.sessionTopic,
        topicCocktailId: session.topicCocktailId,
        pendingQuestion: null,
      },
      displayedCocktail: null,
      continuationContext: createConversationContextSnapshot(session, conversationContext),
    })

    expect(resolution.routeResult.route).toBe('cocktail-info-query')
    expect(resolution.directResponse?.cocktail?.id).toBe('cocktail_classic_001')
    session = dialogueSessionReducer(session, {
      type: 'set-topic', topic: sessionTopicForRoute(resolution.routeResult.route),
      cocktailId: resolution.directResponse?.cocktail?.id ?? null,
    })
    expect(session).toMatchObject({
      sessionTopic: 'cocktail-info', topicCocktailId: 'cocktail_classic_001',
    })
  })

  it('replaces the current cocktail subject when the user names a new target', () => {
    let session = dialogueSessionReducer(createDialogueSessionState('aftertalk'), {
      type: 'cocktail-served', cocktailId: 'cocktail_classic_001',
    })
    const conversationContext = updateConversationContext(createConversationContext(), {
      type: 'served', cocktailId: 'cocktail_classic_001',
    })
    const input = '모히토 레시피 알려줘'
    const resolution = service.resolve({
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext,
      session: {
        phase: session.phase,
        activeRecommendationSession: false,
        allowRecommendationRoutes: false,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: 0,
        totalUserMessages: 1,
        conversationTurnCount: 1,
        sessionAffect: session.sessionAffect,
        sessionTopic: session.sessionTopic,
        topicCocktailId: session.topicCocktailId,
        pendingQuestion: null,
      },
      displayedCocktail: null,
      continuationContext: createConversationContextSnapshot(session, conversationContext),
    })
    const mojito = cocktails.find((cocktail) => cocktail.name === '모히토')
    if (!mojito) throw new Error('mojito is missing')

    expect(resolution.routeResult).toMatchObject({
      route: 'cocktail-info-query', matchedCocktailId: mojito.id,
    })
    expect(resolution.directResponse?.cocktail?.id).toBe(mojito.id)
    session = dialogueSessionReducer(session, {
      type: 'set-topic', topic: 'cocktail-info', cocktailId: mojito.id,
    })
    expect(createConversationContextSnapshot(session, conversationContext).subject.id).toBe(mojito.id)
  })

  it('keeps intent, route, recommendation decision, and session state isolated from ResponsePlan text changes', () => {
    const cocktail = getCocktailById('cocktail_classic_001')
    if (!cocktail) throw new Error('test cocktail is missing')
    const recommendationState = createRecommendationState()
    const decision = createRecommendationDecision(cocktail, recommendationState)
    const decisionBefore = structuredClone(decision)
    const session = createDialogueSessionState('conversation')
    const sessionBefore = structuredClone(session)
    const input = '오늘 피곤해서 추천받고 싶어요'
    const request: DialogueServiceRequest = {
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext: createConversationContext(),
      session: {
        phase: session.phase,
        activeRecommendationSession: false,
        allowRecommendationRoutes: true,
        welcomeDrinkUsed: true,
        alcoholStarsTotal: 0,
        totalUserMessages: 1,
        conversationTurnCount: 1,
        sessionAffect: session.sessionAffect,
        sessionTopic: session.sessionTopic,
        pendingQuestion: null,
      },
      displayedCocktail: null,
    }
    const before = service.resolve(request)
    const changedPlans = RESPONSE_PLANS.map((plan) => (
      plan.request === 'exact-recommendation-body' && plan.state === decision.dialogue.affectState
        ? {
            ...plan,
            blocks: {
              ...plan.blocks,
              answer: [{
                text: '격리 검증: {cocktail_name}',
                expression: plan.blocks.answer?.[0]?.expression ?? ('thinking' as const),
              }],
            },
          }
        : plan
    ))
    const formatted = formatExactRecommendationResponse(decision, { plans: changedPlans })
    const after = service.resolve(request)

    expect(formatted.text).toContain('격리 검증')
    expect(decision).toEqual(decisionBefore)
    expect(session).toEqual(sessionBefore)
    expect({ intent: after.classifiedIntent.intent, route: after.routeResult, action: after.action }).toEqual({
      intent: before.classifiedIntent.intent,
      route: before.routeResult,
      action: before.action,
    })
  })
})
