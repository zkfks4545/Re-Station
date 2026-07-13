import type { DialogueLine } from '../../types.js'
import { RESPONSE_PLANS } from './response-plan-data.js'
import { selectResponsePlan, validateResponsePlan, type ResponsePlan } from './response-plan.js'
import type { SessionTopic } from '../session/dialogue-session.js'

const CATEGORY_QUERIES = {
  'general-chat': {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'general-chat',
  },
  'mood-tired': {
    speaker: 'karua',
    intent: 'comfort',
    state: 'tired',
    request: 'mood-tired',
  },
  'mood-sad': {
    speaker: 'karua',
    intent: 'comfort',
    state: 'sad',
    request: 'mood-sad',
  },
  'mood-happy': {
    speaker: 'karua',
    intent: 'comfort',
    state: 'happy',
    request: 'mood-happy',
  },
  'bar-intro': {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'bar-intro',
  },
  'character-query': {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'character-query',
  },
  'story-request': {
    speaker: 'karua',
    intent: 'explain',
    request: 'story-request',
  },
  'story-unresolved': {
    speaker: 'karua',
    intent: 'explain',
    request: 'story-unresolved',
  },
  'unknown-cocktail-request': {
    speaker: 'karua',
    intent: 'explain',
    request: 'unknown-cocktail-request',
  },
  'random-request': {
    speaker: 'karua',
    intent: 'recommend',
    request: 'random-request',
  },
  'recipe-request': {
    speaker: 'karua',
    intent: 'explain',
    request: 'recipe-request',
  },
  'recommendation-cancel': {
    speaker: 'karua',
    intent: 'refusal',
    request: 'recommendation-cancel',
  },
  'bar-atmosphere': {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'bar-atmosphere',
  },
  'small-talk-weather': {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'small-talk-weather',
  },
  'guest-uncertain': {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'guest-uncertain',
  },
  'quiet-moment': {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'quiet-moment',
  },
  greeting: {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'greeting',
  },
  'siesta-mention': {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'siesta-mention',
  },
  'water-request': {
    speaker: 'karua',
    intent: 'small_talk',
    request: 'water-request',
  },
  overdrunk: {
    speaker: 'karua',
    intent: 'comfort',
    request: 'overdrunk',
  },
  'ingredient-constraint': {
    speaker: 'karua',
    intent: 'refusal',
    request: 'ingredient-constraint',
  },
  'real-world-info': {
    speaker: 'karua',
    intent: 'explain',
    request: 'real-world-info',
  },
  'rude-annoyed': {
    speaker: 'karua',
    intent: 'refusal',
    request: 'rude-annoyed',
  },
  'rude-boundary': {
    speaker: 'karua',
    intent: 'refusal',
    request: 'rude-boundary',
  },
  'cocktail-request': {
    speaker: 'karua',
    intent: 'recommend',
    request: 'cocktail-request',
  },
  'taste-sweet': {
    speaker: 'karua',
    intent: 'recommend',
    request: 'taste-sweet',
  },
  'taste-strong': {
    speaker: 'karua',
    intent: 'recommend',
    request: 'taste-strong',
  },
} as const

export type ResponsePlanDialogueCategory = keyof typeof CATEGORY_QUERIES

export const RESPONSE_PLAN_DIALOGUE_CATEGORIES = Object.freeze(
  Object.keys(CATEGORY_QUERIES),
) as readonly ResponsePlanDialogueCategory[]

export function isResponsePlanDialogueCategory(category: string): category is ResponsePlanDialogueCategory {
  return category in CATEGORY_QUERIES
}

export function pickResponsePlanDialogue(
  category: string,
  legacyLines: readonly DialogueLine[],
  random: () => number = Math.random,
  context: { topic?: SessionTopic } = {},
): DialogueLine | null {
  return pickResponsePlanDialogueFromPlans(category, legacyLines, RESPONSE_PLANS, random, context)
}

export function pickResponsePlanDialogueFromPlans(
  category: string,
  _legacyLines: readonly DialogueLine[],
  plans: readonly ResponsePlan[],
  random: () => number = Math.random,
  context: { topic?: SessionTopic } = {},
): DialogueLine | null {
  if (!isResponsePlanDialogueCategory(category)) return null
  const query = { ...CATEGORY_QUERIES[category], topic: context.topic }

  const plan = selectResponsePlan(plans, query)
  if (!plan || !validateResponsePlan(plan).valid) return null

  const answers = plan.blocks.answer ?? []
  if (answers.length === 0) return null
  const selected = answers[Math.floor(random() * answers.length)]
  if (!selected) return null
  return {
    text: selected.text,
    expression: selected.expression,
  }
}
