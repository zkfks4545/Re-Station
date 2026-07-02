import { describe, expect, it } from 'vitest'
import { assembleResponse, expressionForTone } from './response-pipeline.js'

describe('response pipeline', () => {
  it('assembles text and a tone into a bartender response', () => {
    const result = assembleResponse({ text: '한 잔 준비할게요.', tone: 'confident' })

    expect(result).toMatchObject({
      response: '한 잔 준비할게요.',
      expression: 'smirk',
    })
    expect(result.character).toMatchObject({
      speaker: 'karua',
      styled: false,
      validationPassed: true,
    })
  })

  it('maps recommendation affect states in the shared expression stage', () => {
    expect(expressionForTone('concerned')).toBe('sympathy')
    expect(expressionForTone('awkward')).toBe('thinking')
    expect(expressionForTone('playful')).toBe('smirk')
  })

  it('preserves an expression selected by dialogue data', () => {
    expect(assembleResponse({
      text: '데이터에서 선택한 대사예요.',
      tone: 'talk',
      preferredExpression: 'surprised',
    }).expression).toBe('surprised')
  })

  it('passes optional recommendation context to the character layer', () => {
    const result = assembleResponse({
      text: '오늘은 모히토 한 잔으로 가죠.',
      tone: 'playful',
      character: { intent: 'recommendation-query', recommendationExpected: true },
    })

    expect(result.character?.preferredPatterns).toContain('recommendation-tone')
    expect(result.character?.warnings).not.toContain('추천 응답에 바텐더의 제안 어조가 없습니다.')
  })
})
