import { describe, expect, it } from 'vitest'
import { getAllCocktailData } from '../cocktails/index.js'
import {
  addQuestionHistory,
  answerLatestQuestion,
  applyRecommendationSignals,
  buildRecommendationReasons,
  createRecommendationDecision,
  createRecommendationState,
  evaluateRecommendationCandidate,
  extractRecommendationSignals,
  filterCocktailsByRecommendationState,
  getQuestionCandidatePool,
  inferRecommendationDialogueContext,
  resolveCocktailsByRecommendationState,
  selectRecommendationCandidate,
} from './state.js'

describe('recommendation state', () => {
  it('extracts structured mood, situation, taste and alcohol signals', () => {
    const signals = extractRecommendationSignals('퇴근했는데 피곤해. 달달하고 도수 낮은 걸로 추천해줘')
    const state = applyRecommendationSignals(createRecommendationState(), signals)

    expect(state.moods).toContain('tired')
    expect(state.situations).toContain('after-work')
    expect(state.taste.sweetness).toBe(0.8)
    expect(state.alcoholPreference).toBe('low')
    expect(state.extractedPreferences).toEqual(state.signals)
  })

  it.each([
    ['탄산은 별로지만 사이다는 좋아해', 'taste.fizz', 0.1],
    ['오늘은 독한 게 당겨', 'alcoholPreference', 'high'],
  ])('reflects conversational preference %s in recommendation state', (input, field, value) => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals(input),
    )

    expect(state.extractedPreferences).toContainEqual(expect.objectContaining({ field, value }))
  })

  it('filters excluded ingredients and returns evidence-based reasons', () => {
    const [mojito] = getAllCocktailData().filter((cocktail) => cocktail.name === '모히토')
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'taste.fizz', value: 0.8, confidence: 1, source: 'question' },
      { field: 'excludedIngredients', value: '민트', confidence: 1, source: 'question' },
    ])

    expect(filterCocktailsByRecommendationState([mojito], state)).toEqual([])
    expect(buildRecommendationReasons(mojito, state)[0]).toMatchObject({
      code: 'taste-match',
      label: '취향 일치',
    })
  })

  it('filters excluded ingredients against base spirit as well as ingredient text', () => {
    const ginOnlyBase = {
      ...getAllCocktailData()[0],
      id: 'test-gin-base-only',
      name: '테스트 진 베이스',
      base_spirit: '진',
      ingredients: ['드라이 베르무트'],
    }
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'excludedIngredients', value: '진', confidence: 1, source: 'rule' },
    ])

    expect(filterCocktailsByRecommendationState([ginOnlyBase], state)).toEqual([])
  })

  it('extracts excluded ingredients in natural Korean word order', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('민트 없이 상큼한 걸로 추천해줘'),
    )

    expect(state.excludedIngredients).toEqual(['민트'])
  })

  it('extracts lime juice from natural ingredient requests', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('심플하게 기주에 라임즙만 들어간걸로 주세요'),
    )

    expect(state.preferredIngredients).toContain('라임 주스')
    expect(state.taste.sourness).toBe(0.8)
  })

  it('matches preferred ingredients against recipe ingredient text', () => {
    const cocktails = getAllCocktailData()
    const daiquiri = cocktails.find((cocktail) => cocktail.name_en === 'Daiquiri')
    const caipirinha = cocktails.find((cocktail) => cocktail.name_en === 'Caipirinha')
    expect(daiquiri).toBeTruthy()
    expect(caipirinha).toBeTruthy()

    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'preferredIngredients', value: '라임 주스', confidence: 1, source: 'rule' },
    ])

    expect(filterCocktailsByRecommendationState([daiquiri!], state)).toEqual([daiquiri])
    expect(filterCocktailsByRecommendationState([caipirinha!], state)).toEqual([])
  })

  it('keeps hard constraints when recovering from an empty exact match', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'preferredIngredients', value: '진', confidence: 1, source: 'question' },
      { field: 'taste.sweetness', value: 0.8, confidence: 1, source: 'question' },
      { field: 'taste.sourness', value: 0.2, confidence: 1, source: 'question' },
      { field: 'taste.fizz', value: 0.1, confidence: 1, source: 'question' },
      { field: 'alcoholPreference', value: 'low', confidence: 1, source: 'question' },
    ])
    const resolved = resolveCocktailsByRecommendationState(getAllCocktailData(), state)

    expect(resolved.exactMatch).toBe(false)
    expect(resolved.cocktails.length).toBeGreaterThan(0)
    expect(resolved.cocktails.every((cocktail) => cocktail.base_spirit === '진')).toBe(true)
  })

  it('keeps a broader hard-constraint pool for follow-up questions after an exact miss', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'preferredIngredients', value: '진', confidence: 1, source: 'question' },
      { field: 'taste.sweetness', value: 0.9, confidence: 1, source: 'question' },
      { field: 'taste.sourness', value: 0.0, confidence: 1, source: 'question' },
      { field: 'taste.fizz', value: 0.9, confidence: 1, source: 'question' },
    ])
    const cocktails = getAllCocktailData()
    const questionCandidates = getQuestionCandidatePool(cocktails, state)
    const nearest = resolveCocktailsByRecommendationState(cocktails, state)

    expect(questionCandidates.exactMatch).toBe(false)
    expect(questionCandidates.cocktails.length).toBeGreaterThan(nearest.cocktails.length)
    expect(questionCandidates.cocktails.every((cocktail) =>
      cocktail.base_spirit === '진' || cocktail.ingredients.includes('진'),
    )).toBe(true)
  })

  it('infers dialogue context from mood-based recommendation input', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('퇴근했는데 피곤해서 마실 걸 추천해줘'),
    )
    const dialogue = inferRecommendationDialogueContext(state)

    expect(dialogue.route).toBe('moodOrder')
    expect(dialogue.routeTags).toEqual(expect.arrayContaining(['mood', 'situation']))
    expect(dialogue.dialogueState).toBe('recommending')
    expect(dialogue.affectState).toBe('tired')
  })

  it('keeps ingredient/base orders separate from generic taste preference orders', () => {
    const ingredientState = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('진 베이스로 추천해줘'),
    )
    const tasteState = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('상큼하고 탄산 있는 걸 추천해줘'),
    )

    expect(inferRecommendationDialogueContext(ingredientState).route).toBe('ingredientOrBaseOrder')
    expect(inferRecommendationDialogueContext(tasteState).route).toBe('tastePreferenceOrder')
  })

  it('treats excluded ingredient requests as ingredient/base dialogue context', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'excludedIngredients', value: '민트', confidence: 1, source: 'question' },
    ])
    const dialogue = inferRecommendationDialogueContext(state)

    expect(dialogue.route).toBe('ingredientOrBaseOrder')
    expect(dialogue.routeTags).toContain('excluded-ingredient')
  })

  it('allows direct and random route overrides for non-inference paths', () => {
    const direct = inferRecommendationDialogueContext(createRecommendationState(), {
      route: 'directCocktailOrder',
      routeTags: ['direct-name'],
    })
    const random = inferRecommendationDialogueContext(createRecommendationState(), {
      route: 'randomPick',
      routeTags: ['random'],
    })

    expect(direct).toMatchObject({
      route: 'directCocktailOrder',
      dialogueState: 'serving',
      affectState: 'confident',
    })
    expect(random).toMatchObject({
      route: 'randomPick',
      affectState: 'playful',
    })
  })

  it('extracts alcohol preference signals for high, medium and low', () => {
    const high = extractRecommendationSignals('독한 술로 추천해줘')
    const medium = extractRecommendationSignals('적당한 도수로 골라줘')
    const low = extractRecommendationSignals('도수 낮은 걸로')

    expect(high).toContainEqual(
      expect.objectContaining({ field: 'alcoholPreference', value: 'high' }),
    )
    expect(medium).toContainEqual(
      expect.objectContaining({ field: 'alcoholPreference', value: 'medium' }),
    )
    expect(low).toContainEqual(
      expect.objectContaining({ field: 'alcoholPreference', value: 'low' }),
    )
  })

  it('returns empty signals when no patterns match', () => {
    const signals = extractRecommendationSignals('안녕하세요. 오늘 날씨 좋네요.')

    expect(signals).toEqual([])
  })

  it('filters cocktails by low alcohol preference', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'alcoholPreference', value: 'low', confidence: 1, source: 'rule', evidence: '' },
    ])
    const filtered = filterCocktailsByRecommendationState(getAllCocktailData(), state)

    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((c) => c.features.alcohol_strength <= 0.4)).toBe(true)
  })

  it('builds multiple reason types when state has compound signals', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'taste.sweetness', value: 0.8, confidence: 1, source: 'rule', evidence: '' },
      { field: 'alcoholPreference', value: 'low', confidence: 1, source: 'rule', evidence: '' },
      { field: 'moods', value: 'tired', confidence: 1, source: 'rule', evidence: '' },
      { field: 'preferredIngredients', value: '진', confidence: 1, source: 'rule', evidence: '' },
    ])
    const martini = getAllCocktailData().find((c) => c.name === '마티니')!
    const reasons = buildRecommendationReasons(martini, state)
    const codes = reasons.map((r) => r.code)

    expect(codes).toContain('taste-match')
    expect(codes).toContain('strength-match')
    expect(codes).toContain('ingredient-match')
    expect(codes).toContain('context')
  })

  it('derives recommendation reasons from the selected candidate contributions', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'taste.sweetness', value: 0.8, confidence: 1, source: 'rule' },
      { field: 'alcoholPreference', value: 'high', confidence: 1, source: 'rule' },
      { field: 'moods', value: 'excited', confidence: 1, source: 'rule' },
    ])
    const selection = selectRecommendationCandidate(getAllCocktailData(), state)
    expect(selection.selected).not.toBeNull()
    const decision = createRecommendationDecision(
      selection.selected!.candidate,
      state,
      undefined,
      selection.selected!,
    )

    expect(decision.reasons).toEqual(
      decision.evaluation.contributions.flatMap(({ reason }) => reason ? [reason] : []),
    )
    expect(decision.reasons.every((reason) => (
      decision.evaluation.contributions.some((contribution) => (
        contribution.code === reason.code && contribution.evidence === reason.evidence
      ))
    ))).toBe(true)
    expect(decision.evaluation.score).toBe(decision.evaluation.contributions.reduce(
      (total, contribution) => total + contribution.score,
      0,
    ))
  })

  it('reports hard constraints on ineligible recommendation candidates', () => {
    const cocktail = getAllCocktailData().find(({ ingredients }) => (
      ingredients.some((ingredient) => ingredient.includes('민트'))
    ))!
    const state = applyRecommendationSignals(createRecommendationState(), [{
      field: 'excludedIngredients', value: '민트', confidence: 1, source: 'rule',
    }])
    const evaluation = evaluateRecommendationCandidate(cocktail, state)

    expect(evaluation.eligible).toBe(false)
    expect(evaluation.hardConstraints).toContain('excluded-ingredient:민트')
  })

  it('filters cocktails by high alcohol preference', () => {
    const state = applyRecommendationSignals(createRecommendationState(), [
      { field: 'alcoholPreference', value: 'high', confidence: 1, source: 'rule', evidence: '' },
    ])
    const filtered = filterCocktailsByRecommendationState(getAllCocktailData(), state)

    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((c) => c.features.alcohol_strength >= 0.6)).toBe(true)
  })

  it('records the answer on the latest question history entry', () => {
    let state = addQuestionHistory(createRecommendationState(), { topic: 'flavor' })
    state = answerLatestQuestion(state, '달콤하게')

    expect(state.questionHistory[0].answer).toBe('달콤하게')
  })
})
