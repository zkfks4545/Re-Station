import type { CocktailData } from '@/types.js'
import type { QueuedInteraction } from './restation-controller-model.js'

export interface RestationInteractionHandlers {
  send(text: string): void
  welcomeDrink(): boolean
  startRecommendation(): boolean
  orderCocktail(cocktail: CocktailData): boolean
  storyFromCard(cocktail: CocktailData): boolean
  cancelRecommendation(): boolean
}

export function runRestationInteraction(
  interaction: QueuedInteraction,
  handlers: RestationInteractionHandlers,
): boolean {
  switch (interaction.type) {
    case 'send':
      handlers.send(interaction.text)
      return true
    case 'welcome-drink':
      return handlers.welcomeDrink()
    case 'start-recommendation':
      return handlers.startRecommendation()
    case 'order-cocktail':
      return handlers.orderCocktail(interaction.cocktail)
    case 'story-from-card':
      return handlers.storyFromCard(interaction.cocktail)
    case 'cancel-recommendation':
      return handlers.cancelRecommendation()
  }
}
