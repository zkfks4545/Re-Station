import type { CocktailData } from '@/types.js'
import type { DialogueSessionMode } from '@/lib/session/dialogue-session.js'
import type { IntentType } from '@/lib/bartender/intent-classifier.js'
import type { RecommendationChoiceInput } from '@/lib/recommendation/question-context.js'

export type InteractionStatus = 'idle' | 'processing' | 'typing' | 'preparing' | 'exiting'
export type ServedCocktailMode = 'recommendation' | 'codex'
export type ActionSessionMode = DialogueSessionMode

export type QueuedInteraction =
  | { type: 'send'; text: string }
  | { type: 'welcome-drink' }
  | { type: 'start-recommendation' }
  | { type: 'recommendation-answer'; input: RecommendationChoiceInput }
  | { type: 'order-cocktail'; cocktail: CocktailData }
  | { type: 'story-from-card'; cocktail: CocktailData; sessionId: string }
  | { type: 'cancel-recommendation' }

export const COCKTAIL_PREPARATION_DELAY_MS = 600
export const COCKTAIL_PREPARATION_DURATION_MS = 1800
export const CONVERSATION_RECOMMENDATION_PROMPT_TURN = 12
export const SIESTA_EVENTS_ENABLED = false

const TYPING_FALLBACK_BUFFER_MS = 1200
const TYPING_FALLBACK_MAX_TOKEN_MS = 180

export function estimateTypingFallbackDelay(text: string): number {
  return Array.from(text).length * TYPING_FALLBACK_MAX_TOKEN_MS + TYPING_FALLBACK_BUFFER_MS
}

export function mapIntentToRapportContext(intent: string): string {
  const map: Partial<Record<IntentType, string>> = {
    'order-cocktail': 'cocktail-order',
    'order-cocktail-mixed': 'cocktail-order',
    'recommendation-query': 'recommend-request',
    'mood-talk': 'mood-expression',
    'taste-query': 'taste-statement',
    'uncertain-talk': 'general-chat',
  }
  return map[intent as IntentType] ?? intent
}
