import { describe, expect, it } from 'vitest'
import {
  formatFarewellBlockReply,
  formatFarewellConversationReply,
  formatReturnHomeReply,
  formatWelcomeXyzClarificationReply,
  formatXyzReply,
  isEjectionConcern,
} from './farewell-replies.js'
import { getCocktailById } from '../cocktails/database.js'
import { XYZ_COCKTAIL_ID } from './session-flow.js'

describe('farewell replies', () => {
  it('keeps welcome-drink XYZ clarification separate from farewell meaning', () => {
    const reply = formatWelcomeXyzClarificationReply()

    expect(reply.text).toBe('그런 뜻은 아니에요.')
    expect(reply.expression).toBe('smirk')
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

  it('formats XYZ as the final drink with welcome-drink context', () => {
    const xyz = getCocktailById(XYZ_COCKTAIL_ID)

    expect(xyz).not.toBeNull()
    expect(formatXyzReply(xyz!, { welcomeDrinkUsed: true })).toContain('오늘의 마지막 서비스입니다')
    expect(formatXyzReply(xyz!, { welcomeDrinkUsed: false })).toContain('웰컴드링크를 끝내 못 드렸네요')
  })

  it('keeps order blocking and return-home replies in the session reply module', () => {
    expect(formatFarewellBlockReply()).toContain('오늘 주문은 여기까지')
    expect(formatReturnHomeReply()).toContain('조심히 들어가세요')
  })
})
