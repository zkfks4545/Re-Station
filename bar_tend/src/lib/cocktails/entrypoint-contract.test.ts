import { describe, expect, it } from 'vitest'
import * as cocktailRepository from './index.js'

describe('cocktail repository entrypoint', () => {
  it('exposes the shared catalog and query API from one stable module', () => {
    expect(cocktailRepository.cocktails.length).toBeGreaterThan(0)
    expect(cocktailRepository.publicCocktails.length).toBeGreaterThan(0)
    const first = cocktailRepository.publicCocktails[0]
    expect(cocktailRepository.getCocktailById(first.id)).toBe(first)
    expect(cocktailRepository.findCocktailByName(first.name)).toBe(first)
    expect(cocktailRepository.getPublicCocktailData()).toEqual(cocktailRepository.publicCocktails)
  })
})
