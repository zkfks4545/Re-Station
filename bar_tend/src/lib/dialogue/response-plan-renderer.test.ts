import { describe, expect, it } from 'vitest'
import {
  renderExactRecommendationResponsePlan,
  renderNearestRecommendationResponsePlan,
  renderRecommendationQuestionResponsePlan,
  renderRandomPickResponsePlan,
  renderRecommendationFormatterLine,
  renderStandardFarewellEntryResponsePlan,
  renderWelcomeDrinkFeedbackResponsePlan,
  renderWelcomeDrinkResponsePlan,
  renderWelcomeXyzClarificationResponsePlan,
} from './response-plan-renderer.js'

describe('recommendation formatter slot renderer', () => {
  it('허용된 recommendation formatter slot만 치환한다', () => {
    expect(renderRecommendationFormatterLine({
      text: '「{cocktail_name}」은 어떠세요?\n{talking_point}',
      expression: 'smirk',
    }, {
      cocktail_name: '마티니',
      talking_point: '짧고 또렷한 잔이에요.',
    })).toEqual({
      text: '「마티니」은 어떠세요?\n짧고 또렷한 잔이에요.',
      expression: 'smirk',
    })
  })

  it('허용되지 않은 slot을 거부한다', () => {
    expect(renderRecommendationFormatterLine({
      text: '{opening}\n「{cocktail_name}」은 어떠세요?',
      expression: 'smirk',
    }, {
      cocktail_name: '마티니',
    })).toBeNull()
  })

  it('필수 slot 값이 없으면 거부한다', () => {
    expect(renderRecommendationFormatterLine({
      text: '「{cocktail_name}」은 어떠세요?\n{talking_point}',
      expression: 'smirk',
    }, {
      cocktail_name: '마티니',
    })).toBeNull()
  })

  it('선택된 opening을 slot 처리 없이 최종 본문 앞에 보존한다', () => {
    expect(renderRandomPickResponsePlan('이번에는 제가 골라봤어요.', '마티니', '짧고 또렷한 잔이에요.')).toEqual({
      text: '이번에는 제가 골라봤어요.\n「마티니」은 어떠세요?\n짧고 또렷한 잔이에요.',
      expression: 'smirk',
    })
  })

  it('이미 결정된 exact recommendation 값만 최종 본문에 치환한다', () => {
    const rendered = renderExactRecommendationResponsePlan('neutral', 'fixed-seed', {
      cocktail_name: '마티니',
      cocktail_name_subject: '마티니가',
      reason: '드라이한 취향과 잘 맞아요.',
      talking_point: '짧고 또렷한 잔이에요.',
    })

    expect(rendered?.text).toContain('마티니')
    expect(rendered?.text).toContain('드라이한 취향과 잘 맞아요.')
    expect(rendered?.text).toContain('짧고 또렷한 잔이에요.')
    expect(rendered?.expression).toBe('smirk')
  })

  it('이미 결정된 nearest fallback 값만 최종 본문에 치환한다', () => {
    expect(renderNearestRecommendationResponsePlan('concerned', {
      cocktail_name: '마티니',
      fallback_reason: '말씀하신 조건과 조금 다른 부분이 있을 수 있습니다.',
      talking_point: '짧고 또렷한 잔이에요.',
    })).toEqual({
      text: '완전히 맞는 칵테일은 없어서 가장 가까운 「마티니」을 골랐어요.\n짧고 또렷한 잔이에요.\n말씀하신 조건과 조금 다른 부분이 있을 수 있습니다.',
      expression: 'sympathy',
    })
  })

  it('renders recommendation question lead-in with already-selected slots', () => {
    expect(renderRecommendationQuestionResponsePlan(false, {
      lead_in: 'lead',
      question_label: 'question',
    })).toEqual({
      text: 'lead\nquestion',
      expression: 'thinking',
    })
  })

  it('renders recommendation question continuation with already-selected slots', () => {
    expect(renderRecommendationQuestionResponsePlan(true, {
      acknowledgement: 'ack',
      continuation: 'continue',
      question_label: 'question',
    })).toEqual({
      text: 'ack\ncontinue\nquestion',
      expression: 'thinking',
    })
  })

  it('renders welcome drink body with already-selected slots', () => {
    const rendered = renderWelcomeDrinkResponsePlan('first', 'cocktail', 'point')

    expect(rendered).toEqual({
      text: '웰컴드링크로는 cocktail로 드릴게요.\n첫 잔이라 짧게 이야기 하나 얹어드릴게요.\npoint',
      expression: 'smirk',
    })
  })

  it('renders welcome feedback without semantic slots', () => {
    expect(renderWelcomeDrinkFeedbackResponsePlan('positive')).toEqual({
      text: '좋았어요. 그럼 이쪽 밸런스는 기억해둘게요.',
      expression: 'smirk',
    })
  })

  it('renders standard farewell entry without semantic slots', () => {
    expect(renderStandardFarewellEntryResponsePlan()).toEqual({
      text: '오늘은 잔을 더 놓지 않고 여기서 마무리할게요.\n잠깐 숨을 고른 뒤 조심히 돌아가실 수 있게 배웅하겠습니다.',
      expression: 'sympathy',
    })
  })

  it('renders welcome XYZ clarification without semantic slots', () => {
    expect(renderWelcomeXyzClarificationResponsePlan()).toEqual({
      text: '그런 뜻은 아니에요.',
      expression: 'smirk',
    })
  })
})
