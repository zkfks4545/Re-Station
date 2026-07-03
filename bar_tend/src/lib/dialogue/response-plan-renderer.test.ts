import { describe, expect, it } from 'vitest'
import {
  renderRandomPickResponsePlan,
  renderRecommendationFormatterLine,
} from './response-plan-renderer.js'

describe('recommendation formatter slot renderer', () => {
  it('cocktail_name과 talking_point만 치환한다', () => {
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
})
