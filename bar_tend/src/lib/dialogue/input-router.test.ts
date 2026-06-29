import { describe, expect, it } from 'vitest'
import { findCocktailByName } from '../cocktails/database.js'
import { routeUserInput } from './input-router.js'

describe('user input routing priority', () => {
  const r = (input: string, opts?: { recommendationActive?: boolean; allowRecommendationRoutes?: boolean; lastDiscussedCocktailId?: string }) =>
    routeUserInput(input, opts).route

  const mojito = findCocktailByName('모히토')!
  const caipirinha = findCocktailByName('카이피리냐')!

  it('prioritizes explicit lore orders over the current welcome drink', () => {
    const result = routeUserInput('헤밍웨이가 즐겨마셨다는 걸로 주세요', {
      allowRecommendationRoutes: false,
      orderCandidateCocktailId: caipirinha.id,
    })

    expect(result.route).toBe('lore-based-order')
    expect(result.matchedCocktailId).toBe(mojito.id)
  })

  it.each([
    ['헤밍웨이가 즐겨마셨다는 걸로 다음잔을 부탁해요', '모히토'],
    ['007이 마시던 걸로 부탁해요', '마티니'],
    ['Sex and the City에 나온 걸로 한 잔 주세요', '코스모폴리탄'],
    ['일출 같은 이름의 칵테일로 부탁해요', '데킬라 선라이즈'],
  ])('routes lore order expression %s to an actual order target', (input, cocktailName) => {
    const expected = findCocktailByName(cocktailName)!
    expect(routeUserInput(input, {
      allowRecommendationRoutes: false,
      orderCandidateCocktailId: caipirinha.id,
    })).toMatchObject({
      route: 'lore-based-order',
      matchedCocktailId: expected.id,
    })
  })

  it('keeps a person-lore question as story-query when no order expression exists', () => {
    expect(routeUserInput('헤밍웨이가 즐겨마셨던 게 뭐예요?', {
      allowRecommendationRoutes: false,
      orderCandidateCocktailId: caipirinha.id,
    })).toMatchObject({
      route: 'story-query',
      matchedCocktailId: mojito.id,
    })
  })

  it('keeps plain pronoun orders on the current welcome drink', () => {
    expect(routeUserInput('그걸로 주세요', {
      allowRecommendationRoutes: false,
      orderCandidateCocktailId: mojito.id,
    })).toMatchObject({ route: 'explicit-cocktail', matchedCocktailId: mojito.id })

    expect(routeUserInput('그걸로 주세요', {
      allowRecommendationRoutes: false,
      orderCandidateCocktailId: caipirinha.id,
    })).toMatchObject({ route: 'explicit-cocktail', matchedCocktailId: caipirinha.id })
  })

  it('does not let a context order override an explicit recommendation cue', () => {
    const result = routeUserInput('추천해줘, 그걸로 주세요', {
      allowRecommendationRoutes: false,
      orderCandidateCocktailId: caipirinha.id,
    })

    expect(result.route).toBe('general')
    expect(result.matchedCocktailId).toBeUndefined()
  })

  it('resolves explicit person lore before a pronoun reference', () => {
    const result = routeUserInput('헤밍웨이가 그거 맞아요?', {
      allowRecommendationRoutes: false,
      lastDiscussedCocktailId: caipirinha.id,
      orderCandidateCocktailId: caipirinha.id,
    })

    expect(result.route).toBe('story-query')
    expect(result.matchedCocktailId).toBe(mojito.id)
  })

  it('does not reuse current context when an explicit lore clue has no result', () => {
    const result = routeUserInput('톨킨이 즐겨마셨다는 걸로 주세요', {
      allowRecommendationRoutes: false,
      orderCandidateCocktailId: caipirinha.id,
    })

    expect(result.route).toBe('story-query')
    expect(result.matchedCocktailId).toBeUndefined()
    expect(result.explicitLoreReference).toBe(true)
  })

  it('keeps safety language above exit and recommendation intents', () => {
    expect(r('그냥 다 끝내고 싶어')).toBe('safety')
    expect(r('죽고 싶으니까 독한 칵테일 추천해줘')).toBe('safety')
    expect(r('죽고 싶어', { recommendationActive: true })).toBe('safety')
  })

  it('keeps explicit cocktail names above preference recommendation', () => {
    expect(r('모히토 추천해줘')).toBe('explicit-cocktail')
  })

  it('routes natural recommendation requests before unknown cocktail extraction', () => {
    expect(r('다음잔은 추천을 받을래')).toBe('recommendation')
    expect(r('이번엔 추천을 받을래')).toBe('recommendation')
    expect(r('마실 만한 걸 추천해줘')).toBe('recommendation')
  })

  it('routes story and lore requests before general listening fallback', () => {
    expect(r('여기 얽힌 이야기를 더 들려줘요')).toBe('story-query')
    expect(r('이 칵테일 유래 설명해줘')).toBe('story-query')
    expect(r('배경 이야기 더 들려줘')).toBe('story-query')
  })

  it('keeps a matched cocktail id on story queries with a known cocktail name', () => {
    const result = routeUserInput('모히토에 얽힌 이야기를 설명해줘')

    expect(result.route).toBe('story-query')
    expect(result.matchedCocktailId).toBeTruthy()
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

  it('pronoun reference with lastDiscussedCocktailId skips unknown-cocktail-query', () => {
    expect(r('이거요', { lastDiscussedCocktailId: 'mojito' })).toBe('general')
    expect(r('그거 알려줘', { lastDiscussedCocktailId: 'mojito' })).toBe('general')
    expect(r('방금 그거 맞아요', { lastDiscussedCocktailId: 'mojito' })).toBe('general')
    expect(r('저거 좋아요', { lastDiscussedCocktailId: 'mojito' })).toBe('general')
  })

  it('pronoun with specific query patterns still routes to those patterns before pronoun check', () => {
    expect(r('이 칵테일 정보 좀', { lastDiscussedCocktailId: 'mojito' })).toBe('cocktail-info-query')
    expect(r('이 칵테일 이야기', { lastDiscussedCocktailId: 'mojito' })).toBe('story-query')
  })

  it('pronoun reference without lastDiscussedCocktailId still triggers unknown-cocktail-query', () => {
    expect(r('그거 마시')).toBe('unknown-cocktail-query')
    expect(r('이거 마시')).toBe('unknown-cocktail-query')
  })

  it('pronoun with context still allows recommendation intent to route first', () => {
    expect(r('이거 마실래', { lastDiscussedCocktailId: 'mojito' })).toBe('recommendation')
  })

  it('still routes known cocktails to explicit-cocktail', () => {
    expect(r('모히토 한 잔')).toBe('explicit-cocktail')
    expect(r('마티니 주문')).toBe('explicit-cocktail')
  })

  it('routes shaken/stirred shake reference with cocktail name to explicit-cocktail', () => {
    expect(r('마티니한잔 젓지말고 흔들어서')).toBe('explicit-cocktail')
    expect(r('마티니 한 잔 본드식으로')).toBe('explicit-cocktail')
    expect(r('마티니 shaken not stirred')).toBe('explicit-cocktail')
  })

  it('routes shake reference without cocktail name to general when no known cocktail', () => {
    expect(r('젓지말고 흔들어서')).toBe('general')
  })

  it('routes shake reference with only 주세요 to recommendation when it matches isRecommendationIntent', () => {
    expect(r('본드식으로 주세요')).toBe('recommendation')
  })

  it('keeps conversation sessions from auto-switching into recommendation routes', () => {
    const opts = { allowRecommendationRoutes: false }
    expect(r('추천해줘', opts)).toBe('general')
    expect(r('여기 얽힌 이야기를 더 들려줘요', opts)).toBe('story-query')
    expect(r('아무거나')).toBe('random-recommendation')
    expect(r('아무거나', opts)).toBe('general')
    expect(r('모히토 한 잔', opts)).toBe('explicit-cocktail')
    expect(r('블루 라군 주문', opts)).toBe('general')
    expect(r('죽고 싶어', opts)).toBe('safety')
    expect(r('다음에 올게', opts)).toBe('exit')
  })
})
