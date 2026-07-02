import type { CharacterResponseMetadata } from '../../types.js'
import type { CharacterStyleProfile } from './character-profile.js'

export interface CharacterValidationContext {
  intent?: string
  recommendationExpected?: boolean
  safetyCritical?: boolean
}

export interface CharacterValidationResult {
  validationPassed: boolean
  warnings: string[]
  blockedPatterns: string[]
  preferredPatterns: string[]
}

export function validateCharacterText(
  text: string,
  profile: CharacterStyleProfile,
  context: CharacterValidationContext = {},
): CharacterValidationResult {
  const blockedPatterns = profile.forbiddenExpressions
    .filter((rule) => matches(rule.pattern, text))
    .map((rule) => rule.id)
  const preferredPatterns = profile.preferredExpressions
    .filter((rule) => matches(rule.pattern, text))
    .map((rule) => rule.id)
  const warnings: string[] = []
  const sentenceCount = countSentences(text)

  if (sentenceCount < profile.sentenceLength.min) warnings.push('문장이 비어 있습니다.')
  if (sentenceCount > profile.sentenceLength.max) {
    warnings.push(`문장이 ${profile.sentenceLength.max}개를 초과합니다.`)
  }
  if (text.length > profile.sentenceLength.maximumCharacters) {
    warnings.push(`응답이 ${profile.sentenceLength.maximumCharacters}자를 초과합니다.`)
  }

  // 안전 안내는 명료함이 우선이므로 농담·반존대·추천 어조를 요구하지 않는다.
  if (!context.safetyCritical) {
    if (profile.semiFormalSpeech.enabled && !preferredPatterns.includes('semi-formal')) {
      warnings.push('카루아의 존댓말 기반 반존대 어미가 확인되지 않습니다.')
    }
    if (profile.humorLevel !== '낮음' && !preferredPatterns.includes('light-humor')) {
      warnings.push('가벼운 능청이나 비틀기 표현이 없습니다.')
    }
    if (context.recommendationExpected && !preferredPatterns.includes('recommendation-tone')) {
      warnings.push('추천 응답에 바텐더의 제안 어조가 없습니다.')
    }
  }

  return {
    validationPassed: blockedPatterns.length === 0
      && sentenceCount >= profile.sentenceLength.min
      && sentenceCount <= profile.sentenceLength.max
      && text.length <= profile.sentenceLength.maximumCharacters,
    warnings,
    blockedPatterns,
    preferredPatterns,
  }
}

export function toCharacterMetadata(
  profile: CharacterStyleProfile,
  styled: boolean,
  validation: CharacterValidationResult,
): CharacterResponseMetadata {
  return {
    speaker: profile.id,
    styled,
    ...validation,
  }
}

function countSentences(text: string): number {
  const normalized = text.trim()
  if (!normalized) return 0
  const marked = normalized.match(/[^.!?…\n]+(?:[.!?…]+|$)/g)
  return marked?.filter((sentence) => sentence.trim()).length ?? 0
}

function matches(pattern: RegExp, text: string): boolean {
  pattern.lastIndex = 0
  return pattern.test(text)
}
