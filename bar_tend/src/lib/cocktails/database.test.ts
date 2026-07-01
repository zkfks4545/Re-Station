import { describe, expect, it } from 'vitest'
import { initCandidatePool, isRecommendationIntent } from '../recommendation/question-engine.js'
import {
  cocktails,
  findCocktailByName,
  getCocktailById,
  getAllCocktailData,
  getPublicCocktailData,
  getRandomCocktail,
  publicCocktails,
} from './database.js'

describe('cocktail data contract', () => {
  it('shares one hydrated collection between UI and recommendation', () => {
    expect(getAllCocktailData()).toBe(cocktails)
    expect(initCandidatePool()).toBe(publicCocktails)
    expect(cocktails).toHaveLength(51)
    expect(getPublicCocktailData()).toBe(publicCocktails)
    expect(publicCocktails).toHaveLength(49)

    for (const cocktail of cocktails) {
      expect(cocktail.features).toBeDefined()
      expect(cocktail.story).not.toBe('')
      expect(cocktail.talkingPoints?.length).toBeGreaterThanOrEqual(2)
      expect(cocktail.ingredients.length).toBeGreaterThan(0)
    }
  })

  it('keeps IBA recipe provenance on newly added official cocktails', () => {
    const official = cocktails.filter((cocktail) => cocktail.recipe_source_url)

    expect(official).toHaveLength(47)
    expect(official.every((cocktail) =>
      cocktail.recipe_source_url?.startsWith('https://iba-world.com/iba-cocktail/'),
    )).toBe(true)
    expect(findCocktailByName('팔로마 한 잔')?.recipe_source_url).toContain('/paloma/')
  })

  it('includes the expanded story-driven classics with recipes and talking points', () => {
    const additions = [
      '롱 아일랜드 아이스 티',
      '콥스 리바이버 넘버 2',
      '좀비',
      '데스 인 디 애프터눈',
      '베스퍼',
      '화이트 러시안',
    ]

    for (const name of additions) {
      const cocktail = findCocktailByName(name)
      expect(cocktail, `missing ${name}`).not.toBeNull()
      expect(cocktail?.recipeText).not.toBe('')
      expect(cocktail?.talkingPoints?.length).toBeGreaterThanOrEqual(2)
      expect(cocktail?.lore?.keywords.length).toBeGreaterThan(0)
    }

    expect(findCocktailByName('라스트 워드')?.talkingPoints).toContain(
      '이름이 라스트 워드라고 대화까지 끝낼 필요는 없어요. 오히려 한 모금 뒤에 할 말이 더 생기는 쪽에 가깝습니다.',
    )
  })

  it('keeps expanded real-world lore attributed with cautious wording', () => {
    const expanded = ['003', '004', '005', '009', '010', '020', '021', '022', '024', '042']
      .map((suffix) => `cocktail_classic_${suffix}`)

    for (const id of expanded) {
      const cocktail = getCocktailById(id)
      expect(cocktail?.talkingPoints).toHaveLength(3)
      expect(cocktail?.lore?.references).toHaveLength(2)
      expect(cocktail?.lore?.references.every((reference) =>
        /전해집니다|알려져 있습니다|언급됩니다/.test(reference.details),
      )).toBe(true)
    }
  })

  it('covers the second talking-points expansion with structured lore', () => {
    const expanded = ['013', '015', '019', '025', '030', '031', '034', '035', '040', '041']
      .map((suffix) => `cocktail_classic_${suffix}`)

    for (const id of expanded) {
      const cocktail = getCocktailById(id)
      expect(cocktail?.talkingPoints).toHaveLength(3)
      expect(cocktail?.lore?.keywords.length).toBeGreaterThanOrEqual(4)
      expect(cocktail?.lore?.references).toHaveLength(2)
      expect(cocktail?.lore?.references.every((reference) =>
        /전해집니다|알려져 있습니다|언급됩니다/.test(reference.details),
      )).toBe(true)
    }
  })

  it('uses one neutral DB style for recipes, ingredients, and descriptions', () => {
    for (const cocktail of cocktails) {
      if (cocktail.secret) {
        expect(cocktail.story).toBe(cocktail.talkingPoints?.join('\n'))
      } else {
        expect(cocktail.story).toBe(cocktail.description)
      }
      expect(cocktail.recipeText).not.toMatch(/\boz\b/i)
      expect(cocktail.description).toMatch(/(?:칵테일|한 잔)입니다/)
      expect(cocktail.talkingPoints?.every((point) => point.trim().length > 0)).toBe(true)
      expect(cocktail.talkingPoints?.every((point) => point.endsWith('.'))).toBe(true)
      expect(cocktail.ingredients.every((ingredient) =>
        !/\d+(?:\.\d+)?\s*(?:ml|oz|대시|티스푼|개|조각|방울)|바 스푼/i.test(ingredient),
      )).toBe(true)
    }
  })

  it('keeps secret cocktails out of public collections and random selection', () => {
    const secretIds = new Set(['cocktail_signature_042', 'cocktail_signature_043'])

    expect(cocktails.filter((cocktail) => cocktail.secret)).toHaveLength(2)
    expect(publicCocktails.every((cocktail) => !secretIds.has(cocktail.id))).toBe(true)
    expect(initCandidatePool().every((cocktail) => !secretIds.has(cocktail.id))).toBe(true)
    for (let index = 0; index < 100; index += 1) {
      expect(secretIds.has(getRandomCocktail().id)).toBe(false)
    }
  })
})

describe('explicit cocktail lookup', () => {
  it('matches cocktail names in a sentence', () => {
    expect(findCocktailByName('마티니 주세요')?.name).toBe('마티니')
    expect(findCocktailByName('Mojito 한 잔')?.nameEn).toBe('Mojito')
    expect(findCocktailByName('XYZ 한 잔')?.nameEn).toBe('XYZ')
  })

  it('does not steal preference-based recommendation requests', () => {
    expect(isRecommendationIntent('과일 향 나는 칵테일 추천해줘')).toBe(true)
    expect(findCocktailByName('과일 향 나는 칵테일 추천해줘')).toBeNull()
    expect(findCocktailByName('진 베이스로 추천해줘')).toBeNull()
  })

  it('keeps an explicit cocktail name above recommendation intent', () => {
    expect(isRecommendationIntent('모히토 추천해줘')).toBe(true)
    expect(findCocktailByName('모히토 추천해줘')?.name).toBe('모히토')
  })
})
