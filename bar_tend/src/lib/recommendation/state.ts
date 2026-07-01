import type { CocktailData } from '../../types.js'
import type { FeatureKey, TastePreference } from '../../types/cocktail-db.js'
import type {
  AffectState,
  AlcoholPreference,
  DialogueState,
  QuestionHistoryEntry,
  RecommendationDecision,
  RecommendationDialogueContext,
  RecommendationMood,
  RecommendationReason,
  RecommendationRoute,
  RecommendationRouteTag,
  RecommendationSignal,
  RecommendationSituation,
  RecommendationState,
} from '../../types/recommendation.js'

const FEATURE_DEFAULTS: Record<FeatureKey, number> = {
  sweetness: 0.5,
  alcohol_strength: 0.5,
  fizz: 0.35,
  sourness: 0.45,
}

const FEATURE_LABELS: Record<FeatureKey, string> = {
  sweetness: '단맛',
  alcohol_strength: '도수감',
  fizz: '탄산감',
  sourness: '산미',
}

const FEATURE_FILTER_TOLERANCE = 0.35

const MOOD_PATTERNS: Array<[RecommendationMood, RegExp]> = [
  ['depressed', /우울|기분.*별로|침울/],
  ['tired', /피곤|지쳤|지침|퇴근/],
  ['lonely', /외롭|쓸쓸/],
  ['excited', /들뜬|신나|설레/],
  ['angry', /화나|짜증|분노/],
  ['empty', /공허|허무/],
  ['celebratory', /축하|기념|합격|성공/],
  ['heartbroken', /실연|헤어졌|이별/],
  ['anxious', /불안|초조|걱정/],
  ['bored', /심심|무료|지루/],
]

const SITUATION_PATTERNS: Array<[RecommendationSituation, RegExp]> = [
  ['after-work', /퇴근|야근|회사/],
  ['breakup', /실연|헤어졌|이별/],
  ['celebration', /축하|기념|합격|성공/],
  ['sleepless', /잠이?\s*안|불면/],
  ['rough-day', /망한 것 같|힘든 하루|오늘.*힘들/],
  ['casual-drink', /아무 생각 없이|가볍게 한잔/],
  ['first-visit', /처음 왔|첫 방문/],
  ['returning-guest', /또 왔|다시 왔|단골/],
]

const TASTE_PATTERNS: Array<[FeatureKey, number, RegExp]> = [
  ['sweetness', 0.8, /달콤|달달|단맛|디저트|주스|쥬스|juice/i],
  ['sweetness', 0.2, /안\s*달|드라이|쌉쌀|씁쓸|쓴맛/],
  ['sourness', 0.55, /주스|쥬스|juice/i],
  ['sourness', 0.8, /상큼|새콤|신맛|시트러스|레몬|라임/],
  ['sourness', 0.2, /안\s*신|산미\s*없/],
  ['fizz', 0.8, /탄산|청량|스파클|톡\s*쏘/],
  ['fizz', 0.1, /탄산(?:은|이)?\s*(?:없|빼|말고|싫)|무탄산|부드럽|스틸/],
  ['alcohol_strength', 0.8, /도수.*높|독한|강한|세게|센\s*(거|것|걸|술)?|쎈/],
  ['alcohol_strength', 0.2, /도수.*낮|약한|약하게|순한|순하게|가볍게|주스|쥬스|juice/i],
]

const ALCOHOL_PATTERNS: Array<[AlcoholPreference, RegExp]> = [
  ['low', /도수.*낮|약한 술|약하게|순한 술|순하게|가볍게/],
  ['medium', /도수.*적당|적당한 도수|적당하게/],
  ['high', /도수.*높|독한 술|독한\s*(거|것|걸)?|강한 술|강하게|센\s*(거|것|걸|술)?|쎈\s*(거|것|걸|술)?/],
]

const BASE_SPIRIT_PATTERNS = ['진', '럼', '위스키', '데킬라', '보드카', '브랜디', '리큐르', '카샤사'] as const

const INGREDIENT_PATTERNS = [
  ...BASE_SPIRIT_PATTERNS,
  '라임 주스',
  '라임즙',
  '라임',
  '레몬 주스',
  '레몬즙',
  '레몬',
  '민트',
  '소다수',
  '진저 비어',
  '크랜베리 주스',
  '자몽',
] as const

export function createRecommendationState(): RecommendationState {
  return {
    taste: {},
    moods: [],
    situations: [],
    alcoholPreference: 'any',
    preferredIngredients: [],
    excludedIngredients: [],
    questionHistory: [],
    signals: [],
  }
}

export function extractRecommendationSignals(text: string): RecommendationSignal[] {
  const signals: RecommendationSignal[] = []

  for (const [mood, pattern] of MOOD_PATTERNS) {
    if (pattern.test(text)) signals.push(createSignal('moods', mood, text))
  }
  for (const [situation, pattern] of SITUATION_PATTERNS) {
    if (pattern.test(text)) signals.push(createSignal('situations', situation, text))
  }
  for (const [feature, value, pattern] of TASTE_PATTERNS) {
    if (pattern.test(text)) signals.push(createSignal(`taste.${feature}`, value, text))
  }
  for (const [preference, pattern] of ALCOHOL_PATTERNS) {
    if (pattern.test(text)) signals.push(createSignal('alcoholPreference', preference, text))
  }
  for (const ingredient of INGREDIENT_PATTERNS) {
    if (new RegExp(`(?:${ingredient}).*(?:베이스|추천|좋아|원해|넣|들어간|들어 있는|주세요|줘|한잔)|(?:베이스|추천|넣|들어간).*(?:${ingredient})`).test(text)) {
      const preferredIngredient = normalizePreferredIngredient(ingredient)
      if (isLessSpecificCitrusSignal(preferredIngredient, text)) continue
      signals.push(createSignal('preferredIngredients', preferredIngredient, text))
    }
  }

  const excluded =
    text.match(/([가-힣A-Za-z]+)\s*(?:빼고|제외|없이)/)
    ?? text.match(/(?:빼고|제외하고?)\s*([가-힣A-Za-z]+)/)
  if (excluded?.[1]) {
    signals.push(createSignal('excludedIngredients', excluded[1], text))
  }

  return signals
}

function createSignal(
  field: RecommendationSignal['field'],
  value: RecommendationSignal['value'],
  evidence: string,
): RecommendationSignal {
  return { field, value, confidence: 0.8, source: 'rule', evidence }
}

export function applyRecommendationSignals(
  state: RecommendationState,
  signals: RecommendationSignal[],
): RecommendationState {
  const next: RecommendationState = {
    ...state,
    taste: { ...state.taste },
    moods: [...state.moods],
    situations: [...state.situations],
    preferredIngredients: [...state.preferredIngredients],
    excludedIngredients: [...state.excludedIngredients],
    questionHistory: [...state.questionHistory],
    signals: [...state.signals],
  }

  for (const signal of signals) {
    if (signal.confidence < 0.5) continue
    if (signal.field.startsWith('taste.') && typeof signal.value === 'number') {
      const feature = signal.field.slice(6) as FeatureKey
      next.taste[feature] = clamp01(signal.value)
    } else if (signal.field === 'moods') {
      addUnique(next.moods, signal.value as RecommendationMood)
    } else if (signal.field === 'situations') {
      addUnique(next.situations, signal.value as RecommendationSituation)
    } else if (signal.field === 'alcoholPreference') {
      next.alcoholPreference = signal.value as AlcoholPreference
    } else if (signal.field === 'preferredIngredients') {
      addUnique(next.preferredIngredients, String(signal.value))
    } else if (signal.field === 'excludedIngredients') {
      addUnique(next.excludedIngredients, String(signal.value))
    }
    next.signals.push(signal)
  }

  return next
}

export function addQuestionHistory(
  state: RecommendationState,
  entry: QuestionHistoryEntry,
): RecommendationState {
  return { ...state, questionHistory: [...state.questionHistory, entry] }
}

export function answerLatestQuestion(
  state: RecommendationState,
  answer: string,
): RecommendationState {
  const questionHistory = [...state.questionHistory]
  const latest = questionHistory[questionHistory.length - 1]
  if (latest && latest.answer === undefined) {
    questionHistory[questionHistory.length - 1] = { ...latest, answer }
  }
  return { ...state, questionHistory }
}

export function filterCocktailsByRecommendationState(
  pool: CocktailData[],
  state: RecommendationState,
): CocktailData[] {
  return pool.filter((cocktail) => {
    for (const feature of Object.keys(state.taste) as FeatureKey[]) {
      const target = state.taste[feature]
      if (
        target !== undefined
        && Math.abs(cocktail.features[feature] - target) > FEATURE_FILTER_TOLERANCE
      ) return false
    }

    if (state.alcoholPreference === 'low' && cocktail.features.alcohol_strength > 0.4) return false
    if (state.alcoholPreference === 'medium' && (
      cocktail.features.alcohol_strength < 0.3 || cocktail.features.alcohol_strength > 0.7
    )) return false
    if (state.alcoholPreference === 'high' && cocktail.features.alcohol_strength < 0.6) return false

    const ingredients = cocktail.ingredients.map(normalize)
    const normalizedBase = normalize(cocktail.base_spirit ?? '')
    if (state.preferredIngredients.length > 0 && !state.preferredIngredients.some((preferred) => {
      return matchesPreferredIngredient(normalizedBase, ingredients, preferred)
    })) return false

    return !state.excludedIngredients.some((excluded) => {
      const normalizedExcluded = normalize(excluded)
      return normalizedBase.includes(normalizedExcluded)
        || ingredients.some((ingredient) => ingredient.includes(normalizedExcluded))
    })
  })
}

export function resolveCocktailsByRecommendationState(
  pool: CocktailData[],
  state: RecommendationState,
): { cocktails: CocktailData[]; exactMatch: boolean } {
  const exactMatches = filterCocktailsByRecommendationState(pool, state)
  if (exactMatches.length > 0) return { cocktails: exactMatches, exactMatch: true }

  const eligible = pool.filter((cocktail) => matchesHardConstraints(cocktail, state))
  if (eligible.length === 0) return { cocktails: [], exactMatch: false }

  const scored = eligible.map((cocktail) => ({
    cocktail,
    score: recommendationDistance(cocktail, state),
  }))
  const bestScore = Math.min(...scored.map(({ score }) => score))

  return {
    cocktails: scored
      .filter(({ score }) => Math.abs(score - bestScore) < 0.0001)
      .map(({ cocktail }) => cocktail),
    exactMatch: false,
  }
}

export function getQuestionCandidatePool(
  pool: CocktailData[],
  state: RecommendationState,
): { cocktails: CocktailData[]; exactMatch: boolean } {
  const exactMatches = filterCocktailsByRecommendationState(pool, state)
  if (exactMatches.length > 0) return { cocktails: exactMatches, exactMatch: true }

  return {
    cocktails: pool.filter((cocktail) => matchesHardConstraints(cocktail, state)),
    exactMatch: false,
  }
}

export function createRecommendationDecision(
  cocktail: CocktailData,
  state: RecommendationState,
  dialogue: RecommendationDialogueContext = inferRecommendationDialogueContext(state),
): RecommendationDecision {
  return {
    cocktail,
    state,
    reasons: buildRecommendationReasons(cocktail, state),
    dialogue,
  }
}

export function inferRecommendationDialogueContext(
  state: RecommendationState,
  overrides: Partial<RecommendationDialogueContext> = {},
): RecommendationDialogueContext {
  const routeTags = overrides.routeTags ?? inferRouteTags(state)
  const route = overrides.route ?? inferRoute(state, routeTags)

  return {
    route,
    routeTags,
    dialogueState: overrides.dialogueState ?? inferDialogueState(route),
    affectState: overrides.affectState ?? inferAffectState(state, route),
  }
}

function inferRoute(state: RecommendationState, routeTags: RecommendationRouteTag[]): RecommendationRoute {
  if (routeTags.includes('random')) return 'randomPick'
  if (routeTags.includes('direct-name')) return 'directCocktailOrder'
  if (routeTags.includes('ingredient') || routeTags.includes('excluded-ingredient')) {
    return 'ingredientOrBaseOrder'
  }
  if (routeTags.includes('mood') || routeTags.includes('situation')) return 'moodOrder'
  if (routeTags.includes('taste') || routeTags.includes('strength')) return 'tastePreferenceOrder'
  if (state.questionHistory.length > 0) return 'recommendationInference'
  return 'recommendationInference'
}

function inferRouteTags(state: RecommendationState): RecommendationRouteTag[] {
  const tags: RecommendationRouteTag[] = []

  if (state.moods.length > 0) tags.push('mood')
  if (state.situations.length > 0) tags.push('situation')
  if (Object.keys(state.taste).length > 0) tags.push('taste')
  if (state.alcoholPreference !== 'any') tags.push('strength')
  if (state.preferredIngredients.length > 0) tags.push('ingredient')
  if (state.excludedIngredients.length > 0) tags.push('excluded-ingredient')
  if (state.questionHistory.some((entry) => entry.answer !== undefined)) tags.push('question-answer')
  if (state.questionHistory.some((entry) => entry.answer?.includes('아무거나'))) tags.push('delegated')

  return unique(tags)
}

function inferDialogueState(route: RecommendationRoute): DialogueState {
  if (route === 'directCocktailOrder') return 'serving'
  return 'recommending'
}

function inferAffectState(state: RecommendationState, route: RecommendationRoute): AffectState {
  if (state.moods.some((mood) => ['depressed', 'lonely', 'heartbroken', 'anxious'].includes(mood))) {
    return 'concerned'
  }
  if (state.moods.includes('tired') || state.situations.includes('after-work')) return 'tired'
  if (state.moods.includes('angry')) return 'awkward'
  if (state.moods.includes('excited') || state.moods.includes('celebratory')) return 'playful'
  if (route === 'directCocktailOrder') return 'confident'
  if (route === 'randomPick') return 'playful'
  if (route === 'recommendationInference') return 'curious'
  return 'warm'
}

export function buildRecommendationReasons(
  cocktail: CocktailData,
  state: RecommendationState,
): RecommendationReason[] {
  const reasons: RecommendationReason[] = []
  const tasteMatches = (Object.keys(state.taste) as FeatureKey[])
    .filter((key) => state.taste[key] !== undefined)
    .sort((a, b) => featureDelta(cocktail, state.taste, a) - featureDelta(cocktail, state.taste, b))
    .slice(0, 2)

  if (tasteMatches.length > 0) {
    reasons.push({
      code: 'taste-match',
      label: '취향 일치',
      detail: `${tasteMatches.map((key) => FEATURE_LABELS[key]).join('·')} 취향과 잘 맞아요.`,
      evidence: tasteMatches.map((key) => `${key}:${cocktail.features[key]}`),
    })
  }

  if (state.alcoholPreference !== 'any') {
    reasons.push({
      code: 'strength-match',
      label: '도수 조건',
      detail: `원하신 도수 조건(${state.alcoholPreference})과 잘 맞아요.`,
      evidence: [`alcohol_strength:${cocktail.features.alcohol_strength}`],
    })
  }

  const ingredientMatches = state.preferredIngredients.filter((preferred) =>
    matchesPreferredIngredient(
      normalize(cocktail.base_spirit ?? ''),
      cocktail.ingredients.map(normalize),
      preferred,
    ),
  )
  if (ingredientMatches.length > 0) {
    reasons.push({
      code: 'ingredient-match',
      label: '선호 재료',
      detail: `좋아하신다고 한 ${ingredientMatches.join(', ')}도 들어 있어요.`,
      evidence: ingredientMatches,
    })
  }

  if (state.moods.length > 0 || state.situations.length > 0) {
    reasons.push({
      code: 'context',
      label: '대화 맥락',
      detail: '말씀해 주신 기분과 상황도 함께 참고했어요.',
      evidence: [...state.moods, ...state.situations],
    })
  }

  return reasons
}

function matchesHardConstraints(cocktail: CocktailData, state: RecommendationState): boolean {
  const ingredients = cocktail.ingredients.map(normalize)
  const normalizedBase = normalize(cocktail.base_spirit ?? '')
  if (state.preferredIngredients.length > 0 && !state.preferredIngredients.some((preferred) => {
    return matchesPreferredIngredient(normalizedBase, ingredients, preferred)
  })) return false

  return !state.excludedIngredients.some((excluded) => {
    const normalizedExcluded = normalize(excluded)
    return normalizedBase.includes(normalizedExcluded)
      || ingredients.some((ingredient) => ingredient.includes(normalizedExcluded))
  })
}

function recommendationDistance(cocktail: CocktailData, state: RecommendationState): number {
  let distance = (Object.keys(state.taste) as FeatureKey[]).reduce(
    (total, key) => total + Math.abs(cocktail.features[key] - (state.taste[key] ?? 0)),
    0,
  )

  const alcoholTarget: Partial<Record<AlcoholPreference, number>> = {
    low: 0.25,
    medium: 0.5,
    high: 0.8,
  }
  const target = alcoholTarget[state.alcoholPreference]
  if (target !== undefined) {
    distance += Math.abs(cocktail.features.alcohol_strength - target)
  }

  return distance
}

function featureDelta(cocktail: CocktailData, taste: TastePreference, key: FeatureKey): number {
  return Math.abs(cocktail.features[key] - (taste[key] ?? FEATURE_DEFAULTS[key]))
}

function addUnique<T>(items: T[], item: T): void {
  if (!items.includes(item)) items.push(item)
}

export function isBaseSpiritPreference(preferred: string): boolean {
  const normalizedPreferred = normalize(preferred)
  return BASE_SPIRIT_PATTERNS.some((base) => normalize(base) === normalizedPreferred)
}

function matchesPreferredIngredient(
  normalizedBase: string,
  normalizedIngredients: string[],
  preferred: string,
): boolean {
  const normalizedPreferred = normalize(preferred)
  if (isBaseSpiritPreference(preferred)) {
    return normalizedBase === normalizedPreferred
      || normalizedIngredients.some((ingredient) => ingredient === normalizedPreferred)
  }

  return normalizedBase === normalizedPreferred
    || normalizedIngredients.some((ingredient) => ingredient.includes(normalizedPreferred))
}

function normalizePreferredIngredient(ingredient: string): string {
  if (ingredient === '라임즙') return '라임 주스'
  if (ingredient === '레몬즙') return '레몬 주스'
  return ingredient
}

function isLessSpecificCitrusSignal(preferredIngredient: string, text: string): boolean {
  if (preferredIngredient === '라임') return /라임\s*주스|라임즙/.test(text)
  if (preferredIngredient === '레몬') return /레몬\s*주스|레몬즙/.test(text)
  return false
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '')
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
