import { describe, expect, it } from 'vitest'
import { getCocktailById } from '../cocktails/database.js'
import { formatStoryQueryReply } from './story-query.js'

describe('story and lore query replies', () => {
  it('uses cocktail talking points when a cocktail context is available', () => {
    const cocktail = getCocktailById('cocktail_classic_001')
    expect(cocktail).toBeDefined()

    const reply = formatStoryQueryReply(cocktail!)

    expect(reply.text).toContain(cocktail!.name)
    for (const point of cocktail!.talkingPoints ?? []) {
      expect(reply.text).toContain(point)
      expect(reply.facts).toContain(point)
    }
  })

  it('falls back to general Re:Station lore without a cocktail context', () => {
    const reply = formatStoryQueryReply(null)

    expect(reply.text).toMatch(/Re:Station|가상의 바|잔|흐름/)
    expect(reply.facts).toEqual([reply.text])
  })
})
