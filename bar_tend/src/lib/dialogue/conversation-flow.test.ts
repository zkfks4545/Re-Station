import { describe, expect, it } from 'vitest'
import { getContentLeadReaction } from './conversation-flow.js'

describe('conversation flow reactions', () => {
  it('uses a short reaction before each kind of cocktail content', () => {
    expect(getContentLeadReaction('story-query', { hasCocktail: true, isFollowup: false }))
      .toBe('그 이야기는 꽤 유명하죠.')
    expect(getContentLeadReaction('lore-query', { hasCocktail: true, isFollowup: false }))
      .not.toBe(getContentLeadReaction('cocktail-info-query', { hasCocktail: true, isFollowup: false }))
  })

  it('uses a continuation reaction after a fact was already disclosed', () => {
    expect(getContentLeadReaction('story-query', { hasCocktail: true, isFollowup: true }))
      .toBe('조금 더 이어가보죠.')
  })
})
