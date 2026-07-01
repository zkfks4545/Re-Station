import type { CocktailData } from '../../types.js'
import {
  nextPhaseAfterServedCocktail,
  shouldServeXyzAfterAlcoholLimit,
  type SessionPhase,
  XYZ_COCKTAIL_ID,
} from '../session/session-flow.js'

export interface ServingPlan {
  cocktail: CocktailData
  isXyz: boolean
  nextAlcoholStarTotal: number
  shouldUpdateAlcoholTotal: boolean
  requiresFarewell: boolean
  nextPhase: SessionPhase | null
}

export function createServingPlan(input: {
  cocktail: CocktailData
  currentPhase: SessionPhase
  alcoholStarTotal: number
}): ServingPlan {
  const isXyz = input.cocktail.id === XYZ_COCKTAIL_ID
  const nextAlcoholStarTotal = isXyz
    ? input.alcoholStarTotal
    : input.alcoholStarTotal + input.cocktail.taste.alcohol
  const requiresFarewell = shouldServeXyzAfterAlcoholLimit({
    current: input.currentPhase,
    alcoholStarTotal: nextAlcoholStarTotal,
    isXyz,
  })

  return {
    cocktail: input.cocktail,
    isXyz,
    nextAlcoholStarTotal,
    shouldUpdateAlcoholTotal: !isXyz,
    requiresFarewell,
    nextPhase: requiresFarewell
      ? null
      : nextPhaseAfterServedCocktail({ current: input.currentPhase, isXyz }),
  }
}
