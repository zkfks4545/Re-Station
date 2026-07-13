import { describe, expect, it } from 'vitest'
import { getAllCocktailData } from '../cocktails/database.js'
import {
  applyQuestionAnswer,
  createRecommendationSourcePool,
  formatQuestion,
  formatQuestionDialogueLine,
  getQuestionById,
  initCandidatePool,
  isRecommendationDecisive,
  isRecommendationIntent,
  pickFromPool,
  selectNextQuestion,
} from './question-engine.js'
import type { ResponsePlan } from '../dialogue/response-plan.js'
import {
  addQuestionHistory,
  applyRecommendationSignals,
  createRecommendationState,
  extractRecommendationSignals,
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

  it('still asks for a base spirit when only a non-base ingredient is known', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('심플하게 기주에 라임즙만 들어간걸로 주세요'),
    )

    expect(state.preferredIngredients).toContain('라임 주스')
    expect(selectNextQuestion(getAllCocktailData(), state)?.topic).toBe('base')
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
    expect(filtered.every((cocktail) =>
      cocktail.base_spirit === '진' || cocktail.ingredients.includes('진'),
    )).toBe(true)
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

  it('fills taste, base, strength, and fizz from one freely ordered input', () => {
    const signals = extractRecommendationSignals(
      '탄산은 빼고 약하게, 달콤한 럼 베이스로 추천해줘',
    )
    const state = applyRecommendationSignals(createRecommendationState(), signals)

    expect(state.taste.sweetness).toBe(0.8)
    expect(state.taste.fizz).toBe(0.1)
    expect(state.alcoholPreference).toBe('low')
    expect(state.preferredIngredients).toContain('럼')
  })

  it('does not ask taste or base again when those slots came from free input', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('달콤한 럼 베이스로 추천해줘'),
    )
    const pool = filterCocktailsByRecommendationState(getAllCocktailData(), state)
    const next = selectNextQuestion(pool, state)

    expect(next).not.toBeNull()
    expect(['alcohol', 'fizz']).toContain(next!.topic)
  })

  it('keeps extra slots mentioned while answering the active question', () => {
    const question = getQuestionById('base-spirit')!
    const result = applyQuestionAnswer(
      createRecommendationState(),
      question,
      '럼으로 할게요. 달콤하고 탄산 없이 약하게요.',
    )

    expect(result.state.preferredIngredients).toContain('럼')
    expect(result.state.taste.sweetness).toBe(0.8)
    expect(result.state.taste.fizz).toBe(0.1)
    expect(result.state.alcoholPreference).toBe('low')
  })

  it('asks no further slot question when all four slots are already known', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('럼 베이스로 달콤하고 탄산 없이 약하게 추천해줘'),
    )
    const pool = filterCocktailsByRecommendationState(getAllCocktailData(), state)

    expect(selectNextQuestion(pool, state)).toBeNull()
  })

  it('uses JSON dialogue flow hints to connect questions conversationally', () => {
    const firstQuestion = getQuestionById('flavor-profile')
    const nextQuestion = getQuestionById('alcohol-strength')
    expect(firstQuestion).not.toBeNull()
    expect(nextQuestion).not.toBeNull()

    const firstRendered = formatQuestion(firstQuestion!, null)
    const nextRendered = formatQuestion(nextQuestion!, '상큼한 맛을 반영했습니다.')

    expect(firstRendered).toContain(firstQuestion!.dialogueFlow!.leadIn)
    expect(nextRendered).toContain('상큼한 맛을 반영했습니다.')
    expect(nextRendered).toContain(nextQuestion!.dialogueFlow!.continuation)
    expect(nextRendered).toContain(nextQuestion!.prompt)
  })

  it('keeps a dialogue flow contract on every recommendation question', () => {
    for (const id of ['base-spirit', 'flavor-profile', 'alcohol-strength', 'fizz']) {
      const question = getQuestionById(id)
      expect(question).not.toBeNull()
      expect(question!.dialogueFlow?.leadIn.trim()).toBeTruthy()
      expect(question!.dialogueFlow?.continuation.trim()).toBeTruthy()
      expect(['open-preference', 'narrow-candidates', 'confirm-constraint']).toContain(
        question!.dialogueFlow?.goal,
      )
    }
  })

  it('keeps a text preset contract on every recommendation question sentence', () => {
    for (const id of ['base-spirit', 'flavor-profile', 'alcohol-strength', 'fizz']) {
      const question = getQuestionById(id)
      expect(question).not.toBeNull()
      expect(question!.promptPreset?.id).toBe('question.preference.select')
      expect(question!.dialogueFlow?.leadInPreset?.id).toBe('question.flow.leadIn')
      expect(question!.dialogueFlow?.continuationPreset?.id).toBe('question.flow.continuation')

      for (const choice of question!.choices) {
        expect(choice.acknowledgementPreset?.id).toBeTruthy()
      }
    }
  })

  it('ends questioning only when Karua is asked to take over', () => {
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

  it('treats 아무거나 as asking Karua to take over while preserving prior answers', () => {
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
    expect(sourcePool.cocktails.length).toBe(initCandidatePool().length - 2)
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

  it('keeps lime juice requests on simple lime classics', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      [
        ...extractRecommendationSignals('심플하게 기주에 라임즙만 들어간걸로 주세요'),
        { field: 'alcoholPreference', value: 'medium', confidence: 1, source: 'question' },
      ],
    )
    const resolved = resolveCocktailsByRecommendationState(getAllCocktailData(), state)
    const cocktail = pickFromPool(resolved.cocktails, state.taste)

    expect(resolved.cocktails.every((item) =>
      item.ingredients.some((ingredient) => ingredient.includes('라임 주스')),
    )).toBe(true)
    expect(cocktail?.name_en).toBe('Daiquiri')
  })

  it('formats question with default lead-in when no acknowledgement exists', () => {
    const question = getQuestionById('fizz')!
    const formatted = formatQuestion(question, null)

    expect(formatted).toContain(question.dialogueFlow!.leadIn)
    expect(formatted).toContain(question.prompt)
  })

  it('preserves acknowledgement and lead-in text through ResponsePlan formatting', () => {
    const question = getQuestionById('alcohol-strength')!
    const acknowledgement = question.choices[0].acknowledgement
    const formatted = formatQuestionDialogueLine(question, acknowledgement)

    expect(formatted).toEqual({
      text: `${acknowledgement}\n${question.dialogueFlow!.continuation}\n${question.prompt}`,
      expression: 'thinking',
    })
  })

  it('uses recommendation question ResponsePlan when available', () => {
    const question = getQuestionById('fizz')!
    const plans: readonly ResponsePlan[] = [{
      id: 'test.question.priority',
      speaker: 'karua',
      intent: 'ask_preference',
      state: 'lead-in',
      request: 'recommendation-question',
      blocks: {
        answer: [{ text: 'plan:{lead_in}:{question_label}', expression: 'smirk' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatQuestionDialogueLine(question, null, { plans })).toEqual({
      text: `plan:${question.dialogueFlow!.leadIn}:${question.prompt}`,
      expression: 'smirk',
    })
  })

  it('falls back to legacy question formatting when ResponsePlan is invalid', () => {
    const question = getQuestionById('fizz')!
    const legacy = formatQuestion(question, null)
    const plans = [{
      id: 'test.question.invalid',
      speaker: 'karua',
      intent: 'ask_preference',
      state: 'lead-in',
      request: 'recommendation-question',
      blocks: {
        answer: [{ text: 'plan:{lead_in}:{question_label}', expression: '' }],
      },
      fallbackText: 'fallback',
    }] as unknown as readonly ResponsePlan[]

    expect(formatQuestionDialogueLine(question, null, { plans })).toEqual({
      text: legacy,
      expression: 'thinking',
    })
  })

  it.each([
    { text: 'plan:{continuation}:{question_label}' },
    { text: 'plan:{opening}:{question_label}' },
  ])('falls back safely when question ResponsePlan slot is missing or forbidden', ({ text }) => {
    const question = getQuestionById('fizz')!
    const legacy = formatQuestion(question, null)
    const plans: readonly ResponsePlan[] = [{
      id: `test.question.slot.${text}`,
      speaker: 'karua',
      intent: 'ask_preference',
      state: 'lead-in',
      request: 'recommendation-question',
      blocks: {
        answer: [{ text, expression: 'thinking' }],
      },
      fallbackText: 'fallback',
    }]

    expect(formatQuestionDialogueLine(question, null, { plans })).toEqual({
      text: legacy,
      expression: 'thinking',
    })
  })

  it('does not change question selection while formatting acknowledgement and lead-in', () => {
    const state = createRecommendationState()
    const pool = filterCocktailsByRecommendationState(getAllCocktailData(), state)
    const before = selectNextQuestion(pool, state)

    expect(before).not.toBeNull()
    formatQuestionDialogueLine(before!, null)
    const after = selectNextQuestion(pool, state)

    expect(after?.id).toBe(before?.id)
  })

  it('does not change slot filling while formatting acknowledgement and lead-in', () => {
    const question = getQuestionById('base-spirit')!
    const applied = applyQuestionAnswer(createRecommendationState(), question, question.choices[0].label)
    const snapshot = structuredClone(applied.state)

    formatQuestionDialogueLine(question, applied.acknowledgement)

    expect(applied.state).toEqual(snapshot)
  })

  it('keeps unknown answer behavior while question text uses ResponsePlan', () => {
    const question = getQuestionById('fizz')!
    const unknown = applyQuestionAnswer(createRecommendationState(), question, '잘 모르겠어요')

    formatQuestionDialogueLine(question, unknown.acknowledgement)

    expect(unknown.finishRecommendation).toBe(false)
  })

  it('keeps Karua delegation behavior while question text uses ResponsePlan', () => {
    const question = getQuestionById('fizz')!
    const delegatedChoice = question.choices.find((choice) => choice.finishRecommendation)!
    const delegated = applyQuestionAnswer(createRecommendationState(), question, delegatedChoice.label)

    formatQuestionDialogueLine(question, delegated.acknowledgement)

    expect(delegated.finishRecommendation).toBe(true)
    expect(delegated.state).toEqual(createRecommendationState())
  })
})
