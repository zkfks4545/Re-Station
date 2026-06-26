import { describe, expect, it } from 'vitest'
import {
  isRecommendationBlockedInPhase,
  isOrderingClosedPhase,
  MAX_FAREWELL_TURNS,
  nextPhaseAfterServedCocktail,
  shouldReturnHomeAfterFarewellTurn,
  shouldServeXyzAfterAlcoholLimit,
} from './session-flow.js'

describe('closed Re:Station session flow', () => {
  it('names the phases where new orders are closed', () => {
    expect(isOrderingClosedPhase('entry')).toBe(false)
    expect(isOrderingClosedPhase('aftertalk')).toBe(false)
    expect(isOrderingClosedPhase('xyz')).toBe(true)
    expect(isOrderingClosedPhase('farewell')).toBe(true)
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
  })

  it('moves into farewell after the XYZ drink is served', () => {
    expect(nextPhaseAfterServedCocktail({ current: 'xyz', isXyz: true })).toBe('farewell')
    expect(nextPhaseAfterServedCocktail({ current: 'recommending', isXyz: false })).toBe('aftertalk')
  })

  it('returns home after the farewell turn budget is used', () => {
    expect(shouldReturnHomeAfterFarewellTurn({
      phase: 'farewell',
      farewellTurnCount: MAX_FAREWELL_TURNS,
    })).toBe(true)
    expect(shouldReturnHomeAfterFarewellTurn({
      phase: 'aftertalk',
      farewellTurnCount: MAX_FAREWELL_TURNS,
    })).toBe(false)
  })
})
