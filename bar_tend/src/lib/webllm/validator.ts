import { KARUA_CHARACTER_PROFILE } from '../character/character-profile.js'
import { validateCharacterText } from '../character/character-validator.js'

export interface WebLLMValidationResult {
  valid: boolean
  warnings: string[]
}

const PROMPT_LEAKAGE = /(시스템\s*프롬프트|내부\s*지침|규칙\s*기반\s*원문|현재\s*경로|금지\s*표현\s*범주)/i
const AI_ASSISTANT_STYLE = /(AI|인공지능|언어\s*모델|도움이\s*필요하시면|무엇을\s*도와드릴까요)/i
const THERAPIST_STYLE = /(상담|치료|감정을\s*이해|마음을\s*열|천천히\s*말씀해|힘드셨겠)/
const MARKDOWN_OR_LIST = /(^|\n)\s*(?:[-*#>]\s|\d+[.)]\s)|```|\*\*|__/
const INVENTED_FACT_STYLE = /(효능|치료|숙취를\s*없애|기분을\s*낫게|마음을\s*치유)/

export function validateExperimentalWebLLMResponse(text: string): WebLLMValidationResult {
  const normalized = text.trim()
  const warnings: string[] = []
  if (!normalized) warnings.push('응답이 비어 있습니다.')
  if (!/[가-힣]/.test(normalized)) warnings.push('한국어 응답이 아닙니다.')
  if (/[A-Za-z]{2,}/.test(normalized)) warnings.push('한국어 이외의 문장이 포함되었습니다.')
  if (PROMPT_LEAKAGE.test(normalized)) warnings.push('내부 프롬프트 문구가 노출되었습니다.')
  if (AI_ASSISTANT_STYLE.test(normalized)) warnings.push('AI 도우미형 표현이 포함되었습니다.')
  if (THERAPIST_STYLE.test(normalized)) warnings.push('상담가형 표현이 포함되었습니다.')
  if (MARKDOWN_OR_LIST.test(normalized)) warnings.push('마크다운 또는 목록 형식이 포함되었습니다.')
  if (INVENTED_FACT_STYLE.test(normalized)) warnings.push('허용되지 않은 효능 또는 감정 개선 표현이 포함되었습니다.')

  const character = validateCharacterText(normalized, KARUA_CHARACTER_PROFILE)
  warnings.push(...character.warnings.filter((warning) => warning.includes('초과')))
  if (character.blockedPatterns.length > 0) {
    warnings.push(`카루아 금지 표현이 포함되었습니다: ${character.blockedPatterns.join(', ')}`)
  }
  return { valid: warnings.length === 0, warnings }
}
