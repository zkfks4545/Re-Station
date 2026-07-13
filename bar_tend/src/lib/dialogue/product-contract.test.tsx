import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CocktailCard from '../../components/bar/CocktailCard.js'
import { cocktails, getCocktailById } from '../cocktails/database.js'
import {
  applyQuestionAnswer,
  createRecommendationSourcePool,
  isRecommendationDecisive,
  pickFromPool,
  selectNextQuestion,
} from '../recommendation/question-engine.js'
import {
  addQuestionHistory,
  answerLatestQuestion,
  applyRecommendationSignals,
  createRecommendationDecision,
  createRecommendationState,
  extractRecommendationSignals,
  getQuestionCandidatePool,
  resolveCocktailsByRecommendationState,
} from '../recommendation/state.js'
import {
  formatExactRecommendationResponse,
  formatNearestRecommendationResponse,
} from '../recommendation/response.js'
import { createConversationContext } from './conversation-context.js'
import { DialogueService, type DialogueServiceRequest } from './dialogue-service.js'
import { createServingPlan } from './serving-plan.js'
import {
  createDialogueSessionState,
  dialogueSessionReducer,
} from '../session/dialogue-session.js'
import { isOrderingClosedPhase, XYZ_COCKTAIL_ID } from '../session/session-flow.js'

const service = new DialogueService(cocktails)

function createRequest(text: string): DialogueServiceRequest {
  return {
    text,
    messages: [{ role: 'user', text }],
    conversationContext: createConversationContext(),
    session: {
      phase: 'conversation',
      activeRecommendationSession: true,
      allowRecommendationRoutes: true,
      welcomeDrinkUsed: true,
      alcoholStarsTotal: 0,
      totalUserMessages: 1,
      conversationTurnCount: 1,
      sessionAffect: 'neutral',
      sessionTopic: 'none',
      pendingQuestion: null,
    },
    displayedCocktail: null,
  }
}

function completeRecommendation(input: string, excludedCocktailIds: string[] = []) {
  const resolution = service.resolve(createRequest(input))
  let state = applyRecommendationSignals(
    createRecommendationState(),
    extractRecommendationSignals(input),
  )
  const source = createRecommendationSourcePool(excludedCocktailIds)
  let questionPool = getQuestionCandidatePool(source.cocktails, state).cocktails
  let questionCount = 0

  while (!isRecommendationDecisive(questionPool) && questionCount < 3) {
    const question = selectNextQuestion(questionPool, state)
    if (!question) break
    const choice = question.choices.find((candidate) => candidate.finishRecommendation !== true)
    if (!choice) throw new Error(`answerable choice is missing: ${question.id}`)

    state = addQuestionHistory(state, { topic: question.topic })
    state = answerLatestQuestion(state, choice.label)
    state = applyQuestionAnswer(state, question, choice.label).state
    questionPool = getQuestionCandidatePool(source.cocktails, state).cocktails
    questionCount += 1
  }

  const result = resolveCocktailsByRecommendationState(source.cocktails, state)
  const cocktail = pickFromPool(result.cocktails, state.taste)
  if (!cocktail) throw new Error('recommendation did not produce a cocktail')
  const decision = createRecommendationDecision(cocktail, state)
  const dialogue = result.exactMatch
    ? formatExactRecommendationResponse(decision)
    : formatNearestRecommendationResponse(decision)
  const card = renderToStaticMarkup(
    <CocktailCard cocktail={cocktail} onClose={() => undefined} />,
  )

  return { resolution, questionCount, cocktail, decision, dialogue, card }
}

describe('P1 product contract E2E', () => {
  it('completes the rule-based recommendation flow in one to three questions and renders its DB card', () => {
    const result = completeRecommendation('추천받기')

    expect(result.resolution.routeResult.route).toBe('recommendation')
    expect(result.resolution.action.type).toBe('recommend')
    expect(result.questionCount).toBeGreaterThanOrEqual(1)
    expect(result.questionCount).toBeLessThanOrEqual(3)
    expect(result.decision.reasons.length).toBeGreaterThan(0)
    expect(result.dialogue.text).toContain(result.cocktail.name)
    expect(result.card).toContain(result.cocktail.name)
    expect(result.card).toContain(result.cocktail.description)
    expect(result.card).toContain('맛 프로필')
    expect(result.card).not.toContain('추천 이유')
    expect(result.card).not.toContain('이야깃거리')
  })

  it('keeps a repeated recommendation on the same contract while excluding the previous result', () => {
    const first = completeRecommendation('추천받기')
    const second = completeRecommendation('다시 추천해 주세요', [first.cocktail.id])

    expect(second.resolution.routeResult.route).toBe('recommendation')
    expect(second.cocktail.id).not.toBe(first.cocktail.id)
    expect(second.questionCount).toBeLessThanOrEqual(3)
    expect(second.card).toContain(second.cocktail.description)
  })

  it('carries a recommendation through service, XYZ, and farewell while closing further orders', () => {
    const recommendation = completeRecommendation('추천받기')
    let session = createDialogueSessionState('recommending')
    const servingPlan = createServingPlan({
      cocktail: recommendation.cocktail,
      currentPhase: session.phase,
      alcoholStarTotal: session.order.alcoholStarTotal,
    })

    session = dialogueSessionReducer(session, {
      type: 'set-alcohol-total',
      total: servingPlan.nextAlcoholStarTotal,
    })
    session = dialogueSessionReducer(session, {
      type: 'cocktail-served',
      cocktailId: recommendation.cocktail.id,
    })
    if (servingPlan.nextPhase) {
      session = dialogueSessionReducer(session, { type: 'set-phase', phase: servingPlan.nextPhase })
    }

    expect(session.phase).toBe('aftertalk')
    expect(session.mode).toBe('conversation')
    expect(session.topicCocktailId).toBe(recommendation.cocktail.id)

    const limitPlan = createServingPlan({
      cocktail: recommendation.cocktail,
      currentPhase: session.phase,
      alcoholStarTotal: 10 - recommendation.cocktail.taste.alcohol,
    })
    expect(limitPlan.requiresFarewell).toBe(true)
    session = dialogueSessionReducer(session, {
      type: 'enter-farewell',
      entryKind: 'alcohol-xyz',
    })

    const xyz = getCocktailById(XYZ_COCKTAIL_ID)
    if (!xyz) throw new Error('XYZ cocktail is missing')
    const xyzPlan = createServingPlan({
      cocktail: xyz,
      currentPhase: session.phase,
      alcoholStarTotal: limitPlan.nextAlcoholStarTotal,
    })
    expect(xyzPlan.nextPhase).toBe('farewell')
    session = dialogueSessionReducer(session, { type: 'cocktail-served', cocktailId: xyz.id })
    session = dialogueSessionReducer(session, { type: 'set-phase', phase: xyzPlan.nextPhase! })

    expect(session.phase).toBe('farewell')
    expect(isOrderingClosedPhase(session.phase)).toBe(true)

    const blockedRequest = createRequest('다시 추천해 주세요')
    blockedRequest.session.phase = session.phase
    const blocked = service.resolve(blockedRequest)
    expect(blocked.blockedBySession).toBe(true)
    expect(blocked.action.type).toBe('recommend')
  })

  it('short-circuits a safety input before recommendation or card output', () => {
    const resolution = service.resolve(createRequest('죽고 싶어요'))

    expect(resolution.routeResult.route).toBe('safety')
    expect(resolution.directResponse?.turn.responseGoal).toContain('안전')
    expect(resolution.directResponse?.cocktail).toBeNull()
    expect(resolution.action.type).not.toBe('recommend')
  })
})
