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
    blocks: { reaction: [{ text: '조건은 잡혔네요.', expression: 'talk' }] },
    fallbackText: '한 잔 골라볼게요.',
  },
  {
    id: 'karua.recommend.tired.light',
    intent: 'recommend',
    speaker: 'karua',
    state: 'tired',
    request: 'light',
    blocks: { reaction: [{ text: '연료등이 켜졌네요.', expression: 'thinking' }] },
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

  it('expression이 없는 ResponsePlanLine을 거부한다', () => {
    const invalid = {
      ...plans[0],
      blocks: { reaction: [{ text: '표정이 빠진 문장입니다.' }] },
    } as unknown as ResponsePlan

    expect(validateResponsePlan(invalid)).toEqual({
      valid: false,
      errors: ['reaction 블록 문장에 expression이 없습니다.'],
    })
  })

  it('문자열 line을 타입과 runtime validation에서 허용하지 않는다', () => {
    const compileTimeContract: ResponsePlan = {
      ...plans[0],
      blocks: {
        // @ts-expect-error ResponsePlan blocks require ResponsePlanLine objects.
        reaction: ['문자열 line은 허용하지 않습니다.'],
      },
    }
    const invalid = compileTimeContract as unknown as ResponsePlan

    expect(validateResponsePlan(invalid)).toEqual({
      valid: false,
      errors: ['reaction 블록에는 ResponsePlanLine 객체만 사용할 수 있습니다.'],
    })
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
