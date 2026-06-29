import { describe, expect, it } from 'vitest'
import {
  createConversationContext,
  getDiscussedCocktailIds,
  getOrderCandidateCocktailId,
  getStoryCocktailId,
  updateConversationContext,
} from './conversation-context.js'

describe('conversation context', () => {
  it('uses a discussed cocktail as the next order candidate', () => {
    const state = updateConversationContext(createConversationContext(), {
      type: 'discussed',
      cocktailId: 'mojito',
    })

    expect(state.lastDiscussedCocktailId).toBe('mojito')
    expect(getOrderCandidateCocktailId(state)).toBe('mojito')
    expect(getStoryCocktailId(state)).toBe('mojito')
  })

  it('tracks recommended and served cocktails independently', () => {
    const recommended = updateConversationContext(createConversationContext(), {
      type: 'recommended',
      cocktailId: 'mojito',
    })
    const served = updateConversationContext(recommended, {
      type: 'served',
      cocktailId: 'martini',
    })

    expect(served.lastRecommendedCocktailId).toBe('mojito')
    expect(served.lastServedCocktailId).toBe('martini')
    expect(getOrderCandidateCocktailId(served)).toBe('martini')
    expect(getDiscussedCocktailIds(served)).toEqual(['martini', 'mojito'])
  })

  it('clears every reference on reset', () => {
    const state = updateConversationContext(
      updateConversationContext(createConversationContext(), {
        type: 'served',
        cocktailId: 'mojito',
      }),
      { type: 'reset' },
    )

    expect(state).toEqual(createConversationContext())
  })
})
