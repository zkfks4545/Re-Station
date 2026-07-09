import { describe, expect, it } from 'vitest'
import dialoguesData from '../../data/dialogues.json'
import keywordRulesData from '../../data/keyword-rules.json'
import type { DialoguesData } from '../../types.js'
import {
  isResponsePlanDialogueCategory,
  pickResponsePlanDialogue,
  RESPONSE_PLAN_DIALOGUE_CATEGORIES,
} from './response-plan-adapter.js'
import { RESPONSE_PLANS } from './response-plan-data.js'
import { pickDialogueFromSourcesWithPlans } from './dialogue-loader.js'

describe('Phase 11 dialogue source inventory', () => {
  const expectedLegacyKeywordDialogueCategories: string[] = []
  const expectedKeywordRuleJsonDeletionCandidates = [
    'bar-atmosphere',
    'bar-intro',
    'cocktail-request',
    'greeting',
    'guest-uncertain',
    'ingredient-constraint',
    'mood-happy',
    'mood-sad',
    'mood-tired',
    'overdrunk',
    'quiet-moment',
    'real-world-info',
    'rude-annoyed',
    'rude-boundary',
    'siesta-mention',
    'small-talk-weather',
    'taste-strong',
    'taste-sweet',
    'water-request',
  ]
  const expectedResponsePlanJsonFallbackDeletionCandidates = [
    'bar-atmosphere',
    'bar-intro',
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

  it('migrated ResponsePlan categories keep legacy fallback lines until deletion audit', () => {
    const missingFallbacks = RESPONSE_PLAN_DIALOGUE_CATEGORIES.filter(
      (category) => (dialogueCategories[category]?.lines.length ?? 0) === 0,
    )

    expect(missingFallbacks).toEqual([])
  })

  it('migrated ResponsePlan categories render without depending on legacy JSON lines', () => {
    const missingPlans = RESPONSE_PLAN_DIALOGUE_CATEGORIES.filter(
      (category) => !pickResponsePlanDialogue(category, [], () => 0),
    )

    expect(missingPlans).toEqual([])
  })

  it('migrated ResponsePlan categories remain text/expression-equivalent to legacy fallback lines', () => {
    const mismatches = RESPONSE_PLAN_DIALOGUE_CATEGORIES.flatMap((category) => {
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

  it('invalid ResponsePlan data falls back to legacy JSON lines through the dialogue source chain', () => {
    const category = 'water-request'
    const legacyLines = dialogueCategories[category].lines
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
      legacyLines,
      plansWithInvalidWaterRequest,
      () => 0,
    )

    expect(picked).toEqual(legacyLines[0])
  })

  it('documents keyword-rule JSON fallback categories eligible for category-by-category deletion review', () => {
    const candidates = keywordDialogueCategories
      .filter((category) => isResponsePlanDialogueCategory(category))
      .filter((category) => (dialogueCategories[category]?.lines.length ?? 0) > 0)
      .sort()

    expect(candidates).toEqual(expectedKeywordRuleJsonDeletionCandidates)
  })

  it('documents all dialogues.json categories that are now ResponsePlan fallback-only candidates', () => {
    const candidates = RESPONSE_PLAN_DIALOGUE_CATEGORIES
      .filter((category) => (dialogueCategories[category]?.lines.length ?? 0) > 0)
      .sort()

    expect(candidates).toEqual(expectedResponsePlanJsonFallbackDeletionCandidates)
  })
})
