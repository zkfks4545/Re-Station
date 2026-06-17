import { describe, expect, it } from 'vitest'
import { buildDialogueTurn } from '../lib/dialogue/turn-builder.js'
import { validateDialogueTurn } from './dialogue-turn.js'

describe('DialogueTurn contract', () => {
  it('builds a valid turn for safety route', () => {
    const turn = buildDialogueTurn('죽고 싶어', 'safety', '', 'sympathy')
    expect(validateDialogueTurn(turn)).toBe(true)
    expect(turn.intent).toBe('safety-alert')
    expect(turn.action).toBe('safety-redirect')
    expect(turn.forbidden).toContain('농담')
  })

  it('builds a valid turn for explicit cocktail order', () => {
    const turn = buildDialogueTurn('모히토 주문', 'explicit-cocktail', '찾으시는군요', 'smirk')
    expect(validateDialogueTurn(turn)).toBe(true)
    expect(turn.intent).toBe('cocktail-order')
    expect(turn.action).toBe('show-info')
  })

  it('builds a valid turn for general chat', () => {
    const turn = buildDialogueTurn('날씨 좋다', 'general', '그러네요', 'idle')
    expect(validateDialogueTurn(turn)).toBe(true)
    expect(turn.intent).toBe('general-chat')
    expect(turn.action).toBe('reply')
  })

  it('builds a valid turn with entities extracted', () => {
    const turn = buildDialogueTurn('달콤하고 부드러운 칵테일 추천해줘', 'recommendation', '찾아볼게요', 'thinking')
    expect(turn.entities.tastes).toContain('달콤')
  })

  it('rejects invalid objects', () => {
    expect(validateDialogueTurn(null)).toBe(false)
    expect(validateDialogueTurn(undefined)).toBe(false)
    expect(validateDialogueTurn({})).toBe(false)
    expect(validateDialogueTurn('string')).toBe(false)
  })
})
