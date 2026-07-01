import { describe, expect, it } from 'vitest'
import { createConversationContext, updateConversationContext } from '../dialogue/conversation-context.js'
import type { UserReaction } from '../dialogue/reaction-layer.js'
import { addExcludedCocktailId, getFeedbackExcludedCocktailId } from './feedback-exclusion.js'

const negative: UserReaction = {
  type: 'negative-feedback',
  reply: '별로였군요.',
  tone: 'thinking',
}

describe('recommendation feedback exclusion', () => {
  it('targets the latest recommended cocktail for negative feedback', () => {
    const context = updateConversationContext(createConversationContext(), {
      type: 'recommended',
      cocktailId: 'mojito',
    })

    expect(getFeedbackExcludedCocktailId(negative, context)).toBe('mojito')
  })

  it('keeps the exclusion list unique', () => {
    expect(addExcludedCocktailId(['mojito'], 'mojito')).toEqual(['mojito'])
    expect(addExcludedCocktailId(['mojito'], 'martini')).toEqual(['mojito', 'martini'])
  })
})
