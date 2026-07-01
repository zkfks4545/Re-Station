import { describe, expect, it } from 'vitest'
import {
  createConversationContext,
  getDisclosedCocktailFactKeys,
  getDiscussedCocktailIds,
  getLoreFollowupCocktailId,
  getOrderCandidateCocktailId,
  getStoryCocktailId,
  updateConversationContext,
} from './conversation-context.js'

describe('conversation context', () => {
  const seededState = {
    lastDiscussedCocktailId: 'discussed',
    lastRecommendedCocktailId: 'recommended',
    lastServedCocktailId: 'served',
    lastOrderCandidateCocktailId: 'candidate',
    lastStoryTargetCocktailId: 'story',
    disclosedFactKeysByCocktailId: { mojito: ['story:0'] },
  }

  it.each([
    ['discussed', { type: 'discussed', cocktailId: 'next' }, {
      ...seededState,
      lastDiscussedCocktailId: 'next',
      lastOrderCandidateCocktailId: 'next',
    }],
    ['recommended', { type: 'recommended', cocktailId: 'next' }, {
      ...seededState,
      lastDiscussedCocktailId: 'next',
      lastRecommendedCocktailId: 'next',
      lastOrderCandidateCocktailId: 'next',
    }],
    ['served', { type: 'served', cocktailId: 'next' }, {
      ...seededState,
      lastDiscussedCocktailId: 'next',
      lastServedCocktailId: 'next',
      lastOrderCandidateCocktailId: 'next',
      lastStoryTargetCocktailId: 'next',
    }],
    ['order-candidate', { type: 'order-candidate', cocktailId: 'next' }, {
      ...seededState,
      lastOrderCandidateCocktailId: 'next',
    }],
    ['story-targeted', { type: 'story-targeted', cocktailId: 'next' }, {
      ...seededState,
      lastDiscussedCocktailId: 'next',
      lastStoryTargetCocktailId: 'next',
    }],
  ] as const)('applies only the contracted fields for %s', (_name, event, expected) => {
    expect(updateConversationContext(seededState, event)).toEqual(expected)
  })

  it('uses the contracted selector priorities', () => {
    expect(getOrderCandidateCocktailId(seededState)).toBe('candidate')
    expect(getStoryCocktailId(seededState)).toBe('discussed')
    expect(getLoreFollowupCocktailId(seededState)).toBe('story')

    const withoutPrimaryReferences = {
      ...seededState,
      lastDiscussedCocktailId: null,
      lastOrderCandidateCocktailId: null,
      lastStoryTargetCocktailId: null,
    }
    expect(getOrderCandidateCocktailId(withoutPrimaryReferences)).toBe('recommended')
    expect(getStoryCocktailId(withoutPrimaryReferences)).toBe('recommended')
    expect(getLoreFollowupCocktailId(withoutPrimaryReferences)).toBe('served')
  })

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

  it('tracks disclosed facts per cocktail without duplicates', () => {
    const first = updateConversationContext(createConversationContext(), {
      type: 'fact-disclosed',
      cocktailId: 'mojito',
      factKey: 'story:0',
    })
    const duplicate = updateConversationContext(first, {
      type: 'fact-disclosed',
      cocktailId: 'mojito',
      factKey: 'story:0',
    })
    const secondCocktail = updateConversationContext(duplicate, {
      type: 'fact-disclosed',
      cocktailId: 'martini',
      factKey: 'recipe',
    })

    expect(getDisclosedCocktailFactKeys(secondCocktail, 'mojito')).toEqual(['story:0'])
    expect(getDisclosedCocktailFactKeys(secondCocktail, 'martini')).toEqual(['recipe'])
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
