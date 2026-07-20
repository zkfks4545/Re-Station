import { describe, expect, it } from 'vitest'
import {
  estimateTypingFallbackDelay,
  mapIntentToRapportContext,
} from './restation-controller-model.js'

describe('restation controller model', () => {
  it('keeps presentation timing and rapport mapping outside the controller hook', () => {
    expect(estimateTypingFallbackDelay('가')).toBeLessThan(estimateTypingFallbackDelay('가나다'))
    expect(mapIntentToRapportContext('order-cocktail')).toBe('cocktail-order')
    expect(mapIntentToRapportContext('unknown-intent')).toBe('unknown-intent')
  })
})
