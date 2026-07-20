import { describe, expect, it } from 'vitest'
import type { Expression } from '../../../types.js'
import { KARUA_EXPRESSION_FALLBACKS, KARUA_STATIC_SPRITES } from './sprites.js'

const EXPRESSIONS: Expression[] = [
  'idle', 'talk', 'surprised', 'smirk', 'sympathy',
  'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed',
]

describe('Karua sprite slots', () => {
  it('maps every expression to an imported sprite and explicit fallback slot', () => {
    for (const expression of EXPRESSIONS) {
      expect(KARUA_STATIC_SPRITES[expression]).toBeTruthy()
      expect(KARUA_STATIC_SPRITES[KARUA_EXPRESSION_FALLBACKS[expression]]).toBeTruthy()
    }
  })

  it('keeps only the unillustrated talk slot on approved fallback artwork', () => {
    expect(KARUA_EXPRESSION_FALLBACKS).toMatchObject({
      talk: 'idle',
      surprised: 'surprised',
      sympathy: 'sympathy',
      annoyed: 'annoyed',
      stern: 'stern',
      disappointed: 'disappointed',
    })
  })
})
