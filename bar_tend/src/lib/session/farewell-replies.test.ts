import { describe, expect, it } from 'vitest'
import {
  formatFarewellBlockResponse,
  formatFarewellBlockReply,
  formatFarewellConversationReply,
  formatReturnHomeResponse,
  formatReturnHomeReply,
  formatStandardFarewellEntryResponse,
  formatStandardFarewellEntryReply,
  formatWelcomeFarewellXyzReply,
  formatWelcomeFarewellXyzResponse,
  formatWelcomeXyzClarificationResponse,
  formatWelcomeXyzClarificationReply,
  formatXyzReply,
  formatXyzResponse,
  FAREWELL_REPLY_SOURCE_OWNERSHIP,
  isEjectionConcern,
} from './farewell-replies.js'
import { getCocktailById } from '../cocktails/database.js'
import { XYZ_COCKTAIL_ID } from './session-flow.js'
import type { ResponsePlan } from '../dialogue/response-plan.js'

describe('farewell replies', () => {
  it('documents Phase 11 source ownership for farewell replies', () => {
    expect(FAREWELL_REPLY_SOURCE_OWNERSHIP).toEqual({
      stateSelection: 'farewell-replies',
      finalReplyText: 'ResponsePlan',
      fallbackText: 'farewell-replies safety fallback',
    })
  })

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

  it.each([
    {
      input: '이거 쫓아내는 건가요?',
      hasXyz: false,
      state: 'no-xyz-ejection',
      expression: 'sympathy',
    },
    {
      input: '조금 더 이야기해도 돼?',
      hasXyz: false,
      state: 'no-xyz-generic',
      expression: 'talk',
    },
    {
      input: '이거 나가라는뜻은 아니죠?',
      hasXyz: true,
      state: 'xyz-ejection',
      expression: 'smirk',
    },
    {
      input: '왜 XYZ가 마지막이야?',
      hasXyz: true,
      state: 'xyz-why',
      expression: 'thinking',
    },
    {
      input: '조금 더 이야기해도 돼?',
      hasXyz: true,
      state: 'xyz-generic',
      expression: 'talk',
    },
  ])('keeps farewell conversation $state ResponsePlan text and expression equal to legacy', ({ input, hasXyz, expression }) => {
    expect(formatFarewellConversationReply(input, { hasXyz })).toEqual({
      text: formatFarewellConversationReply(input, { hasXyz, plans: [] }).text,
      expression,
    })
  })

  it('prioritizes the farewell conversation ResponsePlan over the legacy formatter', () => {
    const plans: readonly ResponsePlan[] = [{
      id: 'test.farewell-conversation',
      speaker: 'karua',
      intent: 'goodbye',
      state: 'xyz-why',
      request: 'farewell-conversation',
      blocks: {
        answer: [{ text: 'plan farewell conversation', expression: 'smirk' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatFarewellConversationReply('왜 XYZ가 마지막이야?', { plans })).toEqual({
      text: 'plan farewell conversation',
      expression: 'smirk',
    })
  })

  it.each([
    { text: '', expression: 'talk' },
    { text: 'bad:{opening}', expression: 'talk' },
    { text: 'bad', expression: '' },
  ])('falls back safely when farewell conversation ResponsePlan is invalid', ({ text, expression }) => {
    const plans = [{
      id: `test.farewell-conversation.${text || 'empty'}`,
      speaker: 'karua',
      intent: 'goodbye',
      state: 'xyz-generic',
      request: 'farewell-conversation',
      blocks: {
        answer: [{ text, expression }],
      },
      fallbackText: 'fallback',
    }] as unknown as readonly ResponsePlan[]

    expect(formatFarewellConversationReply('조금 더 이야기해도 돼?', { plans })).toEqual(
      formatFarewellConversationReply('조금 더 이야기해도 돼?', { plans: [] }),
    )
  })

  it('separates regular XYZ from Welcome-Farewell XYZ', () => {
    const xyz = getCocktailById(XYZ_COCKTAIL_ID)

    expect(xyz).not.toBeNull()
    expect(formatXyzReply(xyz!)).toContain('오늘의 마지막 서비스입니다')
    expect(formatWelcomeFarewellXyzReply(xyz!)).toContain('첫 잔과 마지막 잔을 겸해서')
  })

  it('keeps welcome-farewell XYZ ResponsePlan text and expression equal to legacy', () => {
    const xyz = getCocktailById(XYZ_COCKTAIL_ID)

    expect(xyz).not.toBeNull()
    expect(formatWelcomeFarewellXyzResponse(xyz!)).toEqual({
      text: formatWelcomeFarewellXyzResponse(xyz!, { plans: [] }).text,
      expression: 'smirk',
    })
  })

  it('prioritizes the welcome-farewell XYZ ResponsePlan over the legacy formatter', () => {
    const xyz = getCocktailById(XYZ_COCKTAIL_ID)
    const plans: readonly ResponsePlan[] = [{
      id: 'test.farewell-welcome-xyz',
      speaker: 'karua',
      intent: 'goodbye',
      state: 'welcome-farewell-xyz',
      request: 'farewell-welcome-xyz-body',
      blocks: {
        answer: [{ text: 'welcome plan {cocktail_name}', expression: 'thinking' }],
      },
      fallbackText: 'fallback',
    }]

    expect(xyz).not.toBeNull()
    expect(formatWelcomeFarewellXyzResponse(xyz!, { plans })).toEqual({
      text: `welcome plan ${xyz!.name_ko ?? xyz!.name}`,
      expression: 'thinking',
    })
  })

  it.each([
    { text: '', expression: 'smirk' },
    { text: 'bad:{opening}', expression: 'smirk' },
    { text: 'bad {cocktail_name}', expression: '' },
  ])('falls back safely when welcome-farewell XYZ ResponsePlan is invalid', ({ text, expression }) => {
    const xyz = getCocktailById(XYZ_COCKTAIL_ID)
    const plans = [{
      id: `test.farewell-welcome-xyz.${text || 'empty'}`,
      speaker: 'karua',
      intent: 'goodbye',
      state: 'welcome-farewell-xyz',
      request: 'farewell-welcome-xyz-body',
      blocks: {
        answer: [{ text, expression }],
      },
      fallbackText: 'fallback',
    }] as unknown as readonly ResponsePlan[]

    expect(xyz).not.toBeNull()
    expect(formatWelcomeFarewellXyzResponse(xyz!, { plans })).toEqual(
      formatWelcomeFarewellXyzResponse(xyz!, { plans: [] }),
    )
  })

  it('keeps XYZ ResponsePlan text and expression equal to legacy', () => {
    const xyz = getCocktailById(XYZ_COCKTAIL_ID)

    expect(xyz).not.toBeNull()
    expect(formatXyzResponse(xyz!)).toEqual({
      text: formatXyzResponse(xyz!, { plans: [] }).text,
      expression: 'smirk',
    })
  })

  it('prioritizes the XYZ ResponsePlan over the legacy formatter', () => {
    const xyz = getCocktailById(XYZ_COCKTAIL_ID)
    const plans: readonly ResponsePlan[] = [{
      id: 'test.farewell-xyz',
      speaker: 'karua',
      intent: 'goodbye',
      state: 'alcohol-xyz',
      request: 'farewell-xyz-body',
      blocks: {
        answer: [{ text: 'plan {cocktail_name}', expression: 'thinking' }],
      },
      fallbackText: 'fallback',
    }]

    expect(xyz).not.toBeNull()
    expect(formatXyzResponse(xyz!, { plans })).toEqual({
      text: `plan ${xyz!.name_ko ?? xyz!.name}`,
      expression: 'thinking',
    })
  })

  it.each([
    { text: '', expression: 'smirk' },
    { text: 'bad:{opening}', expression: 'smirk' },
    { text: 'bad {cocktail_name}', expression: '' },
  ])('falls back safely when XYZ ResponsePlan is invalid', ({ text, expression }) => {
    const xyz = getCocktailById(XYZ_COCKTAIL_ID)
    const plans = [{
      id: `test.farewell-xyz.${text || 'empty'}`,
      speaker: 'karua',
      intent: 'goodbye',
      state: 'alcohol-xyz',
      request: 'farewell-xyz-body',
      blocks: {
        answer: [{ text, expression }],
      },
      fallbackText: 'fallback',
    }] as unknown as readonly ResponsePlan[]

    expect(xyz).not.toBeNull()
    expect(formatXyzResponse(xyz!, { plans })).toEqual(
      formatXyzResponse(xyz!, { plans: [] }),
    )
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

  it('keeps farewell block ResponsePlan text and expression equal to legacy', () => {
    expect(formatFarewellBlockResponse()).toEqual({
      text: formatFarewellBlockResponse({ plans: [] }).text,
      expression: 'smirk',
    })
  })

  it('prioritizes the farewell block ResponsePlan over the legacy formatter', () => {
    const plans: readonly ResponsePlan[] = [{
      id: 'test.farewell-block',
      speaker: 'karua',
      intent: 'goodbye',
      state: 'ordering-blocked',
      request: 'farewell-block',
      blocks: {
        answer: [{ text: 'plan farewell block', expression: 'thinking' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatFarewellBlockResponse({ plans })).toEqual({
      text: 'plan farewell block',
      expression: 'thinking',
    })
  })

  it('keeps return-home ResponsePlan text and expression equal to legacy', () => {
    expect(formatReturnHomeResponse()).toEqual({
      text: formatReturnHomeResponse({ plans: [] }).text,
      expression: 'idle',
    })
  })

  it('prioritizes the return-home ResponsePlan over the legacy formatter', () => {
    const plans: readonly ResponsePlan[] = [{
      id: 'test.return-home',
      speaker: 'karua',
      intent: 'goodbye',
      state: 'return-home',
      request: 'farewell-return-home',
      blocks: {
        answer: [{ text: 'plan return home', expression: 'sympathy' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatReturnHomeResponse({ plans })).toEqual({
      text: 'plan return home',
      expression: 'sympathy',
    })
  })

  it.each([
    {
      label: 'farewell block',
      request: 'farewell-block',
      state: 'ordering-blocked',
      render: (plans: readonly ResponsePlan[]) => formatFarewellBlockResponse({ plans }),
      fallback: () => formatFarewellBlockResponse({ plans: [] }),
    },
    {
      label: 'return home',
      request: 'farewell-return-home',
      state: 'return-home',
      render: (plans: readonly ResponsePlan[]) => formatReturnHomeResponse({ plans }),
      fallback: () => formatReturnHomeResponse({ plans: [] }),
    },
  ])('falls back safely when $label ResponsePlan is invalid', ({ request, state, render, fallback }) => {
    const plans = [{
      id: `test.${request}.invalid`,
      speaker: 'karua',
      intent: 'goodbye',
      state,
      request,
      blocks: {
        answer: [{ text: 'bad:{opening}', expression: 'smirk' }],
      },
      fallbackText: 'fallback',
    }] as unknown as readonly ResponsePlan[]

    expect(render(plans)).toEqual(fallback())
  })

})
