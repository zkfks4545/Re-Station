import type { DialogueLine } from '../../types.js'
import { RESPONSE_PLANS } from './response-plan-data.js'
import {
  selectResponsePlan,
  validateResponsePlan,
  type ResponsePlan,
  type ResponsePlanBlockKind,
  type ResponsePlanLine,
} from './response-plan.js'

export type RecommendationFormatterSlot =
  | 'cocktail_name'
  | 'cocktail_name_subject'
  | 'reason'
  | 'talking_point'

const ALLOWED_SLOTS: readonly RecommendationFormatterSlot[] = [
  'cocktail_name',
  'cocktail_name_subject',
  'reason',
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

export function renderExactRecommendationResponsePlan(
  affectState: string,
  seed: string,
  slots: Record<RecommendationFormatterSlot, string>,
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'recommend',
    state: affectState,
    request: 'exact-recommendation-body',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const blockKinds: readonly ResponsePlanBlockKind[] = [
    'reaction',
    'recommend',
    'explanation',
    'answer',
  ]
  const selected = blockKinds.map((kind) => renderPlanBlock(plan, kind, slots, `${seed}:${kind}`))
  if (selected.some((line) => line === null)) return null

  const lines = selected.filter((line): line is DialogueLine => line !== null)
  const expression = lines[0]?.expression
  if (!expression || lines.some((line) => line.expression !== expression)) return null
  return {
    text: lines.map((line) => line.text).join('\n'),
    expression,
  }
}

function renderPlanBlock(
  plan: ResponsePlan,
  kind: ResponsePlanBlockKind,
  slots: Record<RecommendationFormatterSlot, string>,
  seed: string,
): DialogueLine | null {
  const lines = plan.blocks[kind] ?? []
  if (lines.length === 0) return null
  const selected = lines[pickIndex(seed, lines.length)]
  return selected ? renderRecommendationFormatterLine(selected, slots) : null
}

function pickIndex(seed: string, length: number): number {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return hash % length
}
