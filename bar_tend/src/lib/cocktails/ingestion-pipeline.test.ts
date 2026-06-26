import { beforeEach, describe, expect, it } from 'vitest'
import { getQueue, resetQueue } from './admin-queue-manager.js'
import { processRecipeCandidate } from './ingestion-pipeline.js'

const baseInput = {
  requestContext: '신규 칵테일 후보',
  recipe: '진 45 ml, 레몬 주스 20 ml, 설탕 시럽 10 ml',
  ingredients: ['진', '레몬 주스', '설탕 시럽'],
  baseSpirit: '진',
  features: {
    sweetness: 0.45,
    alcohol_strength: 0.55,
    fizz: 0.1,
    sourness: 0.7,
  },
}

describe('IBA-first ingestion pipeline', () => {
  beforeEach(() => {
    resetQueue()
  })

  it('promotes IBA official candidates into normalized records', () => {
    const result = processRecipeCandidate({
      ...baseInput,
      name: 'White Lady',
      recipeSourceUrl: 'https://iba-world.com/iba-cocktail/white-lady/',
      officialCategory: 'The Unforgettables',
    })

    expect(result.outcome).toBe('official-record')
    if (result.outcome !== 'official-record') return
    expect(result.record.type).toBe('CLASSIC')
    expect(result.record.recipe_source_url).toContain('/white-lady/')
    expect(result.record.description).toMatch(/칵테일입니다\.$/)
    expect(getQueue().candidates).toHaveLength(0)
  })

  it('queues clear non-IBA signature recipes for admin review', () => {
    const result = processRecipeCandidate({
      ...baseInput,
      name: 'Station Sour',
      barName: 'Re:Station',
      barLocation: 'https://example.test/restation',
      sourceUrl: 'https://example.test/menu',
    })

    expect(result.outcome).toBe('queued-for-review')
    if (result.outcome !== 'queued-for-review') return
    expect(result.candidate.itemType).toBe('signatureCandidate')
    expect(result.candidate.status).toBe('open')
    expect(getQueue().candidates).toHaveLength(1)
  })

  it('queues missing recipe information without creating recommendation candidates', () => {
    const result = processRecipeCandidate({
      name: 'Mystery Blue',
      requestContext: '미스터리 블루 알려줘',
      ingredients: [],
      features: baseInput.features,
    })

    expect(result.outcome).toBe('queued-for-review')
    if (result.outcome !== 'queued-for-review') return
    expect(result.candidate.itemType).toBe('unknownCocktail')
    expect(result.candidate.status).toBe('open')
    expect(result.candidate.failureReason).toBe('recipe-or-ingredient-missing')
  })

  it('queues conflicting search results instead of choosing one automatically', () => {
    const result = processRecipeCandidate({
      ...baseInput,
      name: 'Blue Moon',
      conflictReason: 'conflicting ingredient lists',
      searchResults: [
        { name: 'Blue Moon', source: 'source-a', url: 'https://example.test/a' },
        { name: 'Blue Moon', source: 'source-b', url: 'https://example.test/b' },
      ],
    })

    expect(result.outcome).toBe('queued-for-review')
    if (result.outcome !== 'queued-for-review') return
    expect(result.candidate.itemType).toBe('conflictingSearchResult')
    expect(result.candidate.status).toBe('open')
    expect(result.reasons.join(' ')).toContain('충돌')
  })

  it('does not label non-IBA candidates as official or classic in generated output', () => {
    const result = processRecipeCandidate({
      ...baseInput,
      name: 'Station Sour',
      barName: 'Re:Station',
    })

    expect(result.outcome).toBe('queued-for-review')
    if (result.outcome !== 'queued-for-review') return
    expect(JSON.stringify(result.candidate)).not.toMatch(/공식|정통|클래식/)
  })
})
