import type { CocktailData } from '@/types.js'
import type { QueuedInteraction } from './restation-controller-model.js'
import type { RecommendationChoiceInput } from '@/lib/recommendation/question-context.js'

export interface RestationInteractionHandlers {
  send(text: string): void
  welcomeDrink(): boolean
  startRecommendation(): boolean
  recommendationAnswer(input: RecommendationChoiceInput): boolean
  orderCocktail(cocktail: CocktailData): boolean
  storyFromCard(cocktail: CocktailData, sessionId: string): boolean
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
    case 'recommendation-answer':
      return handlers.recommendationAnswer(interaction.input)
    case 'order-cocktail':
      return handlers.orderCocktail(interaction.cocktail)
    case 'story-from-card':
      return handlers.storyFromCard(interaction.cocktail, interaction.sessionId)
    case 'cancel-recommendation':
      return handlers.cancelRecommendation()
  }
}
