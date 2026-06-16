import { describe, expect, it } from 'vitest'
import { routeUserInput } from './input-router.js'

describe('user input routing priority', () => {
  it('keeps safety language above exit and recommendation intents', () => {
    expect(routeUserInput('그냥 다 끝내고 싶어')).toBe('safety')
    expect(routeUserInput('죽고 싶으니까 독한 칵테일 추천해줘')).toBe('safety')
    expect(routeUserInput('죽고 싶어', { recommendationActive: true })).toBe('safety')
  })

  it('keeps explicit cocktail names above preference recommendation', () => {
    expect(routeUserInput('모히토 추천해줘')).toBe('explicit-cocktail')
  })

  it('routes active recommendation answers before general conversation', () => {
    expect(routeUserInput('잘 모르겠어요', { recommendationActive: true })).toBe('recommendation')
    expect(routeUserInput('아무거나', { recommendationActive: true })).toBe('recommendation')
    expect(routeUserInput('다음에 올게')).toBe('exit')
  })

  it('routes explicit cancellation only while a recommendation is active', () => {
    expect(routeUserInput('취소', { recommendationActive: true })).toBe('recommendation-cancel')
    expect(routeUserInput('추천 그만', { recommendationActive: true })).toBe('recommendation-cancel')
    expect(routeUserInput('그만 물어봐', { recommendationActive: true })).toBe('recommendation-cancel')
    expect(routeUserInput('취소')).toBe('general')
  })

  it('keeps safety above active recommendation cancellation', () => {
    expect(routeUserInput('죽고 싶어서 추천 취소', { recommendationActive: true })).toBe('safety')
  })

  it('routes 아무거나 to a random recommendation outside an active survey', () => {
    expect(routeUserInput('아무거나')).toBe('random-recommendation')
    expect(routeUserInput('그냥 아무거나 골라줘')).toBe('random-recommendation')
  })

  it('does not mistake rejection of 아무거나 for a random recommendation', () => {
    expect(routeUserInput('아무거나 말고 달콤한 걸 추천해줘')).toBe('recommendation')
    expect(routeUserInput('아무거나는 싫어')).toBe('general')
  })

  it('does not treat ambiguous ending language as an exit', () => {
    expect(routeUserInput('영화가 벌써 끝났어')).toBe('general')
  })
})
