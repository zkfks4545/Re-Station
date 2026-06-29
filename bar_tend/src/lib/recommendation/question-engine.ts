import questionsJson from '../../data/recommendation-questions.json'
import type { CocktailData } from '../../types.js'
import type { FeatureKey, TastePreference } from '../../types/cocktail-db.js'
import type {
  RecommendationQuestion,
  RecommendationQuestionChoice,
  RecommendationState,
} from '../../types/recommendation.js'
import { getAllCocktailData, scoreCocktailMatch } from '../cocktails/cocktail-db.js'
import { kf } from '../dialogue/pattern-utils.js'
import { renderTextPreset } from '../dialogue/text-presets.js'
import {
  applyRecommendationSignals,
  extractRecommendationSignals,
  filterCocktailsByRecommendationState,
  isBaseSpiritPreference,
} from './state.js'

const NUDGE = 0.2
const QUESTION_UX_BONUS: Record<string, number> = {
  flavor: 150,
}
export const MAX_RECOMMENDATION_QUESTIONS = 3
export const RECOMMENDATION_QUESTIONS = questionsJson as RecommendationQuestion[]

export function isRecommendationIntent(text: string): boolean {
  if (kf(['추천', '골라', '마실', '칵테일', '한잔', '뭐 마실', '메뉴', '적당한', '다른\\s*(걸|거|술|칵테일)', '또.*추천', '별로', '다시\\s*(찾|추천)']).test(text)) return true
  if (kf(['달콤', '달달', '달다', '씁쓸', '쓰다', '비터', '드라이', '상쾌', '시원', '청량', 'fresh', '시트러스', '탄산', '스파이시']).test(text)) return true
  if (kf(['과일', '주스', '쥬스', '베리', '플로럴', '스모키', '허브', '커피', '크리미', '진저', '향']).test(text)) return true
  if (kf(['세게', '센\\s*(거|것|걸|술)?', '쎈', '약하게', '가볍', '도수', '취하', 'strong', '강한', '독한', '순한']).test(text)) return true
  if (kf(['신맛', '상큼', '새콤', 'sour', '레몬', '라임', '산뜻']).test(text)) return true
  if (kf(['부탁', '주세요', '할게요', '해줘', '해주세요', '좋겠']).test(text)) return true
  return false
}

export function ingestTasteSignals(text: string, current: TastePreference): TastePreference {
  const hints: Record<FeatureKey, { up: RegExp[]; down: RegExp[] }> = {
    sweetness: {
      up: [/달콤|달아|sweet|syrup|시럽|달게|달짝|달달|달다|디저트|단맛|주스|쥬스|juice/i],
      down: [/안\s*달|드라이|dry|씁쓸|쓰다|bitter|쌉쌀/i],
    },
    alcohol_strength: {
      up: [/세게|센\s*(거|것|걸|술)?|쎄|강하|도수|취하|strong|stiff|독하|진하|하이볼|쎈/i],
      down: [/약하|가볍|light|soft|논알|순하|약한|주스|쥬스|juice/i],
    },
    fizz: {
      up: [/탄산|톡\s*쏘|스파클|fizz|soda|청량|스파클링|거품|기포|상쾌/i],
      down: [/탄산\s*없|스틸|still|부드럽/i],
    },
    sourness: {
      up: [/신맛|상큼|새콤|sour|lime|레몬|시트러스|라임|산뜻|주스|쥬스|juice/i],
      down: [/안\s*신|무난/i],
    },
  }

  const next: TastePreference = { ...current }
  for (const key of Object.keys(hints) as FeatureKey[]) {
    const { up, down } = hints[key]
    const base = next[key] ?? 0.5
    if (up.some((pattern) => pattern.test(text))) next[key] = clamp01(base + NUDGE)
    if (down.some((pattern) => pattern.test(text))) next[key] = clamp01(base - NUDGE)
  }
  return next
}

export function initCandidatePool(): CocktailData[] {
  return getAllCocktailData()
}

export function createRecommendationSourcePool(
  excludedCocktailIds: string[],
): { cocktails: CocktailData[]; exhausted: boolean } {
  const allCocktails = initCandidatePool()
  const excluded = new Set(excludedCocktailIds)
  const cocktails = allCocktails.filter((cocktail) => !excluded.has(cocktail.id))

  return {
    cocktails,
    exhausted: cocktails.length === 0 && excluded.size > 0,
  }
}

export function getQuestionById(id: string | null): RecommendationQuestion | null {
  return RECOMMENDATION_QUESTIONS.find((question) => question.id === id) ?? null
}

export function applyQuestionAnswer(
  state: RecommendationState,
  question: RecommendationQuestion,
  answer: string,
): { state: RecommendationState; acknowledgement: string | null; finishRecommendation: boolean } {
  const choice = findChoice(question, answer)
  if (choice) {
    return {
      state: applyRecommendationSignals(state, choice.signals),
      acknowledgement: renderTextPreset(choice.acknowledgementPreset, choice.acknowledgement),
      finishRecommendation: choice.finishRecommendation === true,
    }
  }

  return {
    state: applyRecommendationSignals(state, extractRecommendationSignals(answer)),
    acknowledgement: answer.trim() ? '네, 말씀해 주신 내용도 함께 볼게요.' : null,
    finishRecommendation: false,
  }
}

export function selectNextQuestion(
  pool: CocktailData[],
  state: RecommendationState,
): RecommendationQuestion | null {
  if (pool.length <= 1 || state.questionHistory.length >= MAX_RECOMMENDATION_QUESTIONS) return null

  const askedTopics = new Set(state.questionHistory.map((entry) => entry.topic))
  const knownTopics = getKnownTopics(state)
  const available = RECOMMENDATION_QUESTIONS.filter(
    (question) => !askedTopics.has(question.topic) && !knownTopics.has(question.topic),
  )

  return available
    .map((question) => ({ question, score: scoreQuestion(question, pool, state) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id))[0]
    ?.question ?? null
}

export function isRecommendationDecisive(
  pool: CocktailData[],
): boolean {
  return pool.length <= 1
}

export function formatQuestion(
  question: RecommendationQuestion,
  acknowledgement?: string | null,
): string {
  const leadIn = acknowledgement
    ? renderTextPreset(
      question.dialogueFlow?.continuationPreset,
      question.dialogueFlow?.continuation,
    )
    : renderTextPreset(
      question.dialogueFlow?.leadInPreset,
      question.dialogueFlow?.leadIn,
    )
  const context = acknowledgement
    ? `${acknowledgement}${leadIn ? `\n${leadIn}` : ''}\n`
    : `${leadIn ?? '한 가지만 더 여쭤볼게요.'}\n`
  return `${context}${renderTextPreset(question.promptPreset, question.prompt)}`
}

function findChoice(
  question: RecommendationQuestion,
  answer: string,
): RecommendationQuestionChoice | null {
  const trimmed = answer.trim()
  const numeric = Number.parseInt(trimmed, 10)
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= question.choices.length) {
    return question.choices[numeric - 1]
  }

  const normalized = normalize(trimmed)
  if (isDelegationAlias(normalized)) {
    return question.choices.find((choice) => choice.finishRecommendation === true) ?? null
  }

  return question.choices.find((choice) => {
    const label = normalize(choice.label)
    return normalized === label || normalized.includes(label)
  }) ?? null
}

function isDelegationAlias(normalized: string): boolean {
  return normalized.includes('아무거나')
    && !/아무거나(?:말고|는싫|말고는)/.test(normalized)
}

function getKnownTopics(state: RecommendationState): Set<string> {
  const topics = new Set<string>()
  if (state.taste.sweetness !== undefined || state.taste.sourness !== undefined) topics.add('flavor')
  if (state.taste.fizz !== undefined) topics.add('fizz')
  if (state.taste.alcohol_strength !== undefined || state.alcoholPreference !== 'any') topics.add('alcohol')
  if (state.preferredIngredients.some(isBaseSpiritPreference)) topics.add('base')
  return topics
}

function scoreQuestion(
  question: RecommendationQuestion,
  pool: CocktailData[],
  state: RecommendationState,
): number {
  const groupSizes = question.choices
    .filter((choice) => choice.signals.length > 0)
    .map((choice) => {
      const choiceState = applyRecommendationSignals(state, choice.signals)
      return filterCocktailsByRecommendationState(pool, choiceState).length
    })
    .filter((size) => size > 0 && size < pool.length)

  if (groupSizes.length < 2) return 0
  const largestGroup = Math.max(...groupSizes)
  return groupSizes.length * 100
    + (pool.length - largestGroup)
    + (QUESTION_UX_BONUS[question.topic] ?? 0)
}

export function pickFromPool(pool: CocktailData[], preference: TastePreference): CocktailData | null {
  if (pool.length === 0) return null
  if (pool.length === 1) return pool[0]

  const expressed: TastePreference = {}
  const weights: Partial<Record<FeatureKey, number>> = {}
  const defaults: Record<FeatureKey, number> = {
    sweetness: 0.5, alcohol_strength: 0.5, fizz: 0.35, sourness: 0.45,
  }

  for (const key of Object.keys(defaults) as FeatureKey[]) {
    const value = preference[key]
    if (value !== undefined && Math.abs(value - defaults[key]) > 0.01) {
      expressed[key] = value
      weights[key] = 2
    }
  }

  return [...pool].sort((a, b) => {
    const scoreDelta = scoreCocktailMatch(a, expressed, weights) -
      scoreCocktailMatch(b, expressed, weights)
    if (Math.abs(scoreDelta) > 0.0001) return scoreDelta

    const ingredientCountDelta = a.ingredients.length - b.ingredients.length
    if (ingredientCountDelta !== 0) return ingredientCountDelta

    return a.name.localeCompare(b.name)
  })[0] ?? pool[0]
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '')
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
