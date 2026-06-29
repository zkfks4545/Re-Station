import { cocktails, findCocktailByName } from '../cocktails/database.js'
import { findCocktailByLoreReference, hasExplicitLoreReference } from '../cocktails/lore-reference.js'
import { isRecommendationIntent } from '../recommendation/question-engine.js'
import { SHAKE_REFERENCE } from './pattern-utils.js'

const SAFETY_CONCERN = /죽고\s*싶|자살|자해|해치고\s*싶|죽이고\s*싶|죽여\s*버리고\s*싶|다치게\s*할|살기\s*싫|끝내고\s*싶|(?:칼|흉기|총)\s*(?:을|를)?\s*(?:들고|겨누고)|피가\s*(?:많이|계속)\s*나|누가\s*(?:나를|저를)?\s*(?:죽이|해치)려/
const EXIT_INTENT = /나갈게|갈게|바이|끝낼게|잘 있어|다음에|안녕히/
const RANDOM_RECOMMENDATION = /아무거나/
const RANDOM_RECOMMENDATION_REJECTION = /아무거나\s*(?:말고|는\s*(?:싫|별로|말고))/
const RECOMMENDATION_CANCEL = /^(?:추천\s*)?(?:질문\s*)?(?:취소|그만)(?:해|할래|할게|해줘|해도\s*돼)?$|(?:추천|질문).{0,8}(?:취소|그만)|그만\s*(?:물어봐|물어보세요)/
const COCKTAIL_QUERY = /(.{1,20})[을를]?\s*(?:주문|시켜|원해|찾아|알려줘|뭐야|먹고|마시|한\s*잔|추천|보여줘)/
const STORY_QUERY = /이야기|얘기|얽힌|유래|배경|더\s*들려줘|설명해줘|설명해\s*줘|들려줘|누가\s*(?:만들|발명|고안|마시|좋아하)|[가-힣]{2,}[이가]\s*(?:마시|좋아하)/
const LORE_QUERY = /왜\s*(?:이름|불리|붙은|알려져|알려졌)|누가\s*(?:만들|발명|고안)|탄생\s*(?:이야기|설명)|기원|어떻게\s*(?:탄생|만들|시작|알려져)|이름\s*(?:왜|어떻게|무슨|유래|뜻)/
const COCKTAIL_INFO_QUERY = /정보\s*(?:좀\s*)?(?:알려|줘|뭐야|뭔지)|레시피\s*(?:좀\s*)?(?:알려|줘|뭐)|재료\s*(?:뭐|무슨|어떻|좀)|도수\s*(?:는|가)?\s*(?:어떻|뭐|얼마|높|낮)|맛\s*설명|어떤\s*칵테일|이\s*칵테일\s*(?:정보|설명|레시피)/
const CHARACTER_QUERY = /당신은\s*(?:그럼|누구|뭐|뭘)|넌\s*(?:뭐|누구)|너는\s*(?:누구|뭐)|바텐더(?:야|니|예요|인가)|네가\s*(?:누구|뭐|뭔데)/
const PRONOUN_REFERENCE = /이거|그거|그걸로|이\s*칵테일|방금\s*그거|저거/
const ORDER_VERB = /(?:주세요|주세여|줘|부탁|시켜줘|시켜|한\s*잔)/
const LORE_ORDER = /(?:주세요|주세여|부탁|주문|시켜(?:줘)?|한\s*잔|한잔|다음\s*잔|걸로\s*줘|마실래(?:요)?|먹을래(?:요)?|그걸로(?:요)?\s*[.!?]*$)/
const EXPLICIT_RECOMMENDATION = /추천|골라\s*줘|골라줘|뭐가\s*좋/

export type InputRoute =
  | 'safety'
  | 'exit'
  | 'recommendation-cancel'
  | 'random-recommendation'
  | 'lore-based-order'
  | 'explicit-cocktail'
  | 'unknown-cocktail-query'
  | 'story-query'
  | 'lore-query'
  | 'cocktail-info-query'
  | 'character-query'
  | 'cocktail-mention'
  | 'recommendation'
  | 'general'

export interface RouteResult {
  route: InputRoute
  matchedCocktailId?: string
  unknownCocktailName?: string
  explicitLoreReference?: boolean
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

export function detectLoreQuery(input: string): boolean {
  return LORE_QUERY.test(input.trim().toLowerCase())
}

function detectCocktailInfoQuery(input: string): boolean {
  return COCKTAIL_INFO_QUERY.test(input.trim().toLowerCase())
}

export function detectCharacterQuery(input: string): boolean {
  return CHARACTER_QUERY.test(input.trim().toLowerCase())
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

function detectOrderVerb(input: string): boolean {
  return ORDER_VERB.test(input.trim().toLowerCase())
}

function detectLoreOrderIntent(input: string): boolean {
  return LORE_ORDER.test(input.trim().toLowerCase())
}

function detectExplicitRecommendationIntent(input: string): boolean {
  const normalized = input.trim().toLowerCase()
  if (EXPLICIT_RECOMMENDATION.test(normalized)) return true
  return RANDOM_RECOMMENDATION.test(normalized) && !RANDOM_RECOMMENDATION_REJECTION.test(normalized)
}

export function routeUserInput(
  input: string,
  options: { recommendationActive?: boolean; allowRecommendationRoutes?: boolean; lastDiscussedCocktailId?: string; orderCandidateCocktailId?: string } = {},
): RouteResult {
  if (detectSafetyConcern(input)) return { route: 'safety', confidence: 0.95 }
  if (options.recommendationActive && detectRecommendationCancel(input)) {
    return { route: 'recommendation-cancel', confidence: 0.9 }
  }
  if (detectExitIntent(input)) return { route: 'exit', confidence: 0.85 }
  const hasOrderVerb = detectOrderVerb(input)
  const hasLoreOrderIntent = detectLoreOrderIntent(input)
  const loreMatch = findCocktailByLoreReference(input, cocktails)
  if (loreMatch) {
    return {
      route: hasLoreOrderIntent ? 'lore-based-order' : 'story-query',
      matchedCocktailId: loreMatch.cocktail.id,
      explicitLoreReference: true,
      confidence: 0.9,
    }
  }
  if (hasLoreOrderIntent && hasExplicitLoreReference(input)) {
    return { route: 'story-query', explicitLoreReference: true, confidence: 0.65 }
  }
  const matched = findCocktailByName(input)
  if (detectStoryQuery(input)) {
    return {
      route: 'story-query',
      matchedCocktailId: matched?.id,
      confidence: matched ? 0.85 : 0.75,
    }
  }
  if (detectLoreQuery(input)) {
    return {
      route: 'lore-query',
      matchedCocktailId: matched?.id,
      confidence: matched ? 0.8 : 0.7,
    }
  }
  if (detectCocktailInfoQuery(input)) {
    return {
      route: 'cocktail-info-query',
      matchedCocktailId: matched?.id,
      confidence: matched ? 0.8 : 0.7,
    }
  }
  if (detectCharacterQuery(input)) {
    return {
      route: 'character-query',
      confidence: 0.8,
    }
  }

  // 칵테일명 + 주문 동사 → explicit-cocktail (recommendationRoutes 무관)
  if (matched && hasOrderVerb) {
    return { route: 'explicit-cocktail', matchedCocktailId: matched.id, confidence: 0.9 }
  }
  // 칵테일명 + 제조 방식(셰이크/본드식) → explicit-cocktail
  if (matched && SHAKE_REFERENCE.test(input.trim().toLowerCase())) {
    return { route: 'explicit-cocktail', matchedCocktailId: matched.id, confidence: 0.85 }
  }
  const allowRecommendationRoutes = options.allowRecommendationRoutes ?? true
  if (!allowRecommendationRoutes) {
    // bare cocktail name (matched but no order verb) → cocktail-mention
    if (matched) {
      return { route: 'cocktail-mention', matchedCocktailId: matched.id, confidence: 0.8 }
    }
    if (detectExplicitRecommendationIntent(input)) {
      return { route: 'general', confidence: 0.5 }
    }
    if (hasOrderVerb && options.orderCandidateCocktailId) {
      return { route: 'explicit-cocktail', matchedCocktailId: options.orderCandidateCocktailId, confidence: 0.85 }
    }
    return { route: 'general', confidence: 0.5 }
  }

  if (!options.recommendationActive && detectRandomRecommendation(input)) {
    return { route: 'random-recommendation', confidence: 0.8 }
  }
  if (matched) return { route: 'explicit-cocktail', matchedCocktailId: matched.id, confidence: 0.9 }
  if (detectExplicitRecommendationIntent(input)) {
    return { route: 'recommendation', confidence: 0.6 }
  }
  // 대명사/생략 주문은 명시적 lore, 이름, 추천 의도를 모두 확인한 뒤에만 컨텍스트를 사용한다.
  if (hasOrderVerb && options.orderCandidateCocktailId) {
    return { route: 'explicit-cocktail', matchedCocktailId: options.orderCandidateCocktailId, confidence: 0.85 }
  }
  if (options.recommendationActive || isRecommendationIntent(input)) {
    return { route: 'recommendation', confidence: 0.6 }
  }
  // 대명사 참조 + 컨텍스트 → unknown-cocktail-query 우회, engine이 history로 처리
  if (options.lastDiscussedCocktailId && PRONOUN_REFERENCE.test(input.trim().toLowerCase())) {
    return { route: 'general', confidence: 0.5 }
  }
  const unknownName = detectUnknownCocktailQuery(input)
  if (unknownName) {
    return { route: 'unknown-cocktail-query', unknownCocktailName: unknownName, confidence: 0.6 }
  }
  return { route: 'general', confidence: 0.5 }
}
