import { describe, expect, it } from 'vitest'
import { bartenderPersona } from '../bartender/persona.js'
import { getCocktailById } from '../cocktails/database.js'
import { formatRecommendationReply } from '../recommendation/response.js'
import { createRecommendationDecision, createRecommendationState } from '../recommendation/state.js'
import { applyCharacterLayer } from './character-layer.js'
import {
  getCharacterProfile,
  KARUA_CHARACTER_PROFILE,
  KARUA_FORBIDDEN_EXPRESSIONS,
} from './character-profile.js'
import { validateCharacterText } from './character-validator.js'

describe('Character Layer', () => {
  it.each([
    ['힘드셨겠어요.', 'direct-comfort'],
    ['괜찮아요.', 'blanket-reassurance'],
    ['제가 도와드릴게요.', 'helper-promise'],
    ['천천히 말씀해주세요.', 'counselor-prompt'],
    ['해결해 드릴게요.', 'solution-promise'],
    ['마음이 나아질 거예요.', 'emotional-recovery-promise'],
  ])('금지 표현을 탐지한다: %s', (text, patternId) => {
    const result = validateCharacterText(text, KARUA_CHARACTER_PROFILE)

    expect(result.validationPassed).toBe(false)
    expect(result.blockedPatterns).toContain(patternId)
  })

  it('문장 수, 반존대, 농담, 추천 어조를 평가한다', () => {
    const result = validateCharacterText(
      '오늘 표정이 먼저 주문했네요. 모히토 한 잔으로 가죠.',
      KARUA_CHARACTER_PROFILE,
      { recommendationExpected: true },
    )

    expect(result.validationPassed).toBe(true)
    expect(result.preferredPatterns).toEqual(expect.arrayContaining([
      'observation',
      'light-humor',
      'recommendation-tone',
      'semi-formal',
    ]))
    expect(result.warnings).toHaveLength(0)
  })

  it('긴 설명과 추천 어조 누락을 경고한다', () => {
    const text = '첫 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다. 네 번째 문장입니다.'
    const result = validateCharacterText(text, KARUA_CHARACTER_PROFILE, {
      recommendationExpected: true,
    })

    expect(result.validationPassed).toBe(false)
    expect(result.warnings).toContain('문장이 3개를 초과합니다.')
    expect(result.warnings).toContain('추천 응답에 바텐더의 제안 어조가 없습니다.')
  })

  it('문구의 의미와 표정을 바꾸지 않고 메타데이터를 추가한다', () => {
    const result = applyCharacterLayer({
      text: '오늘은 가볍게 가죠.',
      expression: 'smirk',
      intent: 'recommendation-query',
      recommendationExpected: true,
    })

    expect(result.response).toBe('오늘은 가볍게 가죠.')
    expect(result.expression).toBe('smirk')
    expect(result.character?.speaker).toBe('karua')
  })

  it('기존 추천 결과와 추천 이유 문구를 변경하지 않는다', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const decision = createRecommendationDecision(cocktail, createRecommendationState())
    const original = formatRecommendationReply(decision)
    const result = applyCharacterLayer({
      text: original,
      expression: 'smirk',
      intent: 'recommendation-query',
      recommendationExpected: true,
    })

    expect(result.response).toBe(original)
    expect(result.response).toContain(cocktail.name)
    expect(decision.cocktail.id).toBe(cocktail.id)
  })
})

describe('카루아 persona 계약', () => {
  it('persona.ts 원문을 프로필의 기준으로 직접 참조한다', () => {
    expect(KARUA_CHARACTER_PROFILE.persona).toBe(bartenderPersona)
    expect(KARUA_CHARACTER_PROFILE.persona).toContain('상담가처럼 위로하거나 문제를 해결하지 않습니다.')
    expect(KARUA_CHARACTER_PROFILE.persona).toContain('1~3문장으로 짧게 말하세요.')
  })

  it('금지 표현 규칙을 설정 배열로 노출한다', () => {
    expect(KARUA_FORBIDDEN_EXPRESSIONS.length).toBeGreaterThanOrEqual(6)
    expect(KARUA_FORBIDDEN_EXPRESSIONS.every((rule) => rule.id && rule.pattern && rule.description)).toBe(true)
  })

  it('미등록 화자를 카루아와 섞지 않고 프로필 확장 지점을 유지한다', () => {
    expect(getCharacterProfile('karua')).toBe(KARUA_CHARACTER_PROFILE)
    expect(getCharacterProfile('siesta')).toBeUndefined()
    expect(() => applyCharacterLayer({
      text: '테스트 대사입니다.',
      expression: 'talk',
      speaker: 'siesta',
    })).toThrow('등록되지 않은 캐릭터 프로필입니다: siesta')
  })
})
