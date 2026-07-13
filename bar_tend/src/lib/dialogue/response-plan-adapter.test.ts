import { afterEach, describe, expect, it, vi } from 'vitest'
import dialoguesData from '../../data/dialogues.json'
import type { DialogueLine, Expression } from '../../types.js'
import { pickDialogue, pickDialogueFromSources } from './dialogue-loader.js'
import { pickResponsePlanDialogue } from './response-plan-adapter.js'
import { RESPONSE_PLANS } from './response-plan-data.js'
import { validateResponsePlan, type ResponsePlan } from './response-plan.js'

const dialogueCategories = dialoguesData.categories as Record<string, { lines: DialogueLine[] } | undefined>

const deletedJsonFallbackCases = [
  { category: 'general-chat' as const, planId: 'karua.small-talk.general-chat' },
  { category: 'bar-intro' as const, planId: 'karua.small-talk.bar-intro' },
  { category: 'character-query' as const, planId: 'karua.small-talk.character-query' },
  { category: 'bar-atmosphere' as const, planId: 'karua.small-talk.bar-atmosphere' },
  { category: 'small-talk-weather' as const, planId: 'karua.small-talk.small-talk-weather' },
  { category: 'guest-uncertain' as const, planId: 'karua.small-talk.guest-uncertain' },
  { category: 'quiet-moment' as const, planId: 'karua.small-talk.quiet-moment' },
  { category: 'greeting' as const, planId: 'karua.small-talk.greeting' },
  { category: 'cocktail-request' as const, planId: 'karua.recommend.cocktail-request' },
  { category: 'taste-sweet' as const, planId: 'karua.recommend.taste-sweet' },
  { category: 'taste-strong' as const, planId: 'karua.recommend.taste-strong' },
  { category: 'ingredient-constraint' as const, planId: 'karua.refusal.ingredient-constraint' },
  { category: 'real-world-info' as const, planId: 'karua.explain.real-world-info' },
  { category: 'mood-tired' as const, planId: 'karua.comfort.mood-tired' },
  { category: 'mood-sad' as const, planId: 'karua.comfort.mood-sad' },
  { category: 'mood-happy' as const, planId: 'karua.comfort.mood-happy' },
  { category: 'siesta-mention' as const, planId: 'karua.small-talk.siesta-mention' },
  { category: 'water-request' as const, planId: 'karua.small-talk.water-request' },
  { category: 'overdrunk' as const, planId: 'karua.comfort.overdrunk' },
  { category: 'rude-annoyed' as const, planId: 'karua.refusal.rude-annoyed' },
  { category: 'rude-boundary' as const, planId: 'karua.refusal.rude-boundary' },
  { category: 'story-request' as const, planId: 'karua.explain.story-request' },
  { category: 'story-unresolved' as const, planId: 'karua.explain.story-unresolved' },
  { category: 'unknown-cocktail-request' as const, planId: 'karua.explain.unknown-cocktail-request' },
  { category: 'random-request' as const, planId: 'karua.recommend.random-request' },
  { category: 'recipe-request' as const, planId: 'karua.explain.recipe-request' },
  { category: 'recommendation-cancel' as const, planId: 'karua.refusal.recommendation-cancel' },
] as const

const moodCases: readonly {
  category: 'mood-tired' | 'mood-sad' | 'mood-happy'
  planId: string
  expression: Expression
}[] = [
  { category: 'mood-tired', planId: 'karua.comfort.mood-tired', expression: 'sympathy' },
  { category: 'mood-sad', planId: 'karua.comfort.mood-sad', expression: 'sympathy' },
  { category: 'mood-happy', planId: 'karua.comfort.mood-happy', expression: 'smirk' },
]

function getPlan(planId: string): ResponsePlan {
  const plan = RESPONSE_PLANS.find((candidate) => candidate.id === planId)
  if (!plan) throw new Error(`missing ResponsePlan: ${planId}`)
  return plan
}

function getPlanLines(planId: string): DialogueLine[] {
  const plan = getPlan(planId)
  return (plan.blocks.answer ?? []).map((line) => ({
    text: line.text,
    expression: line.expression,
    responsePlanId: plan.id,
  }))
}

function expectCategoryRendersAllPlanLines(category: string, lines: readonly DialogueLine[]) {
  lines.forEach((line, index) => {
    const random = () => (index + 0.1) / lines.length
    expect(pickResponsePlanDialogue(category, [], random)).toEqual(line)
    expect(pickDialogueFromSources(category, [], random)).toEqual(line)
  })
}

describe('ResponsePlan dual-read adapter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps the ResponsePlan dialogue corpus valid and counted', () => {
    const formatterPlans = RESPONSE_PLANS.filter((plan) =>
      plan.request === 'random-pick-body'
      || plan.request === 'exact-recommendation-body'
      || plan.request === 'nearest-recommendation-body'
      || plan.request === 'recommendation-question'
      || plan.request === 'welcome-drink-body'
      || plan.request === 'welcome-feedback'
      || plan.request === 'farewell-entry'
      || plan.request === 'farewell-xyz-clarification'
      || plan.request === 'farewell-xyz-body'
      || plan.request === 'farewell-welcome-xyz-body'
      || plan.request === 'farewell-conversation'
      || plan.request === 'farewell-block'
      || plan.request === 'farewell-return-home')
    const dialoguePlans = RESPONSE_PLANS.filter((plan) => !formatterPlans.includes(plan))
    const answerLines = dialoguePlans.flatMap((plan) => plan.blocks.answer ?? [])

    expect(dialoguePlans).toHaveLength(27)
    expect(answerLines).toHaveLength(226)
    expect(RESPONSE_PLANS.every((plan) => validateResponsePlan(plan).valid)).toBe(true)
    expect(answerLines.every((line) => line.text.trim() && line.expression)).toBe(true)
    expect(formatterPlans.filter((plan) => plan.request === 'random-pick-body')).toHaveLength(1)
    expect(formatterPlans.filter((plan) => plan.request === 'exact-recommendation-body')).toHaveLength(8)
    expect(formatterPlans.filter((plan) => plan.request === 'nearest-recommendation-body')).toHaveLength(8)
    expect(formatterPlans.filter((plan) => plan.request === 'recommendation-question')).toHaveLength(2)
    expect(formatterPlans.filter((plan) => plan.request === 'welcome-drink-body')).toHaveLength(3)
    expect(formatterPlans.filter((plan) => plan.request === 'welcome-feedback')).toHaveLength(5)
    expect(formatterPlans.filter((plan) => plan.request === 'farewell-entry')).toHaveLength(1)
    expect(formatterPlans.filter((plan) => plan.request === 'farewell-xyz-clarification')).toHaveLength(1)
    expect(formatterPlans.filter((plan) => plan.request === 'farewell-xyz-body')).toHaveLength(1)
    expect(formatterPlans.filter((plan) => plan.request === 'farewell-welcome-xyz-body')).toHaveLength(1)
    expect(formatterPlans.filter((plan) => plan.request === 'farewell-conversation')).toHaveLength(5)
    expect(formatterPlans.filter((plan) => plan.request === 'farewell-block')).toHaveLength(1)
    expect(formatterPlans.filter((plan) => plan.request === 'farewell-return-home')).toHaveLength(1)
  })

  it.each(deletedJsonFallbackCases)('$category renders from ResponsePlan after JSON fallback deletion', ({ category, planId }) => {
    expect(dialogueCategories[category]).toBeUndefined()
    expectCategoryRendersAllPlanLines(category, getPlanLines(planId))
  })

  it.each(deletedJsonFallbackCases)('$category is available through pickDialogue without JSON lines', ({ category, planId }) => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    expect(pickDialogue(category)).toEqual(getPlanLines(planId)[0])
  })

  it.each(moodCases)('$category preserves expression through ResponsePlan rendering', ({ category, expression }) => {
    const planLines = getPlanLines(`karua.comfort.${category}`)
    planLines.forEach((line, index) => {
      const random = () => (index + 0.1) / planLines.length
      expect(pickResponsePlanDialogue(category, [], random)).toEqual(line)
    })

    const first = planLines[0]
    expect(pickDialogueFromSources(category, [], () => 0)).toEqual({
      text: first?.text,
      expression,
      responsePlanId: first?.responsePlanId,
    })
  })

  it('fallback-required categories still use the legacy dialogues.json path', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    expect(pickDialogue('taste-bitter')).toEqual(dialoguesData.categories['taste-bitter'].lines[0])
  })
})
