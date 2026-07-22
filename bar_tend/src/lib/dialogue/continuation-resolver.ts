import type { ConversationContextSnapshot } from './conversation-context-snapshot.js'

export type ContinuationIntent = 'story-query-followup' | 'character-query' | null

export function resolveContinuation(input: string, context: ConversationContextSnapshot): ContinuationIntent {
  const text = input.trim().toLowerCase()
  if (/더\s*들려|계속\s*들려|그건\?|왜요\?|무슨\s*뜻/.test(text) && context.topic === 'cocktail-story' && context.subject.type === 'cocktail') {
    return 'story-query-followup'
  }
  if (/당신은\?|너는\?/.test(text) && ['smalltalk', 'world-building'].includes(context.topic)) return 'character-query'
  return null
}
