import { describe, expect, it } from 'vitest'
import {
  selectResponsePlan,
  validateResponsePlan,
  type ResponsePlan,
} from './response-plan.js'
import { renderParagraphPreset, selectParagraphPreset } from './text-presets.js'

const plans: ResponsePlan[] = [
  {
    id: 'karua.recommend.default',
    intent: 'recommend',
    speaker: 'karua',
    blocks: { reaction: ['조건은 잡혔네요.'] },
    fallbackText: '한 잔 골라볼게요.',
  },
  {
    id: 'karua.recommend.tired.light',
    intent: 'recommend',
    speaker: 'karua',
    state: 'tired',
    request: 'light',
    blocks: { reaction: ['연료등이 켜졌네요.'] },
    fallbackText: '가벼운 한 잔으로 보죠.',
  },
]

describe('Phase 10 ResponsePlan 선행 계약', () => {
  it('화자·intent·state·request가 가장 구체적인 계획을 선택한다', () => {
    expect(selectResponsePlan(plans, {
      speaker: 'karua',
      intent: 'recommend',
      state: 'tired',
      request: 'light',
    })?.id).toBe('karua.recommend.tired.light')
  })

  it('구체 계획이 없으면 같은 화자와 intent의 기본 계획을 선택한다', () => {
    expect(selectResponsePlan(plans, {
      speaker: 'karua',
      intent: 'recommend',
      state: 'happy',
    })?.id).toBe('karua.recommend.default')
  })

  it('다른 화자나 intent의 첫 항목으로 암묵적으로 떨어지지 않는다', () => {
    expect(selectResponsePlan(plans, { speaker: 'siesta', intent: 'recommend' })).toBeNull()
    expect(selectResponsePlan(plans, { speaker: 'karua', intent: 'goodbye' })).toBeNull()
  })

  it('fallbackText와 비어 있지 않은 블록을 필수로 검증한다', () => {
    expect(validateResponsePlan(plans[0])).toEqual({ valid: true, errors: [] })
    expect(validateResponsePlan({
      id: '',
      intent: 'small_talk',
      speaker: 'karua',
      blocks: {},
      fallbackText: '',
    }).valid).toBe(false)
  })
})

describe('기존 문단 프리셋 fallback 경계', () => {
  it('지원하지 않는 intent를 카루아 추천 프리셋으로 바꾸지 않는다', () => {
    const context = {
      speaker: 'karua' as const,
      intent: 'goodbye' as const,
      slots: {},
    }

    expect(selectParagraphPreset(context)).toBeNull()
    expect(renderParagraphPreset(context, '조심히 가세요.')).toBe('조심히 가세요.')
  })
})
