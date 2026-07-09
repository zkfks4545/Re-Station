import dialoguesData from '../../data/dialogues.json'
import type { DialogueLine, DialoguesData, Expression } from '../../types.js'
import { pickResponsePlanDialogue, pickResponsePlanDialogueFromPlans } from './response-plan-adapter.js'
import type { ResponsePlan } from './response-plan.js'

const typedDialoguesData = dialoguesData as DialoguesData

export function pickDialogue(category: string): DialogueLine | null {
  const cat = typedDialoguesData.categories[category]
  const lines = (cat?.lines ?? []) as DialogueLine[]
  return pickDialogueFromSources(category, lines)
}

export function pickDialogueFromSources(
  category: string,
  lines: readonly DialogueLine[],
  random: () => number = Math.random,
): DialogueLine | null {
  const migrated = pickResponsePlanDialogue(category, lines, random)
  if (migrated) return migrated
  if (lines.length === 0) return null
  return lines[Math.floor(random() * lines.length)]
}

export function pickDialogueFromSourcesWithPlans(
  category: string,
  lines: readonly DialogueLine[],
  plans: readonly ResponsePlan[],
  random: () => number = Math.random,
): DialogueLine | null {
  const migrated = pickResponsePlanDialogueFromPlans(category, lines, plans, random)
  if (migrated) return migrated
  if (lines.length === 0) return null
  return lines[Math.floor(random() * lines.length)]
}

export function pickDialogueText(category: string, fallback?: string): string {
  const picked = pickDialogue(category)
  return picked?.text ?? fallback ?? ''
}

export function pickDialogueExpression(category: string, fallback?: Expression): Expression {
  const picked = pickDialogue(category)
  return picked?.expression ?? fallback ?? 'talk'
}
