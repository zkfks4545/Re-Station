import { describe, expect, it } from 'vitest'
import { assembleResponse, expressionForTone } from './response-pipeline.js'

describe('response pipeline', () => {
  it('assembles text and a tone into a bartender response', () => {
    expect(assembleResponse({ text: '한 잔 준비할게요.', tone: 'confident' })).toEqual({
      response: '한 잔 준비할게요.',
      expression: 'smirk',
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
})
