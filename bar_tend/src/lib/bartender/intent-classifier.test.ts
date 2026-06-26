import { describe, expect, it } from 'vitest'
import { IntentClassifier, type DialogueContext } from './intent-classifier.js'
import type { CocktailData } from '../../types.js'

const mockCocktails: CocktailData[] = [
  {
    id: 'mojito',
    name: '모히토',
    nameEn: 'Mojito',
    type: 'CLASSIC' as const,
    base_spirit: '럼',
    features: { sweetness: 0.4, alcohol_strength: 0.5, fizz: 0.7, sourness: 0.5 },
    image: '',
    description: '',
    recipe: [],
    recipe_source_url: '',
    official_category: '',
    aliases: ['모히또'],
    talkingPoints: ['모히토는 헤밍웨이가 특히 사랑해서 "나의 모히토"라고 부르며 즐겨 마심'],
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: true },
    aroma: ['시트러스', '허브', '민트'],
    base: '럼' as const,
    ingredients: ['럼', '라임', '설탕', '민트', '소다수'],
    story: '쿠바 혁명 시절 하바나의 작은 바에서 태어난 칵테일',
    vibe: '청량하고 상쾌한 여름의 맛',
    popCulture: '',
    glass: 'Highball glass',
    alcoholic: 'Alcoholic',
  },
]

const baseContext: DialogueContext = {
  mentionedCocktails: [],
  sessionPhase: 'conversation',
}

describe('IntentClassifier', () => {
  const classifier = new IntentClassifier(mockCocktails)

  describe('Direct cocktail references', () => {
    it('identifies direct cocktail mentions', () => {
      const result = classifier.classify('모히토 어때?', baseContext)

      expect(result.intent).toBe('order-cocktail')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
      expect(result.metadata.cocktailReferences).toHaveLength(1)
      expect(result.metadata.cocktailReferences[0].name).toBe('모히토')
      expect(result.entities.cocktailId).toBe('mojito')
    })

    it('handles cocktail aliases', () => {
      const result = classifier.classify('모히또 마실래', baseContext)

      expect(result.intent).toBe('order-cocktail')
      expect(result.metadata.cocktailReferences).toHaveLength(1)
      expect(result.metadata.cocktailReferences[0].name).toBe('모히토')
    })
  })

  describe('Pronoun references', () => {
    it('resolves pronouns to recently served cocktails', () => {
      const context: DialogueContext = {
        ...baseContext,
        lastServedCocktail: mockCocktails[0],
      }
      const result = classifier.classify('그거 더 마실래?', context)

      expect(result.metadata.cocktailReferences.some(r => r.type === 'pronoun')).toBe(true)
      expect(result.metadata.cocktailReferences.some(r => r.name === '모히토')).toBe(true)
    })
  })

  describe('Story query detection', () => {
    it('routes cocktail story questions to story-query', () => {
      const result1 = classifier.classify('모히토 얘기 좀 해줘', baseContext)
      expect(result1.intent).toBe('story-query')

      const result2 = classifier.classify('여기 얽힌 이야기를 더 들려줘요.', baseContext)
      expect(result2.intent).toBe('story-query')
    })

    it('small talk with story words triggers story-query', () => {
      const result = classifier.classify('모히토에 얽힌 이야기 좀 얘기해 줘', baseContext)

      expect(result.intent).toBe('story-query')
      expect(result.source).toBe('conversation')
    })
  })

  describe('Boundary enforcement', () => {
    it('general chat defaults to general-chat', () => {
      const result = classifier.classify('오늘 괜찮아?', baseContext)

      expect(result.intent).toBe('general-chat')
      expect(result.source).toBe('inference')
    })

    it('farewell phase blocks story-query', () => {
      const context: DialogueContext = {
        ...baseContext,
        sessionPhase: 'farewell',
      }
      const result = classifier.classify('이야기 들려줘', context)

      expect(result.metadata.contextualExclusions.blockedStoryQuery).toBe(true)
    })

    it('minor flag blocks recommendation', () => {
      const result = classifier.classify('나는 학생인데 술 추천해줘', baseContext)

      expect(result.metadata.contextualExclusions.blockedRecommendation).toBe(true)
    })
  })

  describe('Safety and exit', () => {
    it('safety concern routes to safety-alert', () => {
      const result = classifier.classify('죽고 싶어', baseContext)

      expect(result.intent).toBe('safety-alert')
      expect(result.source).toBe('input-router')
      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    })

    it('exit intent routes to exit-intent', () => {
      const result = classifier.classify('나갈게', baseContext)

      expect(result.intent).toBe('exit-intent')
    })
  })

  describe('Lore and person query false-positive prevention', () => {
    it('헤밍웨이가 마시던 게 무슨 칵테일이었는지 알아요? → story-query, not recommendation/mood', () => {
      const result = classifier.classify('헤밍웨이가 마시던 게 무슨 칵테일이었는지 알아요?', baseContext)

      expect(result.intent).toBe('story-query')
      expect(result.intent).not.toBe('recommendation-query')
      expect(result.intent).not.toBe('mood-talk')
    })

    it('헤밍웨이가 좋아하던 게 그거 맞나요? → story-query-followup, not recommendation/mood', () => {
      const result = classifier.classify('헤밍웨이가 좋아하던 게 그거 맞나요?', baseContext)

      expect(result.intent).toBe('story-query-followup')
      expect(result.intent).not.toBe('recommendation-query')
      expect(result.intent).not.toBe('mood-talk')
    })

    it('이 칵테일은 누가 만들었어요? → story-query, not recommendation/mood', () => {
      const result = classifier.classify('이 칵테일은 누가 만들었어요?', baseContext)

      expect(result.intent).toBe('story-query')
      expect(result.intent).not.toBe('recommendation-query')
      expect(result.intent).not.toBe('mood-talk')
    })

    it('이 이름은 왜 붙은 거예요? → story-query, not recommendation/mood', () => {
      const result = classifier.classify('이 이름은 왜 붙은 거예요?', baseContext)

      expect(result.intent).toBe('story-query')
      expect(result.intent).not.toBe('recommendation-query')
      expect(result.intent).not.toBe('mood-talk')
    })

    it('좋아하는 맛은 단맛이에요. → taste-query, not recommendation/mood', () => {
      const result = classifier.classify('좋아하는 맛은 단맛이에요.', baseContext)

      expect(result.intent).toBe('taste-query')
      expect(result.intent).not.toBe('recommendation-query')
      expect(result.intent).not.toBe('mood-talk')
    })

    it('좋은 일이 있었어요. → mood-talk, not recommendation-query', () => {
      const result = classifier.classify('좋은 일이 있었어요.', baseContext)

      expect(result.intent).toBe('mood-talk')
      expect(result.intent).not.toBe('recommendation-query')
    })
  })

  describe('bar-setting localization variants (Korean contraction/spacing)', () => {
    const variants = [
      '여긴 뭐하는곳인가요',
      '여긴 뭐 하는 곳인가요',
      '여기 뭐하는곳인가요',
      '여기 뭐 하는 곳인가요',
      '여기 뭐하는데요',
      '여긴 뭐하는데요',
      '여기 어디예요',
      '여긴 어디죠',
    ]

    variants.forEach(input => {
      it(`'${input}' → bar-setting`, () => {
        const result = classifier.classify(input, baseContext)
        expect(result.intent).toBe('bar-setting')
        expect(result.intent).not.toBe('general-chat')
      })
    })
  })

  describe('좋아 keyword context branching', () => {
    const base = { mentionedCocktails: [], sessionPhase: 'conversation' } as DialogueContext
    const ctx = new IntentClassifier(mockCocktails)

    it('헤밍웨이가 좋아하던 게 뭐예요? → story-query, not recommendation/mood', () => {
      const r = ctx.classify('헤밍웨이가 좋아하던 게 뭐예요?', base)
      expect(r.intent).toBe('story-query')
      expect(r.intent).not.toBe('recommendation-query')
      expect(r.intent).not.toBe('mood-talk')
    })

    it('좋아하는 맛은 단맛이에요. → taste-query, not recommendation/mood', () => {
      const r = ctx.classify('좋아하는 맛은 단맛이에요.', base)
      expect(r.intent).toBe('taste-query')
      expect(r.intent).not.toBe('recommendation-query')
      expect(r.intent).not.toBe('mood-talk')
    })

    it('좋은 일이 있었어요. → mood-talk (positive variant)', () => {
      const r = ctx.classify('좋은 일이 있었어요.', base)
      expect(r.intent).toBe('mood-talk')
      expect(r.intent).not.toBe('recommendation-query')
    })

    it('여기 분위기 좋아요. → bar-atmosphere', () => {
      const r = ctx.classify('여기 분위기 좋아요.', base)
      expect(r.intent).toBe('bar-atmosphere')
      expect(r.intent).not.toBe('recommendation-query')
      expect(r.intent).not.toBe('mood-talk')
    })

    it('뭐가 좋아요? → cocktail-query', () => {
      const r = ctx.classify('뭐가 좋아요?', base)
      expect(r.intent).toBe('cocktail-query')
      expect(r.intent).not.toBe('recommendation-query')
      expect(r.intent).not.toBe('mood-talk')
    })
  })
})
