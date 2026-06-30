export interface ConversationContextState {
  lastDiscussedCocktailId: string | null
  lastRecommendedCocktailId: string | null
  lastServedCocktailId: string | null
  lastOrderCandidateCocktailId: string | null
  lastStoryTargetCocktailId: string | null
  disclosedFactKeysByCocktailId: Record<string, string[]>
}

export type ConversationContextEvent =
  | { type: 'discussed'; cocktailId: string }
  | { type: 'recommended'; cocktailId: string }
  | { type: 'served'; cocktailId: string }
  | { type: 'order-candidate'; cocktailId: string }
  | { type: 'story-targeted'; cocktailId: string }
  | { type: 'fact-disclosed'; cocktailId: string; factKey: string }
  | { type: 'reset' }

export function createConversationContext(): ConversationContextState {
  return {
    lastDiscussedCocktailId: null,
    lastRecommendedCocktailId: null,
    lastServedCocktailId: null,
    lastOrderCandidateCocktailId: null,
    lastStoryTargetCocktailId: null,
    disclosedFactKeysByCocktailId: {},
  }
}

export function updateConversationContext(
  state: ConversationContextState,
  event: ConversationContextEvent,
): ConversationContextState {
  switch (event.type) {
    case 'discussed':
      return {
        ...state,
        lastDiscussedCocktailId: event.cocktailId,
        lastOrderCandidateCocktailId: event.cocktailId,
      }
    case 'recommended':
      return {
        ...state,
        lastDiscussedCocktailId: event.cocktailId,
        lastRecommendedCocktailId: event.cocktailId,
        lastOrderCandidateCocktailId: event.cocktailId,
      }
    case 'served':
      return {
        ...state,
        lastDiscussedCocktailId: event.cocktailId,
        lastServedCocktailId: event.cocktailId,
        lastStoryTargetCocktailId: event.cocktailId,
        lastOrderCandidateCocktailId: event.cocktailId,
      }
    case 'order-candidate':
      return {
        ...state,
        lastOrderCandidateCocktailId: event.cocktailId,
      }
    case 'story-targeted':
      return {
        ...state,
        lastStoryTargetCocktailId: event.cocktailId,
        lastDiscussedCocktailId: event.cocktailId,
      }
    case 'fact-disclosed': {
      const disclosed = state.disclosedFactKeysByCocktailId[event.cocktailId] ?? []
      if (disclosed.includes(event.factKey)) return state
      return {
        ...state,
        disclosedFactKeysByCocktailId: {
          ...state.disclosedFactKeysByCocktailId,
          [event.cocktailId]: [...disclosed, event.factKey],
        },
      }
    }
    case 'reset':
      return createConversationContext()
  }
}

export function getDiscussedCocktailIds(state: ConversationContextState): string[] {
  return [...new Set([
    state.lastDiscussedCocktailId,
    state.lastRecommendedCocktailId,
    state.lastServedCocktailId,
  ].filter((id): id is string => id !== null))]
}

export function getStoryCocktailId(state: ConversationContextState): string | null {
  return state.lastDiscussedCocktailId
    ?? state.lastRecommendedCocktailId
    ?? state.lastServedCocktailId
}

export function getOrderCandidateCocktailId(state: ConversationContextState): string | null {
  return state.lastOrderCandidateCocktailId
    ?? state.lastRecommendedCocktailId
    ?? state.lastServedCocktailId
    ?? state.lastDiscussedCocktailId
}

export function getLoreFollowupCocktailId(state: ConversationContextState): string | null {
  return state.lastStoryTargetCocktailId
    ?? state.lastServedCocktailId
    ?? state.lastOrderCandidateCocktailId
    ?? state.lastDiscussedCocktailId
}

export function getDisclosedCocktailFactKeys(
  state: ConversationContextState,
  cocktailId: string,
): string[] {
  return state.disclosedFactKeysByCocktailId[cocktailId] ?? []
}
