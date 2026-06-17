import type { Expression } from '../types.js'
import type {
  RecommendationRoute,
  RecommendationRouteTag,
  DialogueState,
  AffectState,
} from './recommendation.js'

export type DialogueIntent =
  | 'cocktail-order'
  | 'recommend-request'
  | 'random-request'
  | 'mood-expression'
  | 'taste-statement'
  | 'ingredient-query'
  | 'recipe-query'
  | 'story-query'
  | 'general-chat'
  | 'exit-intent'
  | 'safety-alert'
  | 'recommendation-cancel'
  | 'recommendation-answer'

export interface ExtractedEntities {
  cocktailName?: string
  moods?: string[]
  tastes?: string[]
  ingredients?: string[]
  alcoholPreference?: 'non-alcoholic' | 'low' | 'medium' | 'high'
  baseSpirit?: string
  excludedIngredients?: string[]
}

export interface StatePatch {
  dialogueState?: DialogueState
  affectState?: AffectState
  clearExcludedIds?: boolean
  resetRecommendation?: boolean
}

export type DialogueAction =
  | 'reply'
  | 'recommend'
  | 'ask-question'
  | 'show-info'
  | 'banter'
  | 'exit'
  | 'safety-redirect'
  | 'reset'
  | 'queue-for-review'

export interface DialogueTurn {
  intent: DialogueIntent
  entities: ExtractedEntities
  confidence: number
  route: RecommendationRoute
  routeTags: RecommendationRouteTag[]
  action: DialogueAction
  responseGoal: string
  facts: string[]
  forbidden: string[]
  statePatch: StatePatch
  reply: string
  expression: Expression
}

export function validateDialogueTurn(turn: unknown): turn is DialogueTurn {
  if (!turn || typeof turn !== 'object') return false
  const t = turn as Record<string, unknown>
  return (
    typeof t.intent === 'string' &&
    typeof t.entities === 'object' &&
    typeof t.confidence === 'number' &&
    typeof t.route === 'string' &&
    Array.isArray(t.routeTags) &&
    typeof t.action === 'string' &&
    typeof t.responseGoal === 'string' &&
    Array.isArray(t.facts) &&
    Array.isArray(t.forbidden) &&
    typeof t.statePatch === 'object' &&
    typeof t.reply === 'string' &&
    typeof t.expression === 'string'
  )
}
