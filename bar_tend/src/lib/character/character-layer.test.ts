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

describe('Phase 9 — Character Layer 경계 조건', () => {
  it('safety-critical 컨텍스트에서는 농담·반존대·추천 어조 경고를 생략한다', () => {
    const result = validateCharacterText(
      '지금은 안전이 먼저예요. 119에 연락해 주세요.',
      KARUA_CHARACTER_PROFILE,
      { safetyCritical: true },
    )

    expect(result.validationPassed).toBe(true)
    expect(result.warnings).not.toContain('가벼운 능청이나 비틀기 표현이 없습니다.')
    expect(result.warnings).not.toContain('카루아의 존댓말 기반 반존대 어미가 확인되지 않습니다.')
  })

  it('빈 문자열은 validationPassed = false를 반환한다', () => {
    const result = validateCharacterText('', KARUA_CHARACTER_PROFILE)
    expect(result.validationPassed).toBe(false)
    expect(result.warnings).toContain('문장이 비어 있습니다.')
  })

  it('220자 초과 응답을 경고한다', () => {
    const longText = '가.'.repeat(150)
    const result = validateCharacterText(longText, KARUA_CHARACTER_PROFILE)
    expect(result.validationPassed).toBe(false)
    expect(result.warnings).toContain('응답이 220자를 초과합니다.')
  })

  it('normalizePresentation이 연속 공백과 빈 줄을 정리한다', () => {
    const result = applyCharacterLayer({
      text: '  첫 문장입니다.  \n\n  두 번째 문장입니다.  ',
      expression: 'talk',
    })
    expect(result.response).toBe('첫 문장입니다.\n두 번째 문장입니다.')
  })

  it('10개의 금지 표현 패턴을 모두 개별 탐지한다', () => {
    const patterns = [
      { text: '힘드셨겠어요.', id: 'direct-comfort' },
      { text: '힘내세요.', id: 'direct-encouragement' },
      { text: '괜찮아요.', id: 'blanket-reassurance' },
      { text: '괜찮아질 거예요.', id: 'fixed-hope' },
      { text: '좋은 결과가 있을 거예요.', id: 'fixed-hope' },
      { text: '제가 도와드릴게요.', id: 'helper-promise' },
      { text: '천천히 말씀해 주세요.', id: 'counselor-prompt' },
      { text: '해결해 드릴게요.', id: 'solution-promise' },
      { text: '마음이 나아질 거예요.', id: 'emotional-recovery-promise' },
      { text: '기분이 좋아질 거예요.', id: 'emotional-recovery-promise' },
    ]
    for (const { text, id: expectedId } of patterns) {
      const result = validateCharacterText(text, KARUA_CHARACTER_PROFILE)
      expect(result.validationPassed).toBe(false)
      expect(result.blockedPatterns).toContain(expectedId)
    }
  })
})
