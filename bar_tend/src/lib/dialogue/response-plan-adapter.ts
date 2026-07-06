import type { DialogueLine } from '../../types.js'
import { RESPONSE_PLANS } from './response-plan-data.js'
import { selectResponsePlan, validateResponsePlan } from './response-plan.js'

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
} as const

export function pickResponsePlanDialogue(
  category: string,
  _legacyLines: readonly DialogueLine[],
  random: () => number = Math.random,
): DialogueLine | null {
  const query = CATEGORY_QUERIES[category as keyof typeof CATEGORY_QUERIES]
  if (!query) return null

  const plan = selectResponsePlan(RESPONSE_PLANS, query)
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
