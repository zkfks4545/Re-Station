import { describe, expect, it } from 'vitest'
import { getQuestionById } from '../recommendation/question-engine.js'
import {
  appendRecommendationResume,
  classifyRecommendationInterruption,
  planCompatibleRecommendationInterruption,
} from './conversation-expansion.js'
import { cocktails } from '../cocktails/index.js'
import { DialogueService } from './dialogue-service.js'
import { createConversationContext } from './conversation-context.js'

const service = new DialogueService(cocktails)

const flavorQuestion = getQuestionById('flavor-profile')!

describe('recommendation conversation expansion', () => {
  it.each([
    ['시에스타는 어떤 사람이야?', 'character'],
    ['Re:Station은 왜 생겼어?', 'world-building'],
    ['인생은 뭐라고 생각해?', 'worldview'],
    ['마티니 유래를 알려줘', 'cocktail-info'],
    ['오늘 너무 피곤해', 'daily-life'],
    ['양자역학이 뭐야?', 'knowledge'],
  ])('suspends recommendation for %s under the %s contract', (input, topic) => {
    expect(classifyRecommendationInterruption(input, flavorQuestion)?.topic).toBe(topic)
  })

  it.each([
    '달콤하고 과일감 있게',
    '오늘은 독한 게 당겨',
    '탄산은 별로지만 사이다는 좋아해',
    '카루아에게 맡기기',
  ])('keeps preference input %s in the recommendation FSM', (input) => {
    expect(classifyRecommendationInterruption(input, flavorQuestion)).toBeNull()
  })

  it('returns to the exact saved question after the topic response', () => {
    expect(appendRecommendationResume('짧은 답변입니다.', flavorQuestion)).toContain(
      '선호하는 맛과 톤을 선택해 주세요',
    )
  })

  it.each([
    ['시에스타는 어떤 사람이야?', 'character'],
    ['Re:Station은 무슨 곳이야?', 'world-building'],
    ['인생은 뭐라고 생각해?', 'worldview'],
    ['마티니 유래를 알려줘', 'cocktail-info'],
    ['오늘 너무 힘들어', 'daily-life'],
  ])('plans a compatible suspended-question transition for %s', (input, topic) => {
    const interruption = classifyRecommendationInterruption(input, flavorQuestion)
    const resolution = service.resolve({
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext: createConversationContext(),
      session: {
        phase: 'conversation', activeRecommendationSession: false,
        allowRecommendationRoutes: false, welcomeDrinkUsed: true,
        alcoholStarsTotal: 0, totalUserMessages: 1, conversationTurnCount: 1,
        sessionAffect: 'neutral', sessionTopic: 'recommendation', pendingQuestion: null,
      },
      displayedCocktail: null,
    })
    const plan = planCompatibleRecommendationInterruption(
      interruption,
      resolution.understanding,
      resolution.move,
    )

    expect({
      interruption: interruption?.topic,
      primaryTopic: resolution.understanding.primaryTopic.value,
      move: resolution.move.type,
      transition: plan?.transition,
    }).toMatchObject({
      interruption: topic,
      transition: { type: 'suspend-question', topic },
    })
  })

  it('keeps the legacy knowledge fallback when Understand misclassifies the question', () => {
    const input = '양자역학이 뭐야?'
    const interruption = classifyRecommendationInterruption(input, flavorQuestion)
    const resolution = service.resolve({
      text: input,
      messages: [{ role: 'user', text: input }],
      conversationContext: createConversationContext(),
      session: {
        phase: 'conversation', activeRecommendationSession: false,
        allowRecommendationRoutes: false, welcomeDrinkUsed: true,
        alcoholStarsTotal: 0, totalUserMessages: 1, conversationTurnCount: 1,
        sessionAffect: 'neutral', sessionTopic: 'recommendation', pendingQuestion: null,
      },
      displayedCocktail: null,
    })

    expect(interruption?.topic).toBe('knowledge')
    expect(resolution.understanding.primaryTopic.value).toBe('cocktail')
    expect(planCompatibleRecommendationInterruption(
      interruption, resolution.understanding, resolution.move,
    )).toBeNull()
  })

  it('rejects a legacy interruption candidate when Understand disagrees', () => {
    const interruption = { topic: 'knowledge' as const }
    const resolution = service.resolve({
      text: '오늘 너무 힘들어',
      messages: [{ role: 'user', text: '오늘 너무 힘들어' }],
      conversationContext: createConversationContext(),
      session: {
        phase: 'conversation', activeRecommendationSession: false,
        allowRecommendationRoutes: false, welcomeDrinkUsed: true,
        alcoholStarsTotal: 0, totalUserMessages: 1, conversationTurnCount: 1,
        sessionAffect: 'neutral', sessionTopic: 'recommendation', pendingQuestion: null,
      },
      displayedCocktail: null,
    })

    expect(planCompatibleRecommendationInterruption(
      interruption, resolution.understanding, resolution.move,
    )).toBeNull()
  })
})
