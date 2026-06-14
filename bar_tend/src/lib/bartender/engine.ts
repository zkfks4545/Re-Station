import { keywordRules } from './keywords.js'
import { generateResponse } from './conversation.js'
import { detectSafetyConcern } from '../dialogue/input-router.js'
import type { BartenderResponse, Message } from '../../types.js'

export { detectSafetyConcern } from '../dialogue/input-router.js'

export function keywordAnalyze(input: string): BartenderResponse | null {
  for (const rule of keywordRules) {
    if (rule.pattern.test(input.toLowerCase())) {
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
      response: '지금 안전한 상태인지 먼저 확인해 주세요. 다칠 위험이 있거나 혼자 감당하기 어렵다면 가까운 사람 또는 지역 응급 서비스에 즉시 연락해 주세요.',
      expression: 'sympathy',
    }
  }

  const keywordMatch = keywordAnalyze(input)
  if (keywordMatch) return keywordMatch

  return generateResponse(input, history)
}
