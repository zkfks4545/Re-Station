import { describe, expect, it } from 'vitest'
import { initCandidatePool, isRecommendationIntent } from '../recommendation/question-engine.js'
import {
  cocktails,
  findCocktailByName,
  getAllCocktailData,
} from './database.js'

describe('cocktail data contract', () => {
  it('shares one hydrated collection between UI and recommendation', () => {
    expect(getAllCocktailData()).toBe(cocktails)
    expect(initCandidatePool()).toBe(cocktails)
    expect(cocktails).toHaveLength(44)

    for (const cocktail of cocktails) {
      expect(cocktail.features).toBeDefined()
      expect(cocktail.story).not.toBe('')
      expect(cocktail.ingredients.length).toBeGreaterThan(0)
    }
  })

  it('keeps IBA recipe provenance on newly added official cocktails', () => {
    const official = cocktails.filter((cocktail) => cocktail.recipe_source_url)

    expect(official).toHaveLength(42)
    expect(official.every((cocktail) =>
      cocktail.recipe_source_url?.startsWith('https://iba-world.com/iba-cocktail/'),
    )).toBe(true)
    expect(findCocktailByName('팔로마 한 잔')?.recipe_source_url).toContain('/paloma/')
  })

  it('uses one neutral DB style for recipes, ingredients, and descriptions', () => {
    for (const cocktail of cocktails) {
      expect(cocktail.story).toBe(cocktail.description)
      expect(cocktail.recipeText).not.toMatch(/\boz\b/i)
      expect(cocktail.description).toMatch(/칵테일입니다\.$/)
      expect(cocktail.ingredients.every((ingredient) =>
        !/\d+(?:\.\d+)?\s*(?:ml|oz|대시|티스푼|개|조각)|바 스푼/i.test(ingredient),
      )).toBe(true)
    }
  })
})

describe('explicit cocktail lookup', () => {
  it('matches cocktail names in a sentence', () => {
    expect(findCocktailByName('마티니 주세요')?.name).toBe('마티니')
    expect(findCocktailByName('Mojito 한 잔')?.nameEn).toBe('Mojito')
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
