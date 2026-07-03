import type { Expression } from '../../types.js'
import type { DialogueParagraphIntent, DialogueSpeaker } from './text-presets.js'

export type ResponsePlanBlockKind =
  | 'reaction'
  | 'joke'
  | 'recommend'
  | 'explanation'
  | 'answer'
  | 'goodbye'

export interface ResponsePlanLine {
  text: string
  expression: Expression
}

export interface ResponsePlan {
  id: string
  intent: DialogueParagraphIntent
  speaker: DialogueSpeaker
  state?: string
  request?: string
  blocks: Partial<Record<ResponsePlanBlockKind, readonly ResponsePlanLine[]>>
  fallbackText: string
  expression?: Expression
}

export interface ResponsePlanQuery {
  intent: DialogueParagraphIntent
  speaker: DialogueSpeaker
  state?: string
  request?: string
}

export interface ResponsePlanValidationResult {
  valid: boolean
  errors: string[]
}

export function selectResponsePlan(
  plans: readonly ResponsePlan[],
  query: ResponsePlanQuery,
): ResponsePlan | null {
  const candidates = plans
    .filter((plan) => plan.intent === query.intent && plan.speaker === query.speaker)
    .filter((plan) => plan.state === undefined || plan.state === query.state)
    .filter((plan) => plan.request === undefined || plan.request === query.request)
    .map((plan) => ({ plan, score: Number(plan.state !== undefined) + Number(plan.request !== undefined) }))
    .sort((a, b) => b.score - a.score)
  return candidates[0]?.plan ?? null
}

export function validateResponsePlan(plan: ResponsePlan): ResponsePlanValidationResult {
  const errors: string[] = []
  if (!plan.id.trim()) errors.push('id가 비어 있습니다.')
  if (!plan.fallbackText.trim()) errors.push('fallbackText가 비어 있습니다.')

  const blockEntries = Object.entries(plan.blocks)
  if (blockEntries.length === 0) errors.push('응답 블록이 하나도 없습니다.')
  for (const [kind, lines] of blockEntries) {
    if (!lines || lines.length === 0) errors.push(`${kind} 블록이 비어 있습니다.`)
    for (const line of lines ?? []) {
      if (!line || typeof line !== 'object') {
        errors.push(`${kind} 블록에는 ResponsePlanLine 객체만 사용할 수 있습니다.`)
        continue
      }
      if (typeof line.text !== 'string' || !line.text.trim()) {
        errors.push(`${kind} 블록에 빈 문장이 있습니다.`)
      }
      if (typeof line.expression !== 'string' || !line.expression.trim()) {
        errors.push(`${kind} 블록 문장에 expression이 없습니다.`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
