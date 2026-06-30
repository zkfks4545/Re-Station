import { describe, expect, it } from 'vitest'
import { getCocktailById } from '../cocktails/database.js'
import {
  formatStoryQueryReply,
  getSelectedCocktailStoryFactKey,
} from './story-query.js'

describe('story and lore query replies', () => {
  it('reveals one new cocktail fact at a time without repetition', () => {
    const cocktail = getCocktailById('cocktail_classic_001')
    expect(cocktail).toBeDefined()

    const first = formatStoryQueryReply(cocktail!)
    const second = formatStoryQueryReply(cocktail!, first.factKeys)

    expect(first.facts).toHaveLength(1)
    expect(first.factKeys).toHaveLength(1)
    expect(first.text.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(2)
    expect(second.factKeys).toHaveLength(1)
    expect(second.factKeys[0]).not.toBe(first.factKeys[0])
    expect(second.text).not.toBe(first.text)
  })

  it('skips the story fragment already used while serving', () => {
    const cocktail = getCocktailById('cocktail_signature_043')!
    const servedFactKey = getSelectedCocktailStoryFactKey(cocktail)
    expect(servedFactKey).not.toBeNull()

    const reply = formatStoryQueryReply(cocktail, [servedFactKey!])

    expect(reply.factKeys).not.toContain(servedFactKey)
  })

  it('closes naturally after every available fact is exhausted', () => {
    const cocktail = getCocktailById('cocktail_signature_043')!
    const disclosed: string[] = []
    let reply = formatStoryQueryReply(cocktail, disclosed)

    while (reply.factKeys.length > 0) {
      disclosed.push(...reply.factKeys)
      reply = formatStoryQueryReply(cocktail, disclosed)
    }

    expect(reply.text).toBe('이 정도가 이 잔에 얽힌 이야기의 대부분이에요.')
  })

  it('falls back to general Re:Station lore without a cocktail context', () => {
    const reply = formatStoryQueryReply(null)

    expect(reply.text).toMatch(/Re:Station|가상의 바|잔|흐름/)
    expect(reply.facts).toEqual([reply.text])
    expect(reply.factKeys).toEqual([])
  })
})
