import { describe, expect, it } from 'vitest'
import { getAllCocktailData } from '../cocktails/database.js'
import {
  applyRecommendationSignals,
  buildRecommendationReasons,
  createRecommendationState,
  extractRecommendationSignals,
  filterCocktailsByRecommendationState,
  getQuestionCandidatePool,
  resolveCocktailsByRecommendationState,
} from './state.js'

describe('recommendation state', () => {
  it('extracts structured mood, situation, taste and alcohol signals', () => {
    const signals = extractRecommendationSignals('퇴근했는데 피곤해. 달달하고 도수 낮은 걸로 추천해줘')
    const state = applyRecommendationSignals(createRecommendationState(), signals)

    expect(state.moods).toContain('tired')
    expect(state.situations).toContain('after-work')
    expect(state.taste.sweetness).toBe(0.8)
    expect(state.alcoholPreference).toBe('low')
  })

  it('does not silently replace a non-alcoholic request with alcoholic data', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('무알코올로 추천해줘'),
    )

    expect(filterCocktailsByRecommendationState(getAllCocktailData(), state)).toEqual([])
  })

  it('filters excluded ingredients and returns evidence-based reasons', () => {
    const [mojito] = getAllCocktailData().filter((cocktail) => cocktail.name === '모히토')
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'taste.fizz', value: 0.8, confidence: 1, source: 'question' },
      { field: 'excludedIngredients', value: '민트', confidence: 1, source: 'question' },
    ])

    expect(filterCocktailsByRecommendationState([mojito], state)).toEqual([])
    expect(buildRecommendationReasons(mojito, state)[0]).toMatchObject({
      code: 'taste-match',
      label: '취향 일치',
    })
  })

  it('extracts excluded ingredients in natural Korean word order', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('민트 없이 상큼한 걸로 추천해줘'),
    )

    expect(state.excludedIngredients).toEqual(['민트'])
  })

  it('keeps hard constraints when recovering from an empty exact match', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'preferredIngredients', value: '진', confidence: 1, source: 'question' },
      { field: 'taste.sweetness', value: 0.8, confidence: 1, source: 'question' },
      { field: 'taste.sourness', value: 0.2, confidence: 1, source: 'question' },
      { field: 'taste.fizz', value: 0.1, confidence: 1, source: 'question' },
      { field: 'alcoholPreference', value: 'low', confidence: 1, source: 'question' },
    ])
    const resolved = resolveCocktailsByRecommendationState(getAllCocktailData(), state)

    expect(resolved.exactMatch).toBe(false)
    expect(resolved.cocktails.length).toBeGreaterThan(0)
    expect(resolved.cocktails.every((cocktail) => cocktail.base_spirit === '진')).toBe(true)
  })

  it('keeps a broader hard-constraint pool for follow-up questions after an exact miss', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'preferredIngredients', value: '진', confidence: 1, source: 'question' },
      { field: 'taste.sweetness', value: 0.9, confidence: 1, source: 'question' },
      { field: 'taste.sourness', value: 0.0, confidence: 1, source: 'question' },
      { field: 'taste.fizz', value: 0.9, confidence: 1, source: 'question' },
    ])
    const cocktails = getAllCocktailData()
    const questionCandidates = getQuestionCandidatePool(cocktails, state)
    const nearest = resolveCocktailsByRecommendationState(cocktails, state)

    expect(questionCandidates.exactMatch).toBe(false)
    expect(questionCandidates.cocktails.length).toBeGreaterThan(nearest.cocktails.length)
    expect(questionCandidates.cocktails.every((cocktail) => cocktail.base_spirit === '진')).toBe(true)
  })
})
