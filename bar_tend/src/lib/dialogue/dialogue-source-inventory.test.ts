import { describe, expect, it } from 'vitest'
import dialoguesData from '../../data/dialogues.json'
import keywordRulesData from '../../data/keyword-rules.json'
import type { DialoguesData } from '../../types.js'
import {
  isResponsePlanDialogueCategory,
  pickResponsePlanDialogue,
  RESPONSE_PLAN_DIALOGUE_CATEGORIES,
} from './response-plan-adapter.js'
import { RESPONSE_PLANS } from './response-plan-catalog.js'
import { pickDialogueFromSourcesWithPlans } from './dialogue-loader.js'

describe('Phase 11 dialogue source inventory', () => {
  const expectedLegacyKeywordDialogueCategories: string[] = []
  const responsePlanOnlyReadyCategories = [
    'bar-atmosphere',
    'bar-intro',
    'character-preference-drink',
    'character-preference-general',
    'character-query',
    'cocktail-request',
    'general-chat',
    'greeting',
    'guest-uncertain',
    'ingredient-constraint',
    'mood-happy',
    'mood-sad',
    'mood-tired',
    'overdrunk',
    'quiet-moment',
    'random-request',
    'real-world-info',
    'recipe-request',
    'recommendation-cancel',
    'rude-annoyed',
    'rude-boundary',
    'siesta-mention',
    'small-talk-weather',
    'story-request',
    'story-unresolved',
    'taste-strong',
    'taste-sweet',
    'unknown-cocktail-request',
    'water-request',
  ]
  const fallbackRequiredCategories = [
    'rude-disappointed',
    'taste-bitter',
    'taste-refresh',
  ]
  const keywordRuleDeletionPendingCategories: string[] = []
  const deletedJsonFallbackCategories = [
    'bar-atmosphere',
    'bar-intro',
    'character-preference-drink',
    'character-preference-general',
    'character-query',
    'cocktail-request',
    'general-chat',
    'greeting',
    'guest-uncertain',
    'ingredient-constraint',
    'mood-happy',
    'mood-sad',
    'mood-tired',
    'overdrunk',
    'quiet-moment',
    'random-request',
    'real-world-info',
    'recipe-request',
    'recommendation-cancel',
    'rude-annoyed',
    'rude-boundary',
    'siesta-mention',
    'small-talk-weather',
    'story-request',
    'story-unresolved',
    'taste-strong',
    'taste-sweet',
    'unknown-cocktail-request',
    'water-request',
  ]
  const deletionPendingJsonFallbackCategories = responsePlanOnlyReadyCategories
    .filter((category) => !deletedJsonFallbackCategories.includes(category))
  const dialogueCategories = (dialoguesData as DialoguesData).categories
  const keywordDialogueCategories = Array.from(new Set(
    keywordRulesData
      .map((rule) => rule.dialogueCategory)
      .filter((category): category is string => typeof category === 'string' && category.length > 0),
  ))

  it('keyword rule dialogueCategory references resolve to a known dialogue source', () => {
    const unresolved = keywordDialogueCategories.filter(
      (category) => !dialogueCategories[category] && !isResponsePlanDialogueCategory(category),
    )

    expect(unresolved).toEqual([])
  })

  it('documents ResponsePlan-only categories ready to render without legacy JSON lines', () => {
    const actual = RESPONSE_PLAN_DIALOGUE_CATEGORIES
      .filter((category) => pickResponsePlanDialogue(category, [], () => 0))
      .sort()

    expect(actual).toEqual([...responsePlanOnlyReadyCategories].sort())
  })

  it('documents categories whose legacy JSON fallback is still contract-required', () => {
    const missingFallbacks = fallbackRequiredCategories.filter(
      (category) => (dialogueCategories[category]?.lines.length ?? 0) === 0,
    )
    const accidentallyMigrated = fallbackRequiredCategories.filter(
      (category) => isResponsePlanDialogueCategory(category),
    )

    expect(missingFallbacks).toEqual([])
    expect(accidentallyMigrated).toEqual([])
  })

  it('keeps ResponsePlan-ready JSON fallbacks only as deletion-pending safety nets', () => {
    const missingFallbacks = deletionPendingJsonFallbackCategories.filter(
      (category) => (dialogueCategories[category]?.lines.length ?? 0) === 0,
    )
    const stillPresentDeletedFallbacks = deletedJsonFallbackCategories.filter(
      (category) => (dialogueCategories[category]?.lines.length ?? 0) > 0,
    )

    expect(missingFallbacks).toEqual([])
    expect(stillPresentDeletedFallbacks).toEqual([])
  })

  it('ResponsePlan-only categories render without depending on legacy JSON lines', () => {
    const missingPlans = responsePlanOnlyReadyCategories.filter(
      (category) => !pickResponsePlanDialogue(category, [], () => 0),
    )

    expect(missingPlans).toEqual([])
  })

  it('deletion-pending JSON fallbacks remain text/expression-equivalent to ResponsePlan lines', () => {
    const mismatches = deletionPendingJsonFallbackCategories.flatMap((category) => {
      const legacyLines = dialogueCategories[category]?.lines ?? []
      return legacyLines.flatMap((legacyLine, index) => {
        const picked = pickResponsePlanDialogue(category, [], () => (index + 0.1) / legacyLines.length)
        return picked?.text === legacyLine.text && picked.expression === legacyLine.expression
          ? []
          : [`${category}[${index}]`]
      })
    })

    expect(mismatches).toEqual([])
  })

  it('documents keyword-rule categories still served only by legacy dialogues.json', () => {
    const legacyOnlyCategories = keywordDialogueCategories
      .filter((category) => !isResponsePlanDialogueCategory(category))
      .sort()

    expect(legacyOnlyCategories).toEqual([...expectedLegacyKeywordDialogueCategories].sort())
  })

  it('keyword-rule dialogue categories can render through ResponsePlan without legacy JSON lines', () => {
    const missing = keywordDialogueCategories.filter(
      (category) => !pickResponsePlanDialogue(category, [], () => 0),
    )

    expect(missing).toEqual([])
  })

  it('invalid ResponsePlan data no longer falls back through deleted JSON safety nets', () => {
    const category = 'water-request'
    const validPlanIds = new Set(RESPONSE_PLANS
      .filter((plan) => plan.request === category)
      .map((plan) => plan.id))
    const plansWithInvalidWaterRequest = [
      ...RESPONSE_PLANS.filter((plan) => !validPlanIds.has(plan.id)),
      {
        id: 'test.invalid.water-request',
        speaker: 'karua',
        intent: 'small_talk',
        request: category,
        blocks: { answer: [{ text: '', expression: 'talk' }] },
        fallbackText: 'invalid',
      },
    ] as const

    const picked = pickDialogueFromSourcesWithPlans(
      category,
      [],
      plansWithInvalidWaterRequest,
      () => 0,
    )

    expect(picked).toBeNull()
  })

  it('documents keyword-rule JSON fallback categories eligible for category-by-category deletion review', () => {
    const candidates = keywordDialogueCategories
      .filter((category) => isResponsePlanDialogueCategory(category))
      .filter((category) => (dialogueCategories[category]?.lines.length ?? 0) > 0)
      .sort()

    expect(candidates).toEqual(keywordRuleDeletionPendingCategories)
  })

  it('documents all dialogues.json categories that are now ResponsePlan fallback-only candidates', () => {
    const candidates = RESPONSE_PLAN_DIALOGUE_CATEGORIES
      .filter((category) => (dialogueCategories[category]?.lines.length ?? 0) > 0)
      .sort()

    expect(candidates).toEqual(deletionPendingJsonFallbackCategories)
  })
})
