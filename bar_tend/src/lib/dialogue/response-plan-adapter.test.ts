import { afterEach, describe, expect, it, vi } from 'vitest'
import dialoguesData from '../../data/dialogues.json'
import type { DialogueLine, Expression } from '../../types.js'
import { pickDialogue, pickDialogueFromSources } from './dialogue-loader.js'
import { RESPONSE_PLANS } from './response-plan-data.js'
import { pickResponsePlanDialogue } from './response-plan-adapter.js'
import { validateResponsePlan, type ResponsePlan } from './response-plan.js'

const generalChatLines = dialoguesData.categories['general-chat'].lines as DialogueLine[]
const barIntroLines = dialoguesData.categories['bar-intro'].lines as DialogueLine[]
const characterQueryLines = dialoguesData.categories['character-query'].lines as DialogueLine[]
const storyRequestLines = dialoguesData.categories['story-request'].lines as DialogueLine[]
const storyUnresolvedLines = dialoguesData.categories['story-unresolved'].lines as DialogueLine[]
const unknownCocktailLines = dialoguesData.categories['unknown-cocktail-request'].lines as DialogueLine[]
const randomRequestLines = dialoguesData.categories['random-request'].lines as DialogueLine[]
const recipeRequestLines = dialoguesData.categories['recipe-request'].lines as DialogueLine[]
const recommendationCancelLines = dialoguesData.categories['recommendation-cancel'].lines as DialogueLine[]
const smallFallbackCases = [
  {
    category: 'bar-atmosphere' as const,
    planId: 'karua.small-talk.bar-atmosphere',
    lines: dialoguesData.categories['bar-atmosphere'].lines as DialogueLine[],
  },
  {
    category: 'small-talk-weather' as const,
    planId: 'karua.small-talk.small-talk-weather',
    lines: dialoguesData.categories['small-talk-weather'].lines as DialogueLine[],
  },
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
  }))
}

describe('ResponsePlan 이중 읽기 어댑터', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('이관된 14개 카테고리·108개 문장이 필수 expression 계약을 충족한다', () => {
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

  it('general-chat ResponsePlan은 기존 JSON 문장과 동등하다', () => {
    expect(getPlanLines('karua.small-talk.general-chat')).toEqual(generalChatLines)
  })

  it('general-chat 13개 문장은 JSON 유무와 무관하게 expression을 보존한다', () => {
    generalChatLines.forEach((legacy, index) => {
      const random = () => (index + 0.1) / generalChatLines.length
      expect(pickResponsePlanDialogue('general-chat', generalChatLines, random)).toEqual(legacy)
      expect(pickResponsePlanDialogue('general-chat', [], random)).toEqual(legacy)
    })
  })

  it.each(moodCases)('$category ResponsePlan은 기존 JSON 문장과 동등하다', ({ category, planId }) => {
    const legacyLines = dialoguesData.categories[category].lines as DialogueLine[]
    expect(getPlanLines(planId)).toEqual(legacyLines)
  })

  it.each(moodCases)('$category 전체 문장의 expression을 보존한다', ({ category }) => {
    const legacyLines = dialoguesData.categories[category].lines as DialogueLine[]
    legacyLines.forEach((legacy, index) => {
      const random = () => (index + 0.1) / legacyLines.length
      expect(pickResponsePlanDialogue(category, legacyLines, random)).toEqual(legacy)
    })
  })

  it.each(moodCases)(
    '$category JSON 카테고리가 제거되어도 ResponsePlan을 우선한다',
    ({ category, planId, expression }) => {
      const plan = getPlan(planId)
      const first = plan.blocks.answer?.[0]
      expect(pickDialogueFromSources(category, [], () => 0)).toEqual({
        text: first?.text,
        expression,
      })
    },
  )

  it('bar-intro ResponsePlan은 기존 JSON 문장과 동등하다', () => {
    expect(getPlanLines('karua.small-talk.bar-intro')).toEqual(barIntroLines)
  })

  it('bar-intro 전체 문장은 JSON 유무와 무관하게 expression을 보존한다', () => {
    barIntroLines.forEach((legacy, index) => {
      const random = () => (index + 0.1) / barIntroLines.length
      expect(pickResponsePlanDialogue('bar-intro', barIntroLines, random)).toEqual(legacy)
      expect(pickResponsePlanDialogue('bar-intro', [], random)).toEqual(legacy)
    })
  })

  it('character-query ResponsePlan은 기존 JSON 문장과 동등하다', () => {
    expect(getPlanLines('karua.small-talk.character-query')).toEqual(characterQueryLines)
  })

  it('character-query 전체 문장은 JSON 유무와 무관하게 expression을 보존한다', () => {
    characterQueryLines.forEach((legacy, index) => {
      const random = () => (index + 0.1) / characterQueryLines.length
      expect(pickResponsePlanDialogue('character-query', characterQueryLines, random)).toEqual(legacy)
      expect(pickResponsePlanDialogue('character-query', [], random)).toEqual(legacy)
    })
  })

  it.each([
    {
      category: 'story-request' as const,
      planId: 'karua.explain.story-request',
      legacyLines: storyRequestLines,
    },
    {
      category: 'story-unresolved' as const,
      planId: 'karua.explain.story-unresolved',
      legacyLines: storyUnresolvedLines,
    },
  ])('$category ResponsePlan은 전체 문장의 text와 expression을 소유한다', ({ category, planId, legacyLines }) => {
    expect(getPlanLines(planId)).toEqual(legacyLines)
    legacyLines.forEach((legacy, index) => {
      const random = () => (index + 0.1) / legacyLines.length
      expect(pickDialogueFromSources(category, legacyLines, random)).toEqual(legacy)
      expect(pickDialogueFromSources(category, [], random)).toEqual(legacy)
    })
  })

  it('unknown-cocktail-request는 JSON 유무와 무관하게 전체 text와 expression을 보존한다', () => {
    expect(getPlanLines('karua.explain.unknown-cocktail-request')).toEqual(unknownCocktailLines)
    unknownCocktailLines.forEach((legacy, index) => {
      const random = () => (index + 0.1) / unknownCocktailLines.length
      expect(pickDialogueFromSources('unknown-cocktail-request', unknownCocktailLines, random)).toEqual(legacy)
      expect(pickDialogueFromSources('unknown-cocktail-request', [], random)).toEqual(legacy)
    })
  })

  it('random-request는 JSON 유무와 무관하게 전체 text와 expression을 보존한다', () => {
    expect(getPlanLines('karua.recommend.random-request')).toEqual(randomRequestLines)
    randomRequestLines.forEach((legacy, index) => {
      const random = () => (index + 0.1) / randomRequestLines.length
      expect(pickDialogueFromSources('random-request', randomRequestLines, random)).toEqual(legacy)
      expect(pickDialogueFromSources('random-request', [], random)).toEqual(legacy)
    })
  })

  it('recipe-request는 JSON 유무와 무관하게 전체 text와 expression을 보존한다', () => {
    expect(getPlanLines('karua.explain.recipe-request')).toEqual(recipeRequestLines)
    recipeRequestLines.forEach((legacy, index) => {
      const random = () => (index + 0.1) / recipeRequestLines.length
      expect(pickDialogueFromSources('recipe-request', recipeRequestLines, random)).toEqual(legacy)
      expect(pickDialogueFromSources('recipe-request', [], random)).toEqual(legacy)
    })
  })

  it('recommendation-cancel은 JSON 유무와 무관하게 전체 text와 expression을 보존한다', () => {
    expect(getPlanLines('karua.refusal.recommendation-cancel')).toEqual(recommendationCancelLines)
    recommendationCancelLines.forEach((legacy, index) => {
      const random = () => (index + 0.1) / recommendationCancelLines.length
      expect(pickDialogueFromSources('recommendation-cancel', recommendationCancelLines, random)).toEqual(legacy)
      expect(pickDialogueFromSources('recommendation-cancel', [], random)).toEqual(legacy)
    })
  })

  it.each(smallFallbackCases)(
    '$category는 JSON 유무와 무관하게 전체 text와 expression을 보존한다',
    ({ category, planId, lines }) => {
      expect(getPlanLines(planId)).toEqual(lines)
      lines.forEach((legacy, index) => {
        const random = () => (index + 0.1) / lines.length
        expect(pickDialogueFromSources(category, lines, random)).toEqual(legacy)
        expect(pickDialogueFromSources(category, [], random)).toEqual(legacy)
      })
    },
  )

  it('미이관 카테고리는 기존 dialogues.json 경로를 사용한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(pickDialogue('water-request')).toEqual(dialoguesData.categories['water-request'].lines[0])
  })
})
