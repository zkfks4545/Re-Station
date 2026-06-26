import type { CocktailData } from '../types.js'
import type { FeatureKey, TastePreference } from './cocktail-db.js'
import type { TextPresetRef } from '../lib/dialogue/text-presets.js'

export type RecommendationMood =
  | 'depressed'
  | 'tired'
  | 'lonely'
  | 'excited'
  | 'angry'
  | 'empty'
  | 'celebratory'
  | 'heartbroken'
  | 'anxious'
  | 'bored'

export type RecommendationSituation =
  | 'after-work'
  | 'breakup'
  | 'celebration'
  | 'sleepless'
  | 'rough-day'
  | 'casual-drink'
  | 'first-visit'
  | 'returning-guest'

export type AlcoholPreference = 'non-alcoholic' | 'low' | 'medium' | 'high' | 'any'
export type SignalSource = 'rule' | 'question' | 'webllm'

export interface RecommendationSignal {
  field:
    | `taste.${FeatureKey}`
    | 'moods'
    | 'situations'
    | 'alcoholPreference'
    | 'preferredIngredients'
    | 'excludedIngredients'
  value: string | number
  confidence: number
  source: SignalSource
  evidence?: string
}

export interface RecommendationQuestionChoice {
  label: string
  acknowledgement: string
  acknowledgementPreset?: TextPresetRef
  signals: RecommendationSignal[]
  finishRecommendation?: boolean
}

export interface RecommendationQuestionFlow {
  leadIn: string
  leadInPreset?: TextPresetRef
  continuation: string
  continuationPreset?: TextPresetRef
  goal: 'open-preference' | 'narrow-candidates' | 'confirm-constraint'
}

export interface RecommendationQuestion {
  id: string
  topic: string
  prompt: string
  promptPreset?: TextPresetRef
  dialogueFlow?: RecommendationQuestionFlow
  choices: RecommendationQuestionChoice[]
}

export interface QuestionHistoryEntry {
  topic: string
  answer?: string
}

export interface RecommendationState {
  taste: TastePreference
  moods: RecommendationMood[]
  situations: RecommendationSituation[]
  alcoholPreference: AlcoholPreference
  preferredIngredients: string[]
  excludedIngredients: string[]
  questionHistory: QuestionHistoryEntry[]
  signals: RecommendationSignal[]
}

export type RecommendationRoute =
  | 'directCocktailOrder'
  | 'anecdoteOrPersonOrder'
  | 'moodOrder'
  | 'tastePreferenceOrder'
  | 'ingredientOrBaseOrder'
  | 'recommendationInference'
  | 'randomPick'

export type RecommendationRouteTag =
  | 'direct-name'
  | 'mood'
  | 'situation'
  | 'taste'
  | 'strength'
  | 'ingredient'
  | 'excluded-ingredient'
  | 'question-answer'
  | 'delegated'
  | 'random'

export type DialogueState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'asking'
  | 'recommending'
  | 'serving'
  | 'bantering'
  | 'safety'
  | 'error'
  | 'exiting'

export type AffectState =
  | 'neutral'
  | 'warm'
  | 'curious'
  | 'confident'
  | 'playful'
  | 'concerned'
  | 'awkward'
  | 'tired'

export interface RecommendationDialogueContext {
  route: RecommendationRoute
  routeTags: RecommendationRouteTag[]
  dialogueState: DialogueState
  affectState: AffectState
}

export interface RecommendationReason {
  code: 'taste-match' | 'strength-match' | 'ingredient-match' | 'context'
  label: string
  detail: string
  evidence: string[]
}

export interface RecommendationDecision {
  cocktail: CocktailData
  reasons: RecommendationReason[]
  state: RecommendationState
  dialogue: RecommendationDialogueContext
}
