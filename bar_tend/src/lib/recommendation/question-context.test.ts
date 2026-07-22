import { describe, expect, it } from 'vitest'
import {
  classifyRecommendationQuestionInput,
  createRecommendationChoiceInput,
  createPendingRecommendationQuestion,
  explainRecommendationQuestion,
  isCurrentRecommendationChoice,
  preservesPendingRecommendationQuestion,
} from './question-context.js'

describe('recommendation question context', () => {
  it('keeps help, repeat, and delegation distinct', () => {
    expect(classifyRecommendationQuestionInput('베이스가 뭐예요')).toBe('help')
    expect(classifyRecommendationQuestionInput('한잔 주세요')).toBe('repeat')
    expect(classifyRecommendationQuestionInput('카루아에게 맡길게요')).toBe('delegate')
    expect(classifyRecommendationQuestionInput('칼루아에게 맡길게요')).toBe('delegate')
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
    }, 3, 'recommendation-3')

    expect(pending).toEqual({
      sessionId: 'recommendation-3',
      questionId: 'base-spirit',
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

  it('accepts only the choice owned by the active recommendation question', () => {
    const pendingQuestion = createPendingRecommendationQuestion({
      id: 'flavor-profile', topic: 'flavor', prompt: '맛을 골라주세요.', choices: [],
    }, 1, 'recommendation-1')
    const session = {
      mode: 'recommendation' as const,
      activeSessionId: 'recommendation-1',
      pendingQuestion,
    }
    const current = createRecommendationChoiceInput(pendingQuestion, '달콤하고 과일감 있게')

    expect(isCurrentRecommendationChoice(current, session)).toBe(true)
    expect(isCurrentRecommendationChoice({ ...current, sessionId: 'recommendation-0' }, session)).toBe(false)
    expect(isCurrentRecommendationChoice({ ...current, questionId: 'base-spirit' }, session)).toBe(false)
    expect(isCurrentRecommendationChoice(current, { ...session, mode: 'conversation' })).toBe(false)
  })
})
