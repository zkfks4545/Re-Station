import { keywordRules } from './keywords.js'
import { generateResponse } from './conversation.js'
import { detectSafetyConcern } from '../dialogue/input-router.js'
import { pickDialogue } from '../dialogue/dialogue-loader.js'
import { SAFETY_REDIRECT_REPLY } from '../dialogue/turn-builder.js'
import type { BartenderResponse, Message } from '../../types.js'

export { detectSafetyConcern } from '../dialogue/input-router.js'

export function keywordAnalyze(input: string): BartenderResponse | null {
  for (const rule of keywordRules) {
    if (rule.pattern.test(input.toLowerCase())) {
      if (rule.dialogueCategory) {
        const picked = pickDialogue(rule.dialogueCategory)
        if (picked) return { response: picked.text, expression: picked.expression }
      }
      return {
        response: rule.response,
        expression: rule.expression,
      }
    }
  }
  return null
}

export function getCocktailResponse(input: string, history: Message[]): BartenderResponse {
  if (detectSafetyConcern(input)) {
    return {
      response: SAFETY_REDIRECT_REPLY,
      expression: 'sympathy',
    }
  }

  const keywordMatch = keywordAnalyze(input)
  if (keywordMatch) return keywordMatch

  return generateResponse(input, history)
}
