import { describe, expect, it } from 'vitest'
import { getAllCocktailData } from '../cocktails/database.js'
import {
  applyQuestionAnswer,
  createRecommendationSourcePool,
  formatQuestion,
  getQuestionById,
  isRecommendationDecisive,
  isRecommendationIntent,
  pickFromPool,
  selectNextQuestion,
} from './question-engine.js'
import {
  addQuestionHistory,
  applyRecommendationSignals,
  createRecommendationState,
  filterCocktailsByRecommendationState,
  resolveCocktailsByRecommendationState,
} from './state.js'

describe('adaptive recommendation questions', () => {
  it('starts with an accessible flavor question before specialist terminology', () => {
    expect(selectNextQuestion(getAllCocktailData(), createRecommendationState())?.topic).toBe('flavor')
  })

  it('skips topics already known from recommendation state', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'taste.sweetness', value: 0.8, confidence: 1, source: 'rule' },
      { field: 'preferredIngredients', value: '진', confidence: 1, source: 'rule' },
    ])

    const question = selectNextQuestion(getAllCocktailData(), state)

    expect(question?.topic).not.toBe('flavor')
    expect(question?.topic).not.toBe('base')
  })

  it('does not repeat asked topics and stops after three questions', () => {
    let state = createRecommendationState()
    const pool = getAllCocktailData()
    const asked = new Set<string>()

    for (let count = 0; count < 3; count += 1) {
      const question = selectNextQuestion(pool, state)
      if (!question) break
      expect(asked.has(question!.topic)).toBe(false)
      asked.add(question!.topic)
      state = addQuestionHistory(state, { topic: question!.topic, answer: '카루아에게 맡기기' })
    }

    const cappedState = ['base', 'flavor', 'alcohol'].reduce(
      (current, topic) => addQuestionHistory(current, { topic, answer: '카루아에게 맡기기' }),
      createRecommendationState(),
    )

    expect(asked.size).toBeGreaterThan(0)
    expect(selectNextQuestion(pool, cappedState)).toBeNull()
  })

  it('applies a numbered JSON choice as structured state and filters candidates', () => {
    const question = getQuestionById('base-spirit')
    expect(question).not.toBeNull()

    const result = applyQuestionAnswer(createRecommendationState(), question!, '1')
    const filtered = filterCocktailsByRecommendationState(getAllCocktailData(), result.state)

    expect(result.state.preferredIngredients).toEqual(['진'])
    expect(result.acknowledgement).toBe('진을 선호 베이스로 반영했습니다.')
    expect(filtered.length).toBeGreaterThan(1)
    expect(filtered.length).toBeLessThan(getAllCocktailData().length)
    expect(filtered.every((cocktail) => cocktail.base_spirit === '진')).toBe(true)
    expect(filtered.some((cocktail) => cocktail.name === '다이키리')).toBe(false)
  })

  it('uses taste answers to narrow the candidate pool', () => {
    const question = getQuestionById('fizz')
    expect(question).not.toBeNull()

    const result = applyQuestionAnswer(createRecommendationState(), question!, '1')
    const filtered = filterCocktailsByRecommendationState(getAllCocktailData(), result.state)

    expect(filtered.length).toBeLessThan(getAllCocktailData().length)
    expect(filtered.every((cocktail) => cocktail.features.fizz >= 0.45)).toBe(true)
  })

  it('accepts free text answers without repeating input guidance in question copy', () => {
    const question = getQuestionById('fizz')
    expect(question).not.toBeNull()

    const result = applyQuestionAnswer(createRecommendationState(), question!, '탄산 없이 부드럽게')
    const rendered = formatQuestion(question!, result.acknowledgement)

    expect(result.state.taste.fizz).toBe(0.1)
    expect(rendered).toContain(question!.prompt)
    expect(rendered).not.toContain('직접 말씀하셔도')
    expect(rendered).not.toContain('1. 톡 쏘고 청량하게')
  })

  it('ends questioning only when Kahlua is asked to take over', () => {
    const question = getQuestionById('fizz')
    expect(question).not.toBeNull()

    const delegated = applyQuestionAnswer(
      createRecommendationState(),
      question!,
      '카루아에게 맡기기',
    )
    const unknown = applyQuestionAnswer(createRecommendationState(), question!, '잘 모르겠어요')

    expect(delegated.finishRecommendation).toBe(true)
    expect(delegated.state).toEqual(createRecommendationState())
    expect(unknown.finishRecommendation).toBe(false)
  })

  it('treats 아무거나 as asking Kahlua to take over while preserving prior answers', () => {
    const question = getQuestionById('fizz')!
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'taste.sweetness', value: 0.8, confidence: 1, source: 'question' },
    ])
    const delegated = applyQuestionAnswer(state, question, '그냥 아무거나 골라줘')
    const rejected = applyQuestionAnswer(state, question, '아무거나 말고 탄산 없이 잔잔하게')

    expect(delegated.finishRecommendation).toBe(true)
    expect(delegated.state).toEqual(state)
    expect(delegated.acknowledgement).toBe('현재까지의 응답을 기준으로 추천합니다.')
    expect(rejected.finishRecommendation).toBe(false)
    expect(rejected.state.taste.fizz).toBe(0.1)
  })

  it('maps every cocktail to at least one answer in every recommendation question', () => {
    const cocktails = getAllCocktailData()

    for (const question of [
      getQuestionById('base-spirit'),
      getQuestionById('flavor-profile'),
      getQuestionById('alcohol-strength'),
      getQuestionById('fizz'),
    ]) {
      expect(question).not.toBeNull()
      const choices = question!.choices.filter((choice) => !choice.finishRecommendation)

      for (const choice of choices) {
        const state = applyRecommendationSignals(createRecommendationState(), choice.signals)
        expect(filterCocktailsByRecommendationState(cocktails, state).length).toBeGreaterThan(0)
      }

      for (const cocktail of cocktails) {
        const mapped = choices.some((choice) => {
          const state = applyRecommendationSignals(createRecommendationState(), choice.signals)
          return filterCocktailsByRecommendationState([cocktail], state).length === 1
        })
        expect(mapped, `${cocktail.name} has no answer for ${question!.id}`).toBe(true)
      }
    }
  })

  it('returns at least one result for every complete choice combination', () => {
    const cocktails = getAllCocktailData()
    const questions = [
      getQuestionById('base-spirit'),
      getQuestionById('flavor-profile'),
      getQuestionById('alcohol-strength'),
      getQuestionById('fizz'),
    ]

    expect(questions.every(Boolean)).toBe(true)
    const combinations = questions.reduce<Array<Array<NonNullable<(typeof questions)[number]>['choices'][number]>>>(
      (paths, question) => paths.flatMap((path) =>
        question!.choices
          .filter((choice) => !choice.finishRecommendation)
          .map((choice) => [...path, choice]),
      ),
      [[]],
    )

    expect(combinations).toHaveLength(120)
    for (const choices of combinations) {
      const state = choices.reduce(
        (current, choice) => applyRecommendationSignals(current, choice.signals),
        createRecommendationState(),
      )
      const resolved = resolveCocktailsByRecommendationState(cocktails, state)

      expect(
        resolved.cocktails.length,
        choices.map((choice) => choice.label).join(' > '),
      ).toBeGreaterThan(0)
    }
  })

  it('keeps asking when two answers only make one candidate clearly dominant', () => {
    const baseQuestion = getQuestionById('base-spirit')!
    const flavorQuestion = getQuestionById('flavor-profile')!
    const baseState = applyQuestionAnswer(
      createRecommendationState(),
      baseQuestion,
      '데킬라 또는 보드카',
    ).state
    const state = applyQuestionAnswer(baseState, flavorQuestion, '달콤하고 과일향 나게').state
    const pool = filterCocktailsByRecommendationState(getAllCocktailData(), state)

    expect(pool.length).toBeGreaterThan(1)
    expect(isRecommendationDecisive(pool)).toBe(false)
    expect(selectNextQuestion(pool, state)).not.toBeNull()
    expect(pool.some((cocktail) => cocktail.name === '데킬라 선라이즈')).toBe(true)
  })

  it('ends early only when one candidate actually remains', () => {
    const cocktail = getAllCocktailData()[0]

    expect(isRecommendationDecisive([cocktail])).toBe(true)
  })

  it('keeps asking when only a broad base preference is known', () => {
    const question = getQuestionById('base-spirit')!
    const state = applyQuestionAnswer(createRecommendationState(), question, '진').state
    const pool = filterCocktailsByRecommendationState(getAllCocktailData(), state)

    expect(isRecommendationDecisive(pool)).toBe(false)
    expect(selectNextQuestion(pool, state)).not.toBeNull()
  })

  it('excludes already recommended cocktails from the next source pool', () => {
    const [first, second] = getAllCocktailData()
    const sourcePool = createRecommendationSourcePool([first.id, second.id])

    expect(sourcePool.exhausted).toBe(false)
    expect(sourcePool.cocktails).not.toContain(first)
    expect(sourcePool.cocktails).not.toContain(second)
    expect(sourcePool.cocktails.length).toBe(getAllCocktailData().length - 2)
  })

  it('signals exhaustion when every cocktail has already been recommended', () => {
    const sourcePool = createRecommendationSourcePool(
      getAllCocktailData().map((cocktail) => cocktail.id),
    )

    expect(sourcePool.cocktails).toHaveLength(0)
    expect(sourcePool.exhausted).toBe(true)
  })

  it('detects recommendation intent from various natural inputs', () => {
    expect(isRecommendationIntent('추천해줘')).toBe(true)
    expect(isRecommendationIntent('골라줘')).toBe(true)
    expect(isRecommendationIntent('달달한 칵테일')).toBe(true)
    expect(isRecommendationIntent('오늘 뭐 마실까')).toBe(true)
    expect(isRecommendationIntent('안녕하세요')).toBe(false)
    expect(isRecommendationIntent('날씨 좋네요')).toBe(false)
  })

  it('picks the best cocktail from a pool using taste preference', () => {
    const pool = getAllCocktailData()
    const result = pickFromPool(pool, { sweetness: 0.9 })

    expect(result).not.toBeNull()
    expect(pool).toContain(result)
  })

  it('formats question with default lead-in when no acknowledgement exists', () => {
    const question = getQuestionById('fizz')!
    const formatted = formatQuestion(question, null)

    expect(formatted).toContain('한 가지만 더 여쭤볼게요.')
    expect(formatted).toContain(question.prompt)
  })
})
