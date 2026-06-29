import { describe, expect, it } from 'vitest'
import { kf } from './pattern-utils.js'

describe('kf', () => {
  it('matches Korean patterns as substrings', () => {
    const re = kf(['젓지말고 흔들', '본드식'])
    expect(re.test('마티니한잔 젓지말고 흔들어서')).toBe(true)
    expect(re.test('본드식으로 주세요')).toBe(true)
    expect(re.test('일반 대화입니다')).toBe(false)
  })

  it('adds word boundaries for English patterns', () => {
    const re = kf(['shaken', 'stirred'])
    expect(re.test('shaken not stirred')).toBe(true)
    expect(re.test('unshaken')).toBe(false)
  })

  it('handles mixed Korean/English patterns', () => {
    const re = kf(['007처럼', 'shaken not stirred'])
    expect(re.test('007처럼 만들어 주세요')).toBe(true)
    expect(re.test('Shaken not stirred')).toBe(true)
  })

  it('returns case-insensitive regex by default', () => {
    const re = kf(['hello'])
    expect(re.test('HELLO')).toBe(true)
    expect(re.test('hello')).toBe(true)
    expect(re.test('Hello')).toBe(true)
  })

  it('respects caseSensitive option', () => {
    const re = kf(['Hello'], true)
    expect(re.test('Hello')).toBe(true)
    expect(re.test('hello')).toBe(false)
  })

  it('handles empty pattern array', () => {
    const re = kf([])
    expect(re.test('anything')).toBe(false)
  })

  it('matches regex patterns with special characters', () => {
    const re = kf(['다른\\s*(걸|거)|또.*추천'])
    expect(re.test('다른 걸로')).toBe(true)
    expect(re.test('다른 거 없어?')).toBe(true)
    expect(re.test('또 추천해줘')).toBe(true)
    expect(re.test('다른 일반 문장')).toBe(false)
  })

  it('handles very long input strings', () => {
    const re = kf(['shaken'])
    const longInput = 'a'.repeat(10000) + ' shaken ' + 'b'.repeat(10000)
    expect(re.test(longInput)).toBe(true)
  })

  it('matches single-character Korean patterns', () => {
    const re = kf(['술', '안주'])
    expect(re.test('술 한 잔')).toBe(true)
    expect(re.test('안주 추천')).toBe(true)
    expect(re.test('일반 대화')).toBe(false)
  })
})
