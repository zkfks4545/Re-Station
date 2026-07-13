import type { DialogueLine } from '../../types.js'
import { RESPONSE_PLANS } from './response-plan-catalog.js'
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
  | 'fallback_reason'
  | 'talking_point'
  | 'question_label'
  | 'acknowledgement'
  | 'lead_in'
  | 'continuation'

const ALLOWED_SLOTS: readonly RecommendationFormatterSlot[] = [
  'cocktail_name',
  'cocktail_name_subject',
  'reason',
  'fallback_reason',
  'talking_point',
  'question_label',
  'acknowledgement',
  'lead_in',
  'continuation',
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
  slots: Partial<Record<RecommendationFormatterSlot, string>>,
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

export function renderNearestRecommendationResponsePlan(
  affectState: string,
  slots: Partial<Record<RecommendationFormatterSlot, string>>,
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'recommend',
    state: affectState,
    request: 'nearest-recommendation-body',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  return line ? renderRecommendationFormatterLine(line, slots) : null
}

export function renderRecommendationQuestionResponsePlan(
  hasAcknowledgement: boolean,
  slots: Partial<Record<RecommendationFormatterSlot, string>>,
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'ask_preference',
    state: hasAcknowledgement ? 'continuation' : 'lead-in',
    request: 'recommendation-question',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  return line ? renderRecommendationFormatterLine(line, slots) : null
}

export function renderWelcomeDrinkResponsePlan(
  state: string,
  cocktailName: string,
  talkingPoint: string,
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'welcome_drink',
    state,
    request: 'welcome-drink-body',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  return line
    ? renderRecommendationFormatterLine(line, {
      cocktail_name: cocktailName,
      talking_point: talkingPoint,
    })
    : null
}

export function renderWelcomeDrinkFeedbackResponsePlan(
  state: string,
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'welcome_drink',
    state,
    request: 'welcome-feedback',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  return line ? renderRecommendationFormatterLine(line, {}) : null
}

export function renderStandardFarewellEntryResponsePlan(
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'goodbye',
    state: 'standard',
    request: 'farewell-entry',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  return line ? renderRecommendationFormatterLine(line, {}) : null
}

export function renderWelcomeXyzClarificationResponsePlan(
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'goodbye',
    state: 'welcome-xyz-clarification',
    request: 'farewell-xyz-clarification',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  return line ? renderRecommendationFormatterLine(line, {}) : null
}

export function renderXyzFarewellResponsePlan(
  cocktailName: string,
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'goodbye',
    state: 'alcohol-xyz',
    request: 'farewell-xyz-body',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  return line ? renderRecommendationFormatterLine(line, { cocktail_name: cocktailName }) : null
}

export function renderWelcomeFarewellXyzResponsePlan(
  cocktailName: string,
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'goodbye',
    state: 'welcome-farewell-xyz',
    request: 'farewell-welcome-xyz-body',
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  return line ? renderRecommendationFormatterLine(line, { cocktail_name: cocktailName }) : null
}

export function renderFarewellConversationResponsePlan(
  state: string,
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  return renderGoodbyeResponsePlan(state, 'farewell-conversation', plans)
}

export function renderFarewellBlockResponsePlan(
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  return renderGoodbyeResponsePlan('ordering-blocked', 'farewell-block', plans)
}

export function renderReturnHomeResponsePlan(
  plans: readonly ResponsePlan[] = RESPONSE_PLANS,
): DialogueLine | null {
  return renderGoodbyeResponsePlan('return-home', 'farewell-return-home', plans)
}

function renderGoodbyeResponsePlan(
  state: string,
  request: string,
  plans: readonly ResponsePlan[],
): DialogueLine | null {
  const plan = selectResponsePlan(plans, {
    speaker: 'karua',
    intent: 'goodbye',
    state,
    request,
  })
  if (!plan || !validateResponsePlan(plan).valid) return null

  const line = plan.blocks.answer?.[0]
  return line ? renderRecommendationFormatterLine(line, {}) : null
}

function renderPlanBlock(
  plan: ResponsePlan,
  kind: ResponsePlanBlockKind,
  slots: Partial<Record<RecommendationFormatterSlot, string>>,
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
