import { describe, it, expect } from 'vitest'
import { INTENT_RESPONSE_TEMPLATES, COCKTAIL_FALLBACK_TEMPLATES, MOOD_SUB_TEMPLATES, MOOD_DEFAULT, MOOD_KEYWORD_MAP, TASTE_SUB_TEMPLATES, TASTE_DEFAULT, TASTE_KEYWORD_MAP, RUDE_SUB_TEMPLATES, RUDE_DEFAULT, RUDE_KEYWORD_MAP, STORY_FALLBACK, STORY_PERSON_MISSING_TEMPLATE, formatCocktailMentionResponse } from './response-templates.js'
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

describe('MOOD_SUB_TEMPLATES', () => {
  it('covers all moods from MOOD_KEYWORD_MAP', () => {
    for (const key of Object.keys(MOOD_KEYWORD_MAP)) {
      expect(MOOD_SUB_TEMPLATES[key], `missing template for mood "${key}"`).toBeDefined()
    }
  })

  it('every template has non-empty fallback and valid expression', () => {
    const valid = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [mood, tmpl] of Object.entries(MOOD_SUB_TEMPLATES)) {
      expect(tmpl.fallback, `${mood}: fallback`).toBeTruthy()
      expect(valid, `${mood}: expression`).toContain(tmpl.expression)
    }
  })
})

describe('MOOD_KEYWORD_MAP', () => {
  it('defines non-empty keyword arrays for every mood', () => {
    for (const [mood, keywords] of Object.entries(MOOD_KEYWORD_MAP)) {
      expect(keywords.length, `${mood}: at least one keyword`).toBeGreaterThan(0)
      for (const kw of keywords) {
        expect(typeof kw, `${mood}: keyword "${kw}"`).toBe('string')
      }
    }
  })

  it('does not share keywords with TASTE_KEYWORD_MAP', () => {
    const moodWords = new Set(Object.values(MOOD_KEYWORD_MAP).flat())
    const tasteWords = new Set(Object.values(TASTE_KEYWORD_MAP).flat())
    for (const w of moodWords) {
      expect(tasteWords.has(w), `mood keyword "${w}" should not be in TASTE_KEYWORD_MAP`).toBe(false)
    }
  })
})

describe('TASTE_SUB_TEMPLATES', () => {
  it('covers all taste keys from TASTE_KEYWORD_MAP', () => {
    for (const key of Object.keys(TASTE_KEYWORD_MAP)) {
      expect(TASTE_SUB_TEMPLATES[key], `missing template for taste "${key}"`).toBeDefined()
    }
  })

  it('every template has non-empty fallback and valid expression', () => {
    const valid = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [key, tmpl] of Object.entries(TASTE_SUB_TEMPLATES)) {
      expect(tmpl.fallback, `${key}: fallback`).toBeTruthy()
      expect(valid, `${key}: expression`).toContain(tmpl.expression)
    }
  })
})

describe('RUDE_SUB_TEMPLATES', () => {
  it('covers all rude keys from RUDE_KEYWORD_MAP', () => {
    for (const key of Object.keys(RUDE_KEYWORD_MAP)) {
      expect(RUDE_SUB_TEMPLATES[key], `missing template for rude "${key}"`).toBeDefined()
    }
  })

  it('every template has non-empty fallback and valid expression', () => {
    const valid = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [key, tmpl] of Object.entries(RUDE_SUB_TEMPLATES)) {
      expect(tmpl.fallback, `${key}: fallback`).toBeTruthy()
      expect(valid, `${key}: expression`).toContain(tmpl.expression)
    }
  })
})

describe('STORY_FALLBACK', () => {
  it('has a non-empty fallback and valid expression', () => {
    expect(STORY_FALLBACK.fallback).toBeTruthy()
    expect(['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']).toContain(STORY_FALLBACK.expression)
  })
})

describe('STORY_PERSON_MISSING_TEMPLATE', () => {
  it('returns correct response for a given person name', () => {
    const result = STORY_PERSON_MISSING_TEMPLATE('헤밍웨이')
    expect(result.response).toContain('헤밍웨이')
    expect(result.expression).toBe('talk')
  })
})

describe('RUDE_DEFAULT', () => {
  it('has a non-empty fallback and valid expression', () => {
    expect(RUDE_DEFAULT.fallback).toBeTruthy()
    expect(['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']).toContain(RUDE_DEFAULT.expression)
  })
})

describe('TASTE_DEFAULT', () => {
  it('has a non-empty fallback and valid expression', () => {
    expect(TASTE_DEFAULT.fallback).toBeTruthy()
    expect(['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']).toContain(TASTE_DEFAULT.expression)
  })
})

describe('MOOD_DEFAULT', () => {
  it('has a non-empty fallback and valid expression', () => {
    expect(MOOD_DEFAULT.fallback).toBeTruthy()
    expect(['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']).toContain(MOOD_DEFAULT.expression)
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
