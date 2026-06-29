import { describe, it, expect } from 'vitest'
import { INTENT_RESPONSE_TEMPLATES, COCKTAIL_FALLBACK_TEMPLATES, formatCocktailMentionResponse } from './response-templates.js'
import type { CocktailData } from '../../types.js'

describe('INTENT_RESPONSE_TEMPLATES', () => {
  it('covers all simple intents used in conversation.ts', () => {
    const required = [
      'exit-intent',
      'bar-setting',
      'character-query',
      'siesta-setting',
      'bar-atmosphere',
      'weather-talk',
      'uncertain-talk',
      'quiet-talk',
      'water-request',
      'overdrunk',
      'minor-no-alcohol',
      'non-alcoholic',
      'ingredient-constraint',
      'real-world-info',
      'recipe-query',
      'random-request',
      'unknown-cocktail-request',
      'recommendation-cancel',
      'general-chat',
    ]
    for (const intent of required) {
      expect(INTENT_RESPONSE_TEMPLATES[intent], `missing template for "${intent}"`).toBeDefined()
    }
  })

  it('every template has a non-empty fallback and valid expression', () => {
    const validExpressions = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [intent, tmpl] of Object.entries(INTENT_RESPONSE_TEMPLATES)) {
      expect(tmpl.fallback, `${intent}: fallback`).toBeTruthy()
      expect(validExpressions, `${intent}: expression`).toContain(tmpl.expression)
    }
  })
})

describe('COCKTAIL_FALLBACK_TEMPLATES', () => {
  it('covers cocktail-aware intents', () => {
    const required = ['cocktail-query', 'recommendation-query', 'cocktail-info-query']
    for (const intent of required) {
      expect(COCKTAIL_FALLBACK_TEMPLATES[intent], `missing template for "${intent}"`).toBeDefined()
    }
  })

  it('every template has a non-empty fallback and valid expression', () => {
    const validExpressions = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [intent, tmpl] of Object.entries(COCKTAIL_FALLBACK_TEMPLATES)) {
      expect(tmpl.fallback, `${intent}: fallback`).toBeTruthy()
      expect(validExpressions, `${intent}: expression`).toContain(tmpl.expression)
    }
  })
})

describe('formatCocktailMentionResponse', () => {
  it('returns a valid response for a given cocktail', () => {
    const mockCocktail = {
      id: 'test',
      name: '모히토',
      story: '민트와 라임의 조화',
      vibe: '상쾌한 느낌',
    } as CocktailData

    const result = formatCocktailMentionResponse(mockCocktail)
    expect(result.response).toBeTruthy()
    expect(result.response).toContain('모히토')
    expect(result.expression).toBeDefined()
  })
})
