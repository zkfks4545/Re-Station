import { describe, expect, it } from 'vitest'
import { classifyRecommendationQuestionInput, explainRecommendationQuestion } from './question-context.js'

describe('recommendation question context', () => {
  it('keeps help, repeat, and delegation distinct', () => {
    expect(classifyRecommendationQuestionInput('베이스가 뭐예요')).toBe('help')
    expect(classifyRecommendationQuestionInput('한잔 주세요')).toBe('repeat')
    expect(classifyRecommendationQuestionInput('카루아에게 맡길게요')).toBe('delegate')
  })

  it('explains the active field without consuming a choice', () => {
    expect(explainRecommendationQuestion({ topic: 'base' } as never)).toContain('중심')
  })
})
