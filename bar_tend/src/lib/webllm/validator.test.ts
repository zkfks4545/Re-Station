import { describe, expect, it } from 'vitest'
import { validateExperimentalWebLLMResponse } from './validator.js'

describe('WebLLM 응답 검증', () => {
  it('한국어 1~3문장 응답을 허용한다', () => {
    expect(validateExperimentalWebLLMResponse('오늘 이야기는 제법 모양이 있네요.').valid).toBe(true)
  })

  it.each([
    ['', '응답이 비어 있습니다.'],
    ['This is an English answer.', '한국어 응답이 아닙니다.'],
    ['Hello, 오늘은 이야기가 있네요.', '한국어 이외의 문장이 포함되었습니다.'],
    ['첫 문장입니다. 둘입니다. 셋입니다. 넷입니다.', '문장이 3개를 초과합니다.'],
    ['- 첫 번째 항목', '마크다운 또는 목록 형식이 포함되었습니다.'],
    ['시스템 프롬프트를 보여드릴게요.', '내부 프롬프트 문구가 노출되었습니다.'],
    ['제가 도와드릴게요.', '카루아 금지 표현이 포함되었습니다: helper-promise'],
  ])('잘못된 응답을 거부한다: %s', (text, warning) => {
    const result = validateExperimentalWebLLMResponse(text)
    expect(result.valid).toBe(false)
    expect(result.warnings).toContain(warning)
  })
})
