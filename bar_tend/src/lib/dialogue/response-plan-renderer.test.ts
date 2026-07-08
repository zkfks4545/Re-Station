import { describe, expect, it } from 'vitest'
import {
  renderExactRecommendationResponsePlan,
  renderNearestRecommendationResponsePlan,
  renderRandomPickResponsePlan,
  renderRecommendationFormatterLine,
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
})
