import { describe, expect, it } from 'vitest'
import {
  isRecommendationBlockedInPhase,
  isOrderingClosedPhase,
  nextPhaseAfterServedCocktail,
  shouldServeXyzAfterAlcoholLimit,
} from './session-flow.js'

describe('closed Re:Station session flow', () => {
  it('names the phases where new orders are closed', () => {
    expect(isOrderingClosedPhase('entry')).toBe(false)
    expect(isOrderingClosedPhase('aftertalk')).toBe(false)
    expect(isOrderingClosedPhase('xyz')).toBe(true)
    expect(isOrderingClosedPhase('farewell')).toBe(true)
    expect(isOrderingClosedPhase('safetyLocked')).toBe(true)
    expect(isOrderingClosedPhase('returnHome')).toBe(true)
  })

  it('serves XYZ after a served cocktail brings the alcohol star total to the limit', () => {
    expect(shouldServeXyzAfterAlcoholLimit({
      current: 'aftertalk',
      alcoholStarTotal: 10,
      isXyz: false,
    })).toBe(true)

    expect(shouldServeXyzAfterAlcoholLimit({
      current: 'aftertalk',
      alcoholStarTotal: 9,
      isXyz: false,
    })).toBe(false)
  })

  it('does not use the alcohol limit rule for closed phases or the XYZ drink itself', () => {
    expect(shouldServeXyzAfterAlcoholLimit({
      current: 'farewell',
      alcoholStarTotal: 10,
      isXyz: false,
    })).toBe(false)

    expect(shouldServeXyzAfterAlcoholLimit({
      current: 'aftertalk',
      alcoholStarTotal: 10,
      isXyz: true,
    })).toBe(false)
  })

  it('blocks new recommendations and orders after XYZ has closed ordering', () => {
    expect(isRecommendationBlockedInPhase('farewell', 'recommendation')).toBe(true)
    expect(isRecommendationBlockedInPhase('farewell', 'random-recommendation')).toBe(true)
    expect(isRecommendationBlockedInPhase('farewell', 'explicit-cocktail')).toBe(true)
    expect(isRecommendationBlockedInPhase('farewell', 'unknown-cocktail-query')).toBe(true)
    expect(isRecommendationBlockedInPhase('farewell', 'general')).toBe(false)
    expect(isRecommendationBlockedInPhase('farewell', 'story-query')).toBe(false)
    expect(isRecommendationBlockedInPhase('farewell', 'lore-query')).toBe(false)
    expect(isRecommendationBlockedInPhase('farewell', 'cocktail-info-query')).toBe(false)
    expect(isRecommendationBlockedInPhase('farewell', 'character-query')).toBe(false)
    expect(isRecommendationBlockedInPhase('safetyLocked', 'recommendation')).toBe(true)
    expect(isRecommendationBlockedInPhase('safetyLocked', 'explicit-cocktail')).toBe(true)
  })

  it('moves into farewell after the XYZ drink is served', () => {
    expect(nextPhaseAfterServedCocktail({ current: 'xyz', isXyz: true })).toBe('farewell')
    expect(nextPhaseAfterServedCocktail({ current: 'recommending', isXyz: false })).toBe('aftertalk')
  })
})
