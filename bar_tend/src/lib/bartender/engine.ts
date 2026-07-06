import { generateResponse } from './conversation.js'
import { IntentClassifierAdapter } from './intent-classifier-adapter.js'
import type { ClassifiedIntent } from './intent-classifier.js'
import { SAFETY_REDIRECT_REPLY } from '../dialogue/turn-builder.js'
import { assembleResponse } from '../dialogue/response-pipeline.js'
import { cocktails } from '../cocktails/database.js'
import type { BartenderResponse, CocktailData, Message } from '../../types.js'

export { detectSafetyConcern } from '../dialogue/input-router.js'

export function getCocktailResponse(
  input: string,
  history: Message[],
): BartenderResponse {
  const classified = new IntentClassifierAdapter(cocktails).classifyWithFallback(input, history)
  return getCocktailResponseFromClassified(input, history, classified)
}

export function getCocktailResponseFromClassified(
  input: string,
  history: Message[],
  classified: ClassifiedIntent,
  referencedCocktail?: CocktailData | null,
): BartenderResponse {

  if (classified.intent === 'safety-alert') {
    return assembleResponse({
      text: SAFETY_REDIRECT_REPLY,
      preferredExpression: 'sympathy',
      character: { intent: 'safety-alert', safetyCritical: true },
    })
  }

  return generateResponse(input, history, classified.intent, referencedCocktail)
}
