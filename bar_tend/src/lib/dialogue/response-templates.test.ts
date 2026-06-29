import { describe, it, expect } from 'vitest'
import { INTENT_RESPONSE_TEMPLATES } from './response-templates.js'

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
