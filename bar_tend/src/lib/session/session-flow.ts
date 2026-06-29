import type { InputRoute } from '../dialogue/input-router.js'

export type SessionPhase =
  | 'entry'
  | 'conversation'
  | 'recommending'
  | 'aftertalk'
  | 'xyz'
  | 'farewell'
  | 'returnHome'

export const ALCOHOL_STARS_BEFORE_XYZ = 10
export const MAX_FAREWELL_TURNS = 3
export const XYZ_COCKTAIL_ID = 'cocktail_classic_043'

const ORDER_ROUTES: InputRoute[] = [
  'random-recommendation',
  'lore-based-order',
  'explicit-cocktail',
  'unknown-cocktail-query',
  'recommendation',
]

export function isOrderingClosedPhase(phase: SessionPhase): boolean {
  return phase === 'xyz' || phase === 'farewell' || phase === 'returnHome'
}

export function isOrderRoute(route: InputRoute): boolean {
  return ORDER_ROUTES.includes(route)
}

export function shouldServeXyzAfterAlcoholLimit(options: {
  current: SessionPhase
  alcoholStarTotal: number
  isXyz: boolean
}): boolean {
  if (options.isXyz) return false
  if (isOrderingClosedPhase(options.current)) return false
  return options.alcoholStarTotal >= ALCOHOL_STARS_BEFORE_XYZ
}

export function isRecommendationBlockedInPhase(phase: SessionPhase, route: InputRoute): boolean {
  if (!isOrderingClosedPhase(phase)) return false
  return isOrderRoute(route)
}

export function nextPhaseAfterRoute(route: InputRoute, current: SessionPhase): SessionPhase {
  if (isOrderingClosedPhase(current)) return current
  if (route === 'recommendation') return 'recommending'
  if (route === 'random-recommendation' || route === 'lore-based-order' || route === 'explicit-cocktail') return 'aftertalk'
  if (route === 'general') return current === 'entry' ? 'conversation' : current
  return current
}

export function nextPhaseAfterServedCocktail(options: {
  current: SessionPhase
  isXyz: boolean
}): SessionPhase {
  if (options.isXyz) return 'farewell'
  if (options.current === 'xyz' || options.current === 'farewell') return options.current
  return 'aftertalk'
}

export function shouldReturnHomeAfterFarewellTurn(options: {
  phase: SessionPhase
  farewellTurnCount: number
}): boolean {
  return options.phase === 'farewell' && options.farewellTurnCount >= MAX_FAREWELL_TURNS
}
