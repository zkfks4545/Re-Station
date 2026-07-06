import type { UserReaction } from '../dialogue/reaction-layer.js'
import type { ConversationContextState } from '../dialogue/conversation-context.js'

export function getFeedbackExcludedCocktailId(
  reaction: UserReaction | null,
  context: ConversationContextState,
): string | null {
  if (reaction?.type !== 'negative-feedback' && reaction?.type !== 'another-request') {
    return null
  }
  return context.lastRecommendedCocktailId
    ?? context.lastServedCocktailId
    ?? context.lastDiscussedCocktailId
}

export function addExcludedCocktailId(ids: string[], cocktailId: string): string[] {
  return ids.includes(cocktailId) ? ids : [...ids, cocktailId]
}
