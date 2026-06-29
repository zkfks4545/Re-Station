import { describe, expect, it } from 'vitest'
import { cocktails } from './database.js'
import { findCocktailByLoreReference } from './lore-reference.js'

describe('cocktail lore reference search', () => {
  it.each([
    ['헤밍웨이가 즐겨마셨다는 걸로 주세요', '모히토'],
    ['007이 마시던 걸로 주세요', '마티니'],
    ['Sex and the City에 나온 걸로 주세요', '코스모폴리탄'],
    ['이름이 일출 같다는 그 칵테일 주세요', '데킬라 선라이즈'],
  ])('resolves %s from verified cocktail lore', (input, expectedName) => {
    expect(findCocktailByLoreReference(input, cocktails)?.cocktail.name).toBe(expectedName)
  })

  it('does not treat an explicit cocktail name as a lore reference', () => {
    expect(findCocktailByLoreReference('모히토 주세요', cocktails)).toBeNull()
  })
})
