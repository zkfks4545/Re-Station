import { describe, expect, it } from 'vitest'
import {
  isRecommendationBlockedInPhase,
  isOrderingClosedPhase,
  MAX_FAREWELL_TURNS,
  nextPhaseAfterServedCocktail,
  shouldReturnHomeAfterFarewellTurn,
  shouldServeXyzNext,
} from './session-flow.js'

describe('closed Re:Station session flow', () => {
  it('names the phases where new orders are closed', () => {
    expect(isOrderingClosedPhase('entry')).toBe(false)
    expect(isOrderingClosedPhase('aftertalk')).toBe(false)
    expect(isOrderingClosedPhase('xyz')).toBe(true)
    expect(isOrderingClosedPhase('farewell')).toBe(true)
    expect(isOrderingClosedPhase('returnHome')).toBe(true)
  })

  it('serves XYZ before another order once the alcohol star total passes the limit', () => {
    expect(shouldServeXyzNext({
      phase: 'aftertalk',
      alcoholStarTotal: 11,
      route: 'recommendation',
      recommendationActive: false,
    })).toBe(true)

    expect(shouldServeXyzNext({
      phase: 'aftertalk',
      alcoholStarTotal: 10,
      route: 'recommendation',
      recommendationActive: false,
    })).toBe(false)
  })

  it('does not interrupt an active recommendation answer with XYZ', () => {
    expect(shouldServeXyzNext({
      phase: 'recommending',
      alcoholStarTotal: 11,
      route: 'recommendation',
      recommendationActive: true,
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
