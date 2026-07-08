import { describe, expect, it } from 'vitest'
import {
  formatFarewellBlockReply,
  formatFarewellConversationReply,
  formatReturnHomeReply,
  formatStandardFarewellEntryResponse,
  formatStandardFarewellEntryReply,
  formatWelcomeFarewellXyzReply,
  formatWelcomeXyzClarificationResponse,
  formatWelcomeXyzClarificationReply,
  formatXyzReply,
  isEjectionConcern,
} from './farewell-replies.js'
import { getCocktailById } from '../cocktails/database.js'
import { XYZ_COCKTAIL_ID } from './session-flow.js'
import type { ResponsePlan } from '../dialogue/response-plan.js'

describe('farewell replies', () => {
  it('keeps welcome-drink XYZ clarification separate from farewell meaning', () => {
    const reply = formatWelcomeXyzClarificationReply()

    expect(reply.text).toBe('그런 뜻은 아니에요.')
    expect(reply.expression).toBe('smirk')
  })

  it('keeps welcome-drink XYZ clarification ResponsePlan text and expression equal to legacy', () => {
    expect(formatWelcomeXyzClarificationResponse()).toEqual(
      formatWelcomeXyzClarificationResponse({ plans: [] }),
    )
  })

  it('prioritizes the welcome-drink XYZ clarification ResponsePlan over the legacy formatter', () => {
    const plans: readonly ResponsePlan[] = [{
      id: 'test.welcome-xyz-clarification',
      speaker: 'karua',
      intent: 'goodbye',
      state: 'welcome-xyz-clarification',
      request: 'farewell-xyz-clarification',
      blocks: {
        answer: [{ text: 'plan xyz clarification', expression: 'thinking' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatWelcomeXyzClarificationResponse({ plans })).toEqual({
      text: 'plan xyz clarification',
      expression: 'thinking',
    })
  })

  it.each([
    { text: '', expression: 'smirk' },
    { text: 'bad:{opening}', expression: 'smirk' },
    { text: 'bad', expression: '' },
  ])('falls back safely when welcome-drink XYZ clarification ResponsePlan is invalid', ({ text, expression }) => {
    const plans = [{
      id: `test.welcome-xyz-clarification.${text || 'empty'}`,
      speaker: 'karua',
      intent: 'goodbye',
      state: 'welcome-xyz-clarification',
      request: 'farewell-xyz-clarification',
      blocks: {
        answer: [{ text, expression }],
      },
      fallbackText: 'fallback',
    }] as unknown as readonly ResponsePlan[]

    expect(formatWelcomeXyzClarificationResponse({ plans })).toEqual(
      formatWelcomeXyzClarificationResponse({ plans: [] }),
    )
  })

  it('clarifies farewell XYZ as an order stop, not an immediate ejection', () => {
    const reply = formatFarewellConversationReply('이거 나가라는뜻은 아니죠?')

    expect(reply.text).toContain('새 주문은 여기까지')
    expect(reply.text).not.toContain('그런 뜻은 아니에요')
    expect(reply.expression).toBe('smirk')
  })

  it('detects ejection concerns from user wording', () => {
    expect(isEjectionConcern('이거 나가라는뜻은 아니죠?')).toBe(true)
    expect(isEjectionConcern('조금 더 이야기해도 돼?')).toBe(false)
  })

  it('keeps generic farewell talk inside the closing phase', () => {
    const reply = formatFarewellConversationReply('조금 더 이야기해도 돼?')

    expect(reply.text).toContain('새 주문은 여기서 멈출게요')
    expect(reply.expression).toBe('talk')
  })

  it('does not mention XYZ after an alcohol-free farewell entry', () => {
    const reply = formatFarewellConversationReply('조금 더 이야기해도 돼?', { hasXyz: false })
    expect(reply.text).not.toContain('XYZ')
    expect(reply.text).toContain('새 잔을 더 놓지 않을게요')
  })

  it('separates regular XYZ from Welcome-Farewell XYZ', () => {
    const xyz = getCocktailById(XYZ_COCKTAIL_ID)

    expect(xyz).not.toBeNull()
    expect(formatXyzReply(xyz!)).toContain('오늘의 마지막 서비스입니다')
    expect(formatWelcomeFarewellXyzReply(xyz!)).toContain('첫 잔과 마지막 잔을 겸해서')
  })

  it('provides a standard farewell without inventing another drink', () => {
    expect(formatStandardFarewellEntryReply()).not.toContain('한 잔으로')
  })

  it('keeps standard farewell entry ResponsePlan text and expression equal to legacy', () => {
    expect(formatStandardFarewellEntryResponse()).toEqual({
      text: formatStandardFarewellEntryResponse({ plans: [] }).text,
      expression: 'sympathy',
    })
  })

  it('prioritizes the standard farewell entry ResponsePlan over the legacy formatter', () => {
    const plans: readonly ResponsePlan[] = [{
      id: 'test.standard-farewell-entry',
      speaker: 'karua',
      intent: 'goodbye',
      state: 'standard',
      request: 'farewell-entry',
      blocks: {
        answer: [{ text: 'plan farewell', expression: 'talk' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatStandardFarewellEntryResponse({ plans })).toEqual({
      text: 'plan farewell',
      expression: 'talk',
    })
  })

  it.each([
    { text: '', expression: 'sympathy' },
    { text: 'bad:{opening}', expression: 'sympathy' },
    { text: 'bad', expression: '' },
  ])('falls back safely when standard farewell entry ResponsePlan is invalid', ({ text, expression }) => {
    const plans = [{
      id: `test.standard-farewell-entry.${text || 'empty'}`,
      speaker: 'karua',
      intent: 'goodbye',
      state: 'standard',
      request: 'farewell-entry',
      blocks: {
        answer: [{ text, expression }],
      },
      fallbackText: 'fallback',
    }] as unknown as readonly ResponsePlan[]

    expect(formatStandardFarewellEntryResponse({ plans })).toEqual(
      formatStandardFarewellEntryResponse({ plans: [] }),
    )
  })

  it('keeps order blocking and return-home replies in the session reply module', () => {
    expect(formatFarewellBlockReply()).toContain('오늘 주문은 여기까지')
    expect(formatReturnHomeReply()).toContain('조심히 들어가세요')
  })

})
