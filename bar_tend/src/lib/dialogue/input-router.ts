import { findCocktailByName } from '../cocktails/database.js'
import { isRecommendationIntent } from '../recommendation/question-engine.js'

const SAFETY_CONCERN = /죽고\s*싶|자살|자해|해치고\s*싶|다치게\s*할|살기\s*싫|끝내고\s*싶/
const EXIT_INTENT = /나갈게|갈게|바이|끝낼게|잘 있어|다음에|안녕히/
const RANDOM_RECOMMENDATION = /아무거나/
const RANDOM_RECOMMENDATION_REJECTION = /아무거나\s*(?:말고|는\s*(?:싫|별로|말고))/
const RECOMMENDATION_CANCEL = /^(?:추천\s*)?(?:질문\s*)?(?:취소|그만)(?:해|할래|할게|해줘|해도\s*돼)?$|(?:추천|질문).{0,8}(?:취소|그만)|그만\s*(?:물어봐|물어보세요)/
const COCKTAIL_QUERY = /(.{1,20})[을를]?\s*(?:주문|시켜|원해|찾아|알려줘|뭐야|먹고|마시|한\s*잔|추천|보여줘)/
const STORY_QUERY = /이야기|얘기|얽힌|유래|배경|더\s*들려줘|설명해줘|설명해\s*줘|들려줘/

export type InputRoute =
  | 'safety'
  | 'exit'
  | 'recommendation-cancel'
  | 'random-recommendation'
  | 'explicit-cocktail'
  | 'unknown-cocktail-query'
  | 'story-query'
  | 'recommendation'
  | 'general'

export interface RouteResult {
  route: InputRoute
  matchedCocktailId?: string
  unknownCocktailName?: string
  confidence: number
}

export function detectSafetyConcern(input: string): boolean {
  return SAFETY_CONCERN.test(input.toLowerCase())
}

export function detectExitIntent(input: string): boolean {
  return EXIT_INTENT.test(input.toLowerCase())
}

export function detectRandomRecommendation(input: string): boolean {
  const normalized = input.toLowerCase()
  return RANDOM_RECOMMENDATION.test(normalized)
    && !RANDOM_RECOMMENDATION_REJECTION.test(normalized)
}

export function detectRecommendationCancel(input: string): boolean {
  return RECOMMENDATION_CANCEL.test(input.trim().toLowerCase())
}

export function detectStoryQuery(input: string): boolean {
  return STORY_QUERY.test(input.trim().toLowerCase())
}

export function detectUnknownCocktailQuery(input: string): string | null {
  const match = input.match(COCKTAIL_QUERY)
  if (!match) return null
  const candidate = match[1].trim()
  if (candidate.length < 2) return null
  if (findCocktailByName(candidate)) return null
  if (isRecommendationIntent(candidate) || /추천|아무거나/.test(candidate)) return null
  return candidate
}

export function routeUserInput(
  input: string,
  options: { recommendationActive?: boolean; allowRecommendationRoutes?: boolean } = {},
): RouteResult {
  const allowRecommendationRoutes = options.allowRecommendationRoutes ?? true
  if (detectSafetyConcern(input)) return { route: 'safety', confidence: 0.95 }
  if (options.recommendationActive && detectRecommendationCancel(input)) {
    return { route: 'recommendation-cancel', confidence: 0.9 }
  }
  if (detectExitIntent(input)) return { route: 'exit', confidence: 0.85 }
  const matched = findCocktailByName(input)
  if (detectStoryQuery(input)) {
    return {
      route: 'story-query',
      matchedCocktailId: matched?.id,
      confidence: matched ? 0.85 : 0.75,
    }
  }
  if (!allowRecommendationRoutes) return { route: 'general', confidence: 0.5 }
  if (!options.recommendationActive && detectRandomRecommendation(input)) {
    return { route: 'random-recommendation', confidence: 0.8 }
  }
  if (matched) return { route: 'explicit-cocktail', matchedCocktailId: matched.id, confidence: 0.9 }
  if (options.recommendationActive || isRecommendationIntent(input)) {
    return { route: 'recommendation', confidence: 0.6 }
  }
  const unknownName = detectUnknownCocktailQuery(input)
  if (unknownName) {
    return { route: 'unknown-cocktail-query', unknownCocktailName: unknownName, confidence: 0.6 }
  }
  return { route: 'general', confidence: 0.5 }
}
