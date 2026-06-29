import type { ClassifiedIntent } from '../bartender/intent-classifier.js'
import {
  getOrderCandidateCocktailId,
  getStoryCocktailId,
  type ConversationContextState,
} from './conversation-context.js'

type DialogueAction =
  | { type: 'order'; cocktailId: string }
  | { type: 'loreBasedOrder'; cocktailId: string }
  | { type: 'recommend'; mode: 'preference' | 'random' }
  | { type: 'continueStory'; topic: 'story' | 'lore' | 'info'; cocktailId: string | null }
  | { type: 'discuss'; cocktailId: string }
  | { type: 'respond' }

export function resolveDialogueAction(
  classified: ClassifiedIntent,
  context: ConversationContextState,
): DialogueAction {
  const { route } = classified.route
  const matchedCocktailId = classified.route.matchedCocktailId

  if (route === 'lore-based-order') {
    return matchedCocktailId
      ? { type: 'loreBasedOrder', cocktailId: matchedCocktailId }
      : { type: 'respond' }
  }

  if (route === 'explicit-cocktail') {
    const cocktailId = matchedCocktailId ?? getOrderCandidateCocktailId(context)
    return cocktailId ? { type: 'order', cocktailId } : { type: 'respond' }
  }

  if (route === 'random-recommendation') {
    return { type: 'recommend', mode: 'random' }
  }

  if (route === 'recommendation') {
    return { type: 'recommend', mode: 'preference' }
  }

  if (route === 'cocktail-mention' && matchedCocktailId) {
    return { type: 'discuss', cocktailId: matchedCocktailId }
  }

  if (route === 'story-query' || route === 'lore-query' || route === 'cocktail-info-query') {
    const topic = route === 'story-query'
      ? 'story'
      : route === 'lore-query'
        ? 'lore'
        : 'info'
    return {
      type: 'continueStory',
      topic,
      cocktailId: matchedCocktailId
        ?? (classified.route.explicitLoreReference ? null : getStoryCocktailId(context)),
    }
  }

  return { type: 'respond' }
}
