import { describe, expect, it } from 'vitest'
import { detectUserReaction } from './reaction-layer.js'

describe('reaction layer', () => {
  it.each([
    ['맛있어요', 'positive-feedback'],
    ['마음에 안 들어요', 'negative-feedback'],
    ['다른 걸로 추천해줘', 'another-request'],
    ['맞아요', 'agreement'],
    ['무슨 말인지 모르겠어요', 'confused'],
  ] as const)('classifies %s as %s', (input, expected) => {
    expect(detectUserReaction(input)?.type).toBe(expected)
  })

  it('does not treat an ordinary request as a reaction', () => {
    expect(detectUserReaction('마티니의 유래를 알려줘')).toBeNull()
  })
})
