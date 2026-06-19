import dialoguesData from '../../data/dialogues.json'
import type { DialogueLine, Expression } from '../../types.js'

export function pickDialogue(category: string): DialogueLine | null {
  const cat = (dialoguesData as any).categories?.[category]
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
