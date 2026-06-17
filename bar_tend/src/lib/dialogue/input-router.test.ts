import { describe, expect, it } from 'vitest'
import { routeUserInput } from './input-router.js'

describe('user input routing priority', () => {
  const r = (input: string, opts?: { recommendationActive?: boolean }) =>
    routeUserInput(input, opts).route

  it('keeps safety language above exit and recommendation intents', () => {
    expect(r('그냥 다 끝내고 싶어')).toBe('safety')
    expect(r('죽고 싶으니까 독한 칵테일 추천해줘')).toBe('safety')
    expect(r('죽고 싶어', { recommendationActive: true })).toBe('safety')
  })

  it('keeps explicit cocktail names above preference recommendation', () => {
    expect(r('모히토 추천해줘')).toBe('explicit-cocktail')
  })

  it('routes active recommendation answers before general conversation', () => {
    expect(r('잘 모르겠어요', { recommendationActive: true })).toBe('recommendation')
    expect(r('아무거나', { recommendationActive: true })).toBe('recommendation')
    expect(r('다음에 올게')).toBe('exit')
  })

  it('routes explicit cancellation only while a recommendation is active', () => {
    expect(r('취소', { recommendationActive: true })).toBe('recommendation-cancel')
    expect(r('추천 그만', { recommendationActive: true })).toBe('recommendation-cancel')
    expect(r('그만 물어봐', { recommendationActive: true })).toBe('recommendation-cancel')
    expect(r('취소')).toBe('general')
  })

  it('keeps safety above active recommendation cancellation', () => {
    expect(r('죽고 싶어서 추천 취소', { recommendationActive: true })).toBe('safety')
  })

  it('routes 아무거나 to a random recommendation outside an active survey', () => {
    expect(r('아무거나')).toBe('random-recommendation')
    expect(r('그냥 아무거나 골라줘')).toBe('random-recommendation')
  })

  it('does not mistake rejection of 아무거나 for a random recommendation', () => {
    expect(r('아무거나 말고 달콤한 걸 추천해줘')).toBe('recommendation')
    expect(r('아무거나는 싫어')).toBe('general')
  })

  it('does not treat ambiguous ending language as an exit', () => {
    expect(r('영화가 벌써 끝났어')).toBe('general')
  })

  it('routes unknown cocktail names to unknown-cocktail-query', () => {
    expect(r('블루 라군 주문')).toBe('unknown-cocktail-query')
    expect(r('진 토닉 시켜줘')).toBe('unknown-cocktail-query')
    expect(r('롱 아일랜드 아이스티 한 잔')).toBe('unknown-cocktail-query')
  })

  it('still routes known cocktails to explicit-cocktail', () => {
    expect(r('모히토 한 잔')).toBe('explicit-cocktail')
    expect(r('마티니 주문')).toBe('explicit-cocktail')
  })
})
