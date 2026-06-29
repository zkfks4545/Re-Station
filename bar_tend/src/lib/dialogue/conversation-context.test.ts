import { describe, expect, it } from 'vitest'
import {
  createConversationContext,
  getDiscussedCocktailIds,
  getLoreFollowupCocktailId,
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

  it('tracks story-targeted independently and lore-followup chains correctly', () => {
    const discussed = updateConversationContext(createConversationContext(), {
      type: 'discussed',
      cocktailId: 'mojito',
    })
    const targeted = updateConversationContext(discussed, {
      type: 'story-targeted',
      cocktailId: 'martini',
    })

    expect(targeted.lastDiscussedCocktailId).toBe('martini')
    expect(targeted.lastStoryTargetCocktailId).toBe('martini')
    expect(getLoreFollowupCocktailId(targeted)).toBe('martini')
  })

  it('falls back through served → order-candidate → discussed for lore-followup', () => {
    const discussed = updateConversationContext(createConversationContext(), {
      type: 'discussed',
      cocktailId: 'old-fashioned',
    })
    expect(getLoreFollowupCocktailId(discussed)).toBe('old-fashioned')

    const withCandidate = updateConversationContext(discussed, {
      type: 'order-candidate',
      cocktailId: 'negroni',
    })
    expect(getLoreFollowupCocktailId(withCandidate)).toBe('negroni')

    const withServed = updateConversationContext(withCandidate, {
      type: 'served',
      cocktailId: 'martini',
    })
    expect(getLoreFollowupCocktailId(withServed)).toBe('martini')

    const withStoryTargeted = updateConversationContext(withServed, {
      type: 'story-targeted',
      cocktailId: 'daiquiri',
    })
    expect(getLoreFollowupCocktailId(withStoryTargeted)).toBe('daiquiri')
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
