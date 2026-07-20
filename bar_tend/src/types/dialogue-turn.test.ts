import { describe, expect, it } from 'vitest'
import { buildDialogueTurn } from '../lib/dialogue/turn-builder.js'
import { validateDialogueTurn } from './dialogue-turn.js'

describe('DialogueTurn contract', () => {
  it('builds a valid turn for safety route', () => {
    const turn = buildDialogueTurn('죽고 싶어', 'safety', '', 'sympathy')
    expect(validateDialogueTurn(turn)).toBe(true)
    expect(turn.intent).toBe('safety-alert')
    expect(turn.action).toBe('safety-redirect')
    expect(turn.responseGoal).toBe('안전 확인과 위기 상담 안내')
    expect(turn.reply).toContain('1393')
    expect(turn.reply.trim().length).toBeGreaterThan(0)
    expect(turn.forbidden).toContain('농담')
  })

  it('builds a valid turn for explicit cocktail order', () => {
    const turn = buildDialogueTurn('모히토 주문', 'explicit-cocktail', '찾으시는군요', 'smirk')
    expect(validateDialogueTurn(turn)).toBe(true)
    expect(turn.intent).toBe('cocktail-order')
    expect(turn.action).toBe('show-info')
    expect(turn.responseGoal).toBe('칵테일 정보 제공')
  })

  it('builds a valid turn for general chat', () => {
    const turn = buildDialogueTurn('날씨 좋다', 'general', '그러네요', 'idle')
    expect(validateDialogueTurn(turn)).toBe(true)
    expect(turn.intent).toBe('general-chat')
    expect(turn.action).toBe('reply')
  })

  it('accepts expanded expression states in the dialogue contract', () => {
    for (const expression of ['annoyed', 'stern', 'disappointed', 'embarrassed'] as const) {
      const turn = buildDialogueTurn('조금 불편해', 'general', '천천히 맞춰볼게요.', expression)
      expect(validateDialogueTurn(turn)).toBe(true)
      expect(turn.expression).toBe(expression)
      expect(turn.statePatch.affectState).toBe('awkward')
    }
  })

  it('maps non-recommendation expressions to affect state patches', () => {
    expect(buildDialogueTurn('힘들어', 'general', '듣고 있어요.', 'sympathy').statePatch.affectState).toBe('concerned')
    expect(buildDialogueTurn('잠깐 생각해볼게', 'general', '볼게요.', 'thinking').statePatch.affectState).toBe('curious')
    expect(buildDialogueTurn('좋네', 'general', '좋아요.', 'smirk').statePatch.affectState).toBe('playful')
    expect(buildDialogueTurn('안녕하세요', 'general', '어서 오세요.', 'talk').statePatch.affectState).toBe('warm')
  })

  it('uses a small fallback template when reply text is missing', () => {
    const turn = buildDialogueTurn('음', 'general', '', 'idle')
    expect(validateDialogueTurn(turn)).toBe(true)
    expect(turn.reply).toBe('알겠습니다. 조금 더 자세히 말씀해 주시면 거기서 이어가죠.')
    expect(turn.facts).toContain(turn.reply)
  })

  it('builds a valid turn with entities extracted', () => {
    const turn = buildDialogueTurn('달콤하고 부드러운 칵테일 추천해줘', 'recommendation', '찾아볼게요', 'thinking')
    expect(turn.entities.tastes).toContain('달콤')
  })

  it('keeps unknown cocktails in a review queue contract', () => {
    const turn = buildDialogueTurn(
      '블루문 한 잔 알려줘',
      'unknown-cocktail-query',
      '',
      'thinking',
      null,
      { confidence: 0.6, entities: { cocktailName: '블루문' } },
    )
    expect(validateDialogueTurn(turn)).toBe(true)
    expect(turn.action).toBe('queue-for-review')
    expect(turn.entities.cocktailName).toBe('블루문')
    expect(turn.reply).toContain('추천 후보로 쓰지는 않을게요')
  })

  it('rejects invalid objects', () => {
    expect(validateDialogueTurn(null)).toBe(false)
    expect(validateDialogueTurn(undefined)).toBe(false)
    expect(validateDialogueTurn({})).toBe(false)
    expect(validateDialogueTurn('string')).toBe(false)
  })

  it('rejects malformed turn candidates before state changes', () => {
    const turn = buildDialogueTurn('모히토 주문', 'explicit-cocktail', '찾으시는군요', 'smirk')
    expect(validateDialogueTurn({ ...turn, intent: 'unsafe-made-up-intent' })).toBe(false)
    expect(validateDialogueTurn({ ...turn, confidence: 1.5 })).toBe(false)
    expect(validateDialogueTurn({ ...turn, routeTags: ['direct-name', 'invalid-tag'] })).toBe(false)
    expect(validateDialogueTurn({ ...turn, statePatch: { dialogueState: 'invalid-state' } })).toBe(false)
    expect(validateDialogueTurn({ ...turn, reply: '' })).toBe(false)
  })
})
