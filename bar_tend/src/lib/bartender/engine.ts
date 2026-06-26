import { generateResponse } from './conversation.js'
import { IntentClassifierAdapter } from './intent-classifier-adapter.js'
import { SAFETY_REDIRECT_REPLY } from '../dialogue/turn-builder.js'
import { cocktails } from '../cocktails/database.js'
import type { BartenderResponse, Message } from '../../types.js'

export { detectSafetyConcern } from '../dialogue/input-router.js'

export function getCocktailResponse(input: string, history: Message[]): BartenderResponse {
  const adapter = new IntentClassifierAdapter(cocktails)
  const classified = adapter.classifyWithFallback(input, history)

  if (classified.intent === 'safety-alert') {
    return { response: SAFETY_REDIRECT_REPLY, expression: 'sympathy' }
  }

  return generateResponse(input, history, classified.intent)
}
