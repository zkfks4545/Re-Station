import type { BartenderResponse, Expression } from '../../types.js'
import {
  getCharacterProfile,
  type CharacterId,
} from './character-profile.js'
import {
  toCharacterMetadata,
  validateCharacterText,
  type CharacterValidationContext,
} from './character-validator.js'

export interface CharacterLayerInput extends CharacterValidationContext {
  text: string
  expression: Expression
  speaker?: CharacterId
}

export function applyCharacterLayer(input: CharacterLayerInput): BartenderResponse {
  const speaker = input.speaker ?? 'karua'
  const profile = getCharacterProfile(speaker)
  if (!profile) throw new Error(`등록되지 않은 캐릭터 프로필입니다: ${speaker}`)
  const response = normalizePresentation(input.text)
  const validation = validateCharacterText(response, profile, input)

  return {
    response,
    expression: input.expression,
    character: toCharacterMetadata(profile, response !== input.text, validation),
  }
}

// 의미를 바꾸는 재작성은 하지 않는다. WebLLM 의미 보조도 이 텍스트를 생성하거나 교체하지 않는다.
function normalizePresentation(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim().replace(/\s{2,}/g, ' '))
    .filter(Boolean)
    .join('\n')
}
