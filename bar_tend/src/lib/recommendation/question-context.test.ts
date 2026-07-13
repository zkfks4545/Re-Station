import { describe, expect, it } from 'vitest'
import {
  classifyRecommendationQuestionInput,
  createPendingRecommendationQuestion,
  explainRecommendationQuestion,
  preservesPendingRecommendationQuestion,
} from './question-context.js'

describe('recommendation question context', () => {
  it('keeps help, repeat, and delegation distinct', () => {
    expect(classifyRecommendationQuestionInput('베이스가 뭐예요')).toBe('help')
    expect(classifyRecommendationQuestionInput('한잔 주세요')).toBe('repeat')
    expect(classifyRecommendationQuestionInput('카루아에게 맡길게요')).toBe('delegate')
  })

  it('explains the active field without consuming a choice', () => {
    expect(explainRecommendationQuestion({ topic: 'base' } as never)).toContain('중심')
  })

  it('maps active questions to explicit PendingQuestion kinds', () => {
    const pending = createPendingRecommendationQuestion({
      id: 'base-spirit',
      topic: 'base',
      prompt: '베이스를 골라주세요.',
      choices: [],
    }, 3)

    expect(pending).toEqual({
      kind: 'recommendation-base',
      topic: 'recommendation',
      askedAtTurn: 3,
      sourcePlanId: 'base-spirit',
    })
    expect(preservesPendingRecommendationQuestion('help')).toBe(true)
    expect(preservesPendingRecommendationQuestion('repeat')).toBe(true)
    expect(preservesPendingRecommendationQuestion('skip')).toBe(false)
    expect(preservesPendingRecommendationQuestion('delegate')).toBe(false)
  })
})
