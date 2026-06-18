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

const DIALOGUE_INTENTS: DialogueIntent[] = [
  'cocktail-order',
  'recommend-request',
  'random-request',
  'mood-expression',
  'taste-statement',
  'ingredient-query',
  'recipe-query',
  'story-query',
  'general-chat',
  'exit-intent',
  'safety-alert',
  'recommendation-cancel',
  'recommendation-answer',
]

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

const DIALOGUE_ACTIONS: DialogueAction[] = [
  'reply',
  'recommend',
  'ask-question',
  'show-info',
  'banter',
  'exit',
  'safety-redirect',
  'reset',
  'queue-for-review',
]

const RECOMMENDATION_ROUTES: RecommendationRoute[] = [
  'directCocktailOrder',
  'anecdoteOrPersonOrder',
  'moodOrder',
  'tastePreferenceOrder',
  'ingredientOrBaseOrder',
  'recommendationInference',
  'randomPick',
]

const RECOMMENDATION_ROUTE_TAGS: RecommendationRouteTag[] = [
  'direct-name',
  'mood',
  'situation',
  'taste',
  'strength',
  'ingredient',
  'excluded-ingredient',
  'question-answer',
  'delegated',
  'random',
]

const DIALOGUE_STATES: DialogueState[] = [
  'idle',
  'listening',
  'thinking',
  'asking',
  'recommending',
  'serving',
  'bantering',
  'safety',
  'error',
  'exiting',
]

const AFFECT_STATES: AffectState[] = [
  'neutral',
  'warm',
  'curious',
  'confident',
  'playful',
  'concerned',
  'awkward',
  'tired',
]

const EXPRESSIONS: Expression[] = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking']
const ALCOHOL_PREFERENCES = ['non-alcoholic', 'low', 'medium', 'high']

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
    isOneOf(t.intent, DIALOGUE_INTENTS) &&
    validateExtractedEntities(t.entities) &&
    typeof t.confidence === 'number' &&
    Number.isFinite(t.confidence) &&
    t.confidence >= 0 &&
    t.confidence <= 1 &&
    isOneOf(t.route, RECOMMENDATION_ROUTES) &&
    isStringArrayOf(t.routeTags, RECOMMENDATION_ROUTE_TAGS) &&
    isOneOf(t.action, DIALOGUE_ACTIONS) &&
    isNonEmptyString(t.responseGoal) &&
    isStringArray(t.facts) &&
    isStringArray(t.forbidden) &&
    validateStatePatch(t.statePatch) &&
    isNonEmptyString(t.reply) &&
    isOneOf(t.expression, EXPRESSIONS)
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T)
}

function isStringArrayOf<T extends string>(value: unknown, options: readonly T[]): value is T[] {
  return Array.isArray(value) && value.every((item) => isOneOf(item, options))
}

function validateExtractedEntities(value: unknown): value is ExtractedEntities {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entities = value as Record<string, unknown>
  return (
    optionalString(entities.cocktailName) &&
    optionalStringArray(entities.moods) &&
    optionalStringArray(entities.tastes) &&
    optionalStringArray(entities.ingredients) &&
    (entities.alcoholPreference === undefined || isOneOf(entities.alcoholPreference, ALCOHOL_PREFERENCES)) &&
    optionalString(entities.baseSpirit) &&
    optionalStringArray(entities.excludedIngredients)
  )
}

function validateStatePatch(value: unknown): value is StatePatch {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const patch = value as Record<string, unknown>
  return (
    (patch.dialogueState === undefined || isOneOf(patch.dialogueState, DIALOGUE_STATES)) &&
    (patch.affectState === undefined || isOneOf(patch.affectState, AFFECT_STATES)) &&
    optionalBoolean(patch.clearExcludedIds) &&
    optionalBoolean(patch.resetRecommendation)
  )
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function optionalStringArray(value: unknown): boolean {
  return value === undefined || isStringArray(value)
}

function optionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean'
}
