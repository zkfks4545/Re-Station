import { describe, expect, it } from 'vitest'
import { validateSemanticAnalysis } from './validator.js'

describe('WebLLM 구조화 의미 분석 검증', () => {
  it('허용된 의미 값만 통과시킨다', () => {
    const result = validateSemanticAnalysis(JSON.stringify({
      topic: 'work',
      stance: 'observant',
      responseBlocks: ['reaction', 'metaphor'],
      rapportHint: 'warmer',
      sessionTags: ['burnout', 'work'],
      confidence: 0.82,
    }))

    expect(result.valid).toBe(true)
    expect(result.analysis?.topic).toBe('work')
    expect(result.analysis?.sessionTags).toEqual(['burnout', 'work'])
  })

  it('알 수 없는 태그와 블록은 버린다', () => {
    const result = validateSemanticAnalysis(JSON.stringify({
      topic: 'unknown-topic',
      responseBlocks: ['reaction', 'invent-dialogue'],
      sessionTags: ['music', 'permanent-profile'],
      confidence: 0.5,
    }))

    expect(result.valid).toBe(true)
    expect(result.analysis?.topic).toBeUndefined()
    expect(result.analysis?.responseBlocks).toEqual(['reaction'])
    expect(result.analysis?.sessionTags).toEqual(['music'])
  })

  it.each([
    ['', '의미 분석 결과가 비어 있습니다.'],
    ['자유로운 대사입니다.', '유효한 JSON이 아닙니다.'],
    ['```json\n{}\n```', 'JSON 이외의 형식이 포함되었습니다.'],
    ['{"confidence":2}', 'confidence가 0부터 1 사이 숫자가 아닙니다.'],
  ])('자유문장 또는 잘못된 구조를 거부한다: %s', (raw, warning) => {
    const result = validateSemanticAnalysis(raw)
    expect(result.valid).toBe(false)
    expect(result.warnings).toContain(warning)
  })
})
