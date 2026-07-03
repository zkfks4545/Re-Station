import type { DialogueLine } from '../../types.js'
import { RESPONSE_PLANS } from './response-plan-data.js'
import {
  selectResponsePlan,
  validateResponsePlan,
  type ResponsePlan,
  type ResponsePlanLine,
} from './response-plan.js'

export type RecommendationFormatterSlot = 'cocktail_name' | 'talking_point'

const ALLOWED_SLOTS: readonly RecommendationFormatterSlot[] = [
  'cocktail_name',
  'talking_point',
]
const SLOT_PATTERN = /\{([^{}]+)\}/g

export function renderRecommendationFormatterLine(
  line: ResponsePlanLine,
  slots: Partial<Record<RecommendationFormatterSlot, string>>,
): DialogueLine | null {
  const names = [...line.text.matchAll(SLOT_PATTERN)].map((match) => match[1])
  if (names.some((name) => !ALLOWED_SLOTS.includes(name as RecommendationFormatterSlot))) {
    return null
  }

  let text = line.text
  for (const name of names) {
    const value = slots[name as RecommendationFormatterSlot]
    if (typeof value !== 'string' || !value.trim()) return null
    text = text.split(`{${name}}`).join(value)
  }
  if (/[{}]/.test(text)) return null

  return { text, expression: line.expression }
}

export function renderRandomPickResponsePlan(
  opening: string,
  cocktailName: string,
  talkingPoint: string,
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  if (!opening.trim()) return null
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'recommend',
    request: 'random-pick-body',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  if (!line) return null
  const rendered = renderRecommendationFormatterLine(line, {
    cocktail_name: cocktailName,
    talking_point: talkingPoint,
  })
  return rendered
    ? { text: `${opening}\n${rendered.text}`, expression: rendered.expression }
    : null
}
