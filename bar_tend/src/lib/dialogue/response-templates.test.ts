import { describe, it, expect } from 'vitest'
import { INTENT_RESPONSE_TEMPLATES, COCKTAIL_FALLBACK_TEMPLATES, MOOD_SUB_TEMPLATES, MOOD_DEFAULT, MOOD_KEYWORD_MAP, TASTE_SUB_TEMPLATES, TASTE_DEFAULT, TASTE_KEYWORD_MAP, RUDE_SUB_TEMPLATES, RUDE_DEFAULT, RUDE_KEYWORD_MAP, STORY_FALLBACK, STORY_PERSON_MISSING_TEMPLATE, RESPONSE_TEMPLATE_DRAFT_SOURCES, formatCocktailMentionDraft, getTemplateFallbackSource } from './response-templates.js'
import type { CocktailData } from '../../types.js'
import dialoguesData from '../../data/dialogues.json'
import { isResponsePlanDialogueCategory } from './response-plan-adapter.js'

const templateGroups = [
  INTENT_RESPONSE_TEMPLATES,
  COCKTAIL_FALLBACK_TEMPLATES,
  MOOD_SUB_TEMPLATES,
  TASTE_SUB_TEMPLATES,
  RUDE_SUB_TEMPLATES,
  { story: STORY_FALLBACK },
]

const namedTemplateGroups = [
  ['intent', INTENT_RESPONSE_TEMPLATES],
  ['cocktail', COCKTAIL_FALLBACK_TEMPLATES],
  ['mood', MOOD_SUB_TEMPLATES],
  ['taste', TASTE_SUB_TEMPLATES],
  ['rude', RUDE_SUB_TEMPLATES],
  ['story', { unresolved: STORY_FALLBACK }],
] as const

describe('dialogue response source contract', () => {
  it('backs every referenced dialogue category with JSON fallback or ResponsePlan data', () => {
    for (const templates of templateGroups) {
      for (const template of Object.values(templates)) {
        if (!template.dialogueCategory) continue
        const category = dialoguesData.categories[template.dialogueCategory as keyof typeof dialoguesData.categories]
        const hasJsonFallback = (category?.lines.length ?? 0) > 0
        const hasResponsePlan = isResponsePlanDialogueCategory(template.dialogueCategory)
        expect(
          hasJsonFallback || hasResponsePlan,
          `missing dialogue source "${template.dialogueCategory}"`,
        ).toBe(true)
      }
    }
  })

  it('documents which response-template fallbacks are locally owned', () => {
    const locallyOwned: string[] = []
    const dialogueBacked: string[] = []

    for (const [groupName, templates] of namedTemplateGroups) {
      for (const [key, template] of Object.entries(templates)) {
        const label = `${groupName}:${key}`
        if (getTemplateFallbackSource(template) === 'response-template') {
          locallyOwned.push(label)
        } else {
          dialogueBacked.push(label)
        }
      }
    }

    if (getTemplateFallbackSource(MOOD_DEFAULT) === 'response-template') locallyOwned.push('mood:default')
    if (getTemplateFallbackSource(TASTE_DEFAULT) === 'response-template') locallyOwned.push('taste:default')
    if (getTemplateFallbackSource(RUDE_DEFAULT) === 'response-template') locallyOwned.push('rude:default')
    else dialogueBacked.push('rude:default')

    expect(locallyOwned.sort()).toEqual([
      'intent:exit-intent',
      'mood:default',
      'taste:default',
    ])
    expect(dialogueBacked.length).toBeGreaterThan(0)
  })

  it('documents the remaining inline draft text sources', () => {
    expect(RESPONSE_TEMPLATE_DRAFT_SOURCES).toEqual({
      storyPersonMissing: 'response-template',
      cocktailMention: 'cocktail-data-and-template',
      cocktailInfo: 'cocktail-data-and-template',
      shakeOrder: 'cocktail-data-and-template',
      martiniLoreFollowup: 'response-template',
    })
  })
})

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

  it('every template has a non-empty fallback and valid tone', () => {
    const validExpressions = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [intent, tmpl] of Object.entries(INTENT_RESPONSE_TEMPLATES)) {
      expect(tmpl.fallback, `${intent}: fallback`).toBeTruthy()
      expect(validExpressions, `${intent}: tone`).toContain(tmpl.tone)
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

  it('every template has a non-empty fallback and valid tone', () => {
    const validExpressions = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [intent, tmpl] of Object.entries(COCKTAIL_FALLBACK_TEMPLATES)) {
      expect(tmpl.fallback, `${intent}: fallback`).toBeTruthy()
      expect(validExpressions, `${intent}: tone`).toContain(tmpl.tone)
    }
  })
})

describe('MOOD_SUB_TEMPLATES', () => {
  it('covers all moods from MOOD_KEYWORD_MAP', () => {
    for (const key of Object.keys(MOOD_KEYWORD_MAP)) {
      expect(MOOD_SUB_TEMPLATES[key], `missing template for mood "${key}"`).toBeDefined()
    }
  })

  it('every template has non-empty fallback and valid tone', () => {
    const valid = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [mood, tmpl] of Object.entries(MOOD_SUB_TEMPLATES)) {
      expect(tmpl.fallback, `${mood}: fallback`).toBeTruthy()
      expect(valid, `${mood}: tone`).toContain(tmpl.tone)
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

  it('every template has non-empty fallback and valid tone', () => {
    const valid = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [key, tmpl] of Object.entries(TASTE_SUB_TEMPLATES)) {
      expect(tmpl.fallback, `${key}: fallback`).toBeTruthy()
      expect(valid, `${key}: tone`).toContain(tmpl.tone)
    }
  })
})

describe('RUDE_SUB_TEMPLATES', () => {
  it('covers all rude keys from RUDE_KEYWORD_MAP', () => {
    for (const key of Object.keys(RUDE_KEYWORD_MAP)) {
      expect(RUDE_SUB_TEMPLATES[key], `missing template for rude "${key}"`).toBeDefined()
    }
  })

  it('every template has non-empty fallback and valid tone', () => {
    const valid = ['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']
    for (const [key, tmpl] of Object.entries(RUDE_SUB_TEMPLATES)) {
      expect(tmpl.fallback, `${key}: fallback`).toBeTruthy()
      expect(valid, `${key}: tone`).toContain(tmpl.tone)
    }
  })
})

describe('STORY_FALLBACK', () => {
  it('has a non-empty fallback and valid tone', () => {
    expect(STORY_FALLBACK.fallback).toBeTruthy()
    expect(['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']).toContain(STORY_FALLBACK.tone)
  })
})

describe('STORY_PERSON_MISSING_TEMPLATE', () => {
  it('returns correct response for a given person name', () => {
    const result = STORY_PERSON_MISSING_TEMPLATE('헤밍웨이')
    expect(result.text).toContain('헤밍웨이')
    expect(result.tone).toBe('talk')
  })
})

describe('RUDE_DEFAULT', () => {
  it('has a non-empty fallback and valid tone', () => {
    expect(RUDE_DEFAULT.fallback).toBeTruthy()
    expect(['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']).toContain(RUDE_DEFAULT.tone)
  })
})

describe('TASTE_DEFAULT', () => {
  it('has a non-empty fallback and valid tone', () => {
    expect(TASTE_DEFAULT.fallback).toBeTruthy()
    expect(['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']).toContain(TASTE_DEFAULT.tone)
  })
})

describe('MOOD_DEFAULT', () => {
  it('has a non-empty fallback and valid tone', () => {
    expect(MOOD_DEFAULT.fallback).toBeTruthy()
    expect(['idle', 'talk', 'surprised', 'smirk', 'sympathy', 'thinking', 'annoyed', 'stern', 'disappointed', 'embarrassed']).toContain(MOOD_DEFAULT.tone)
  })
})

describe('formatCocktailMentionDraft', () => {
  it('returns a valid response draft for a given cocktail', () => {
    const mockCocktail = {
      id: 'test',
      name: '모히토',
      story: '민트와 라임의 조화',
      vibe: '상쾌한 느낌',
    } as CocktailData

    const result = formatCocktailMentionDraft(mockCocktail)
    expect(result.text).toBeTruthy()
    expect(result.text).toContain('모히토')
    expect(result.tone).toBeDefined()
  })
})
