import { describe, expect, it } from 'vitest'
import { getAllCocktailData } from '../cocktails/database.js'
import {
  formatWelcomeDrinkFeedbackReply,
  formatWelcomeDrinkFeedbackResponse,
  formatWelcomeDrinkReply,
  formatWelcomeDrinkResponse,
  isWelcomeDrinkFeedbackAnswer,
  selectWelcomeDrink,
  shouldHandleWelcomeDrinkFeedback,
  WELCOME_DRINK_FEEDBACK_QUESTION,
} from './welcome-drink.js'
import { selectCocktailTalkingPoint } from './response.js'
import type { ResponsePlan } from '../dialogue/response-plan.js'

describe('welcome drink selection', () => {
  it('selects an approachable classic cocktail', () => {
    const cocktail = selectWelcomeDrink()

    expect(cocktail.type).toBe('CLASSIC')
    expect(cocktail.features.alcohol_strength).toBeLessThanOrEqual(0.65)
    expect(cocktail.features.sweetness).toBeLessThanOrEqual(0.75)
  })

  it('falls back to available cocktails when the ideal pool is empty', () => {
    const [strongCocktail] = getAllCocktailData()
    const cocktail = selectWelcomeDrink([{
      ...strongCocktail,
      type: 'SIGNATURE',
      features: {
        ...strongCocktail.features,
        alcohol_strength: 0.95,
        sweetness: 0.9,
      },
    }])

    expect(cocktail.id).toBe(strongCocktail.id)
  })

  it('formats a welcome-drink reply without starting the recommendation survey', () => {
    const cocktail = selectWelcomeDrink()
    const reply = formatWelcomeDrinkReply(cocktail)

    expect(reply).toContain('웰컴드링크')
    expect(reply).toContain(cocktail.name_ko ?? cocktail.name)
    expect(reply).toContain(selectCocktailTalkingPoint(cocktail))
    expect(reply).not.toContain('앞서 나가지 않는 잔')
    expect(reply).not.toContain('선택해 주세요')
  })

  it('uses the same talking point selection as recommendation replies', () => {
    const cocktail = getAllCocktailData().find((item) => item.id === 'cocktail_classic_001')
    expect(cocktail).toBeDefined()

    const selectedPoint = selectCocktailTalkingPoint(cocktail!)
    const reply = formatWelcomeDrinkReply(cocktail!)

    expect(selectedPoint).not.toBe(cocktail!.talkingPoints?.[0])
    expect(reply).toContain(selectedPoint)
  })

  it.each([
    ['first', 0],
    ['after-order', 6],
    ['late', 11],
  ] as const)('keeps %s welcome ResponsePlan text and expression equal to legacy', (_case, alcoholStarTotal) => {
    const cocktail = selectWelcomeDrink()
    const legacy = formatWelcomeDrinkResponse(cocktail, { alcoholStarTotal, plans: [] })
    const migrated = formatWelcomeDrinkResponse(cocktail, { alcoholStarTotal })

    expect(migrated).toEqual(legacy)
    expect(migrated.expression).toBe('smirk')
  })

  it('prioritizes the welcome ResponsePlan over the legacy formatter', () => {
    const cocktail = selectWelcomeDrink()
    const plans: readonly ResponsePlan[] = [{
      id: 'test.welcome-drink-body',
      speaker: 'karua',
      intent: 'welcome_drink',
      state: 'first',
      request: 'welcome-drink-body',
      blocks: {
        answer: [{ text: 'plan:{cocktail_name}:{talking_point}', expression: 'thinking' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatWelcomeDrinkResponse(cocktail, { plans })).toEqual({
      text: `plan:${cocktail.name_ko ?? cocktail.name}:${selectCocktailTalkingPoint(cocktail)}`,
      expression: 'thinking',
    })
  })

  it('falls back to the legacy welcome formatter when ResponsePlan is unavailable', () => {
    const cocktail = selectWelcomeDrink()

    expect(formatWelcomeDrinkResponse(cocktail, { plans: [] })).toEqual({
      text: formatWelcomeDrinkReply(cocktail),
      expression: 'smirk',
    })
  })

  it.each([
    { text: 'plan:{cocktail_name}:{missing_slot}' },
    { text: 'plan:{opening}:{talking_point}' },
  ])('falls back safely when welcome slot rendering fails', ({ text }) => {
    const cocktail = selectWelcomeDrink()
    const plans: readonly ResponsePlan[] = [{
      id: `test.welcome-drink-slot.${text}`,
      speaker: 'karua',
      intent: 'welcome_drink',
      state: 'first',
      request: 'welcome-drink-body',
      blocks: {
        answer: [{ text, expression: 'smirk' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatWelcomeDrinkResponse(cocktail, { plans })).toEqual({
      text: formatWelcomeDrinkReply(cocktail),
      expression: 'smirk',
    })
  })

  it('keeps welcome drink selection unchanged while formatting with ResponsePlan', () => {
    const cocktails = getAllCocktailData().slice(0, 3)
    const selected = selectWelcomeDrink(cocktails)

    formatWelcomeDrinkResponse(selected)

    expect(selectWelcomeDrink([selected]).id).toBe(selected.id)
  })

  it('keeps welcome talking point selection unchanged while formatting with ResponsePlan', () => {
    const cocktail = getAllCocktailData().find((item) => item.id === 'cocktail_classic_001')!
    const before = selectCocktailTalkingPoint(cocktail)

    formatWelcomeDrinkResponse(cocktail)

    expect(selectCocktailTalkingPoint(cocktail)).toBe(before)
  })

  it('adjusts the welcome-drink reply after prior orders', () => {
    const cocktail = selectWelcomeDrink()
    const reply = formatWelcomeDrinkReply(cocktail, { alcoholStarTotal: 6 })

    expect(reply).toContain('첫 순서')
    expect(reply).toContain(selectCocktailTalkingPoint(cocktail))
  })

  it('treats a very late welcome drink as a pre-closing reset', () => {
    const cocktail = selectWelcomeDrink()
    const reply = formatWelcomeDrinkReply(cocktail, { alcoholStarTotal: 11 })

    expect(reply).toContain('꽤 늦었')
    expect(reply).toContain(selectCocktailTalkingPoint(cocktail))
  })

  it('defines a one-step welcome drink feedback question', () => {
    expect(WELCOME_DRINK_FEEDBACK_QUESTION.id).toBe('welcome-drink-feedback')
    expect(WELCOME_DRINK_FEEDBACK_QUESTION.prompt).toContain('괜찮')
    expect(WELCOME_DRINK_FEEDBACK_QUESTION.choices).toHaveLength(4)
    expect(WELCOME_DRINK_FEEDBACK_QUESTION.choices.every((choice) => choice.finishRecommendation)).toBe(true)
  })

  it('formats welcome drink feedback replies from buttons or free text', () => {
    const lighter = formatWelcomeDrinkFeedbackReply('조금 더 가볍게')
    expect(lighter.text).toContain('가볍')
    expect(lighter.expression).toBe('embarrassed')

    const positive = formatWelcomeDrinkFeedbackReply('맛있고 괜찮았어')
    expect(positive.text).toContain('밸런스')
    expect(positive.expression).toBe('smirk')

    const sweeter = formatWelcomeDrinkFeedbackReply('더 달았으면 좋겠어')
    expect(sweeter.text).toContain('단맛')
    expect(sweeter.expression).toBe('embarrassed')
  })

  it.each([
    ['positive', '좋았어요', 'smirk'],
    ['lighter', '조금 더 가볍게', 'embarrassed'],
    ['sweeter', '조금 더 달게', 'embarrassed'],
    ['alternate', '다른 느낌이 좋아요', 'embarrassed'],
    ['neutral', '잘 모르겠지만 기억해줘', 'embarrassed'],
  ] as const)('keeps %s welcome feedback ResponsePlan text and expression equal to legacy', (_case, answer, expression) => {
    const legacy = formatWelcomeDrinkFeedbackResponse(answer, { plans: [] })
    const migrated = formatWelcomeDrinkFeedbackResponse(answer)

    expect(migrated).toEqual(legacy)
    expect(migrated.expression).toBe(expression)
  })

  it('prioritizes the welcome feedback ResponsePlan over the legacy formatter', () => {
    const plans: readonly ResponsePlan[] = [{
      id: 'test.welcome-feedback',
      speaker: 'karua',
      intent: 'welcome_drink',
      state: 'positive',
      request: 'welcome-feedback',
      blocks: {
        answer: [{ text: 'plan feedback', expression: 'thinking' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatWelcomeDrinkFeedbackResponse('좋았어요', { plans })).toEqual({
      text: 'plan feedback',
      expression: 'thinking',
    })
  })

  it('falls back to the legacy welcome feedback formatter when ResponsePlan is unavailable', () => {
    expect(formatWelcomeDrinkFeedbackResponse('좋았어요', { plans: [] })).toEqual(
      formatWelcomeDrinkFeedbackReply('좋았어요'),
    )
  })

  it.each([
    { text: '' },
    { text: 'bad:{opening}' },
  ])('falls back safely when welcome feedback ResponsePlan rendering fails', ({ text }) => {
    const plans: readonly ResponsePlan[] = [{
      id: `test.welcome-feedback.${text || 'empty'}`,
      speaker: 'karua',
      intent: 'welcome_drink',
      state: 'positive',
      request: 'welcome-feedback',
      blocks: {
        answer: [{ text, expression: 'smirk' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatWelcomeDrinkFeedbackResponse('좋았어요', { plans })).toEqual(
      formatWelcomeDrinkFeedbackReply('좋았어요'),
    )
  })

  it('lets explicit orders bypass the welcome drink feedback prompt', () => {
    expect(shouldHandleWelcomeDrinkFeedback('general', '맛있고 괜찮았어')).toBe(true)
    expect(shouldHandleWelcomeDrinkFeedback('explicit-cocktail', '마티니 주문')).toBe(false)
    expect(shouldHandleWelcomeDrinkFeedback('recommendation', '추천해줘')).toBe(false)
    expect(shouldHandleWelcomeDrinkFeedback('safety', '죽고 싶어')).toBe(false)
  })

  it('lets small talk bypass the welcome drink feedback prompt', () => {
    expect(isWelcomeDrinkFeedbackAnswer('조금 더 달게 해줘')).toBe(true)
    expect(shouldHandleWelcomeDrinkFeedback('general', '오늘 너무 피곤했어')).toBe(false)
    expect(shouldHandleWelcomeDrinkFeedback('general', '여기 분위기 좋다')).toBe(false)
  })
})
