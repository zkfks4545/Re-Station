import { describe, expect, it } from 'vitest'
import { renderTextPreset } from './text-presets.js'

describe('Korean text preset particles', () => {
  it.each([
    ['도수', '취향', '도수를 취향으로 반영했습니다.'],
    ['단맛', '조건', '단맛을 조건으로 반영했습니다.'],
    ['럼', '후보', '럼을 후보로 반영했습니다.'],
    ['술', '기준', '술을 기준으로 반영했습니다.'],
  ])('joins %s and %s with valid particles', (value, target, expected) => {
    expect(renderTextPreset({
      id: 'answer.preference.applied', slots: { value, target },
    })).toBe(expected)
  })
})
