import dialoguesData from '../../data/dialogues.json'
import type { DialogueLine, DialoguesData, Expression } from '../../types.js'

const typedDialoguesData = dialoguesData as DialoguesData

export function pickDialogue(category: string): DialogueLine | null {
  const cat = typedDialoguesData.categories[category]
  if (!cat?.lines?.length) return null
  const lines = cat.lines as DialogueLine[]
  return lines[Math.floor(Math.random() * lines.length)]
}

export function pickDialogueText(category: string, fallback?: string): string {
  const picked = pickDialogue(category)
  return picked?.text ?? fallback ?? ''
}

export function pickDialogueExpression(category: string, fallback?: Expression): Expression {
  const picked = pickDialogue(category)
  return picked?.expression ?? fallback ?? 'talk'
}
