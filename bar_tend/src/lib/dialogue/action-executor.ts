import type { CocktailData } from '../../types.js'
import type { RecommendationOutcome } from './turn-builder.js'
import type { DialogueAction } from './action-resolver.js'
import type { RecommendationQuestion } from '../../types/recommendation.js'

export interface ActionOutcome extends RecommendationOutcome {
  cocktail: CocktailData | null
  pendingQuestion?: RecommendationQuestion | null
}

export interface ActionExecutionPorts {
  getCocktail(cocktailId: string): CocktailData | null
  recommendByPreference(text: string): ActionOutcome | null
  recommendRandom(): ActionOutcome
  orderExplicit(cocktail: CocktailData, options: { secretPassphrase?: string }): ActionOutcome
  orderByLore(cocktail: CocktailData): ActionOutcome
}

export type ActionExecutionEffect =
  | { type: 'serve'; cocktail: CocktailData; recommended: boolean }
  | { type: 'respond' }

export type ActionExecutionResult =
  | { status: 'completed'; outcome: ActionOutcome; effect: ActionExecutionEffect }
  | { status: 'no-outcome'; outcome: null; recommended: boolean }
  | { status: 'missing-target'; outcome: null; recommended: false; cocktailId: string }
  | { status: 'not-executable'; outcome: null; recommended: false }

export interface ActionExecutionRequest {
  action: DialogueAction
  text: string
  secretPassphrase?: string
}

export function executeDialogueAction(
  request: ActionExecutionRequest,
  ports: ActionExecutionPorts,
): ActionExecutionResult {
  const { action } = request

  if (action.type === 'recommend') {
    const outcome = action.mode === 'random'
      ? ports.recommendRandom()
      : ports.recommendByPreference(request.text)
    if (!outcome) return { status: 'no-outcome', outcome: null, recommended: true }
    return {
      status: 'completed',
      outcome,
      effect: outcome.cocktail
        ? { type: 'serve', cocktail: outcome.cocktail, recommended: true }
        : { type: 'respond' },
    }
  }

  if (action.type === 'order' || action.type === 'loreBasedOrder') {
    const cocktail = ports.getCocktail(action.cocktailId)
    if (!cocktail) {
      return {
        status: 'missing-target',
        outcome: null,
        recommended: false,
        cocktailId: action.cocktailId,
      }
    }
    const outcome = action.type === 'loreBasedOrder'
      ? ports.orderByLore(cocktail)
      : ports.orderExplicit(cocktail, { secretPassphrase: request.secretPassphrase })
    return {
      status: 'completed',
      outcome,
      effect: { type: 'serve', cocktail: outcome.cocktail ?? cocktail, recommended: false },
    }
  }

  return { status: 'not-executable', outcome: null, recommended: false }
}
