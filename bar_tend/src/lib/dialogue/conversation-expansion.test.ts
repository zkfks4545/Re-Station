import { describe, expect, it } from 'vitest'
import { getQuestionById } from '../recommendation/question-engine.js'
import {
  appendRecommendationResume,
  classifyRecommendationInterruption,
} from './conversation-expansion.js'

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
})
