import type { Expression } from '../../types.js'
import type {
  RecommendationDecision,
  RecommendationRoute,
  RecommendationRouteTag,
  DialogueState,
  AffectState,
} from '../../types/recommendation.js'
import type {
  DialogueTurn,
  DialogueIntent,
  ExtractedEntities,
  DialogueAction,
} from '../../types/dialogue-turn.js'
import type { InputRoute } from './input-router.js'

interface RecommendationOutcome {
  reply: string
  expression: Expression
  decision?: RecommendationDecision | null
}

export const SAFETY_REDIRECT_REPLY =
  '지금은 안전이 먼저예요. 지금 다칠 위험이 있거나 혼자 있기 어렵다면 즉시 119나 112, 또는 자살예방상담전화 1393에 연락해 주세요.\n가까운 사람에게도 바로 연락해 주세요.'

const ROUTE_TO_INTENT: Record<string, DialogueIntent> = {
  safety: 'safety-alert',
  exit: 'exit-intent',
  'recommendation-cancel': 'recommendation-cancel',
  'random-recommendation': 'random-request',
  'explicit-cocktail': 'cocktail-order',
  'unknown-cocktail-query': 'cocktail-order',
  recommendation: 'recommend-request',
  general: 'general-chat',
}

const ROUTE_TO_ACTION: Record<string, DialogueAction> = {
  safety: 'safety-redirect',
  exit: 'exit',
  'recommendation-cancel': 'reset',
  'random-recommendation': 'recommend',
  'explicit-cocktail': 'show-info',
  'unknown-cocktail-query': 'queue-for-review',
  recommendation: 'recommend',
  general: 'reply',
}

function routeToRouteTag(route: InputRoute): RecommendationRouteTag {
  const map: Record<string, RecommendationRouteTag> = {
    'explicit-cocktail': 'direct-name',
    'unknown-cocktail-query': 'direct-name',
    'random-recommendation': 'random',
    recommendation: 'taste',
  }
  return map[route] ?? 'delegated'
}

function routeToDialogueRoute(route: InputRoute): RecommendationRoute {
  const map: Record<string, RecommendationRoute> = {
    'explicit-cocktail': 'directCocktailOrder',
    'unknown-cocktail-query': 'directCocktailOrder',
    'random-recommendation': 'randomPick',
    recommendation: 'recommendationInference',
  }
  return map[route] ?? 'tastePreferenceOrder'
}

function inferEntities(input: string): ExtractedEntities {
  const lower = input.toLowerCase()
  const entities: ExtractedEntities = {}

  const moodWords = ['힘들', '우울', '슬퍼', '외롭', '스트레스', '피곤', '지쳤', '행복', '신나', '축하', '기쁘', '즐거']
  const foundMoods = moodWords.filter((w) => lower.includes(w))
  if (foundMoods.length > 0) entities.moods = foundMoods

  const tasteWords = ['달콤', '쓰다', '신맛', '상큼', '청량', '쌉쌀', '비터', '짠맛']
  const foundTastes = tasteWords.filter((w) => lower.includes(w))
  if (foundTastes.length > 0) entities.tastes = foundTastes

  const baseSpirits = ['진', '보드카', '럼', '위스키', '데킬라', '브랜디']
  const foundBase = baseSpirits.find((s) => lower.includes(s))
  if (foundBase) entities.baseSpirit = foundBase

  if (/무알콜|논알콜|알콜\s*빼|술\s*없이|non.*alcoholic/i.test(lower)) {
    entities.alcoholPreference = 'non-alcoholic'
  } else if (/도수\s*높|강한|쎈|high|strong/i.test(lower)) {
    entities.alcoholPreference = 'high'
  } else if (/약한|순한|도수\s*낮|low|light/i.test(lower)) {
    entities.alcoholPreference = 'low'
  }

  return entities
}

function buildFactsForDecision(decision: RecommendationDecision): string[] {
  const facts: string[] = []
  for (const reason of decision.reasons) {
    facts.push(reason.detail)
    facts.push(...reason.evidence)
  }
  return facts
}

export function buildDialogueTurn(
  inputText: string,
  inputRoute: InputRoute,
  fallbackReply: string,
  fallbackExpression: Expression,
  outcome?: RecommendationOutcome | null,
): DialogueTurn {
  const entities = inferEntities(inputText)
  const route = routeToDialogueRoute(inputRoute)
  const routeTag = routeToRouteTag(inputRoute)
  const routeTags: RecommendationRouteTag[] = [routeTag]
  const reply = resolveReply(inputRoute, fallbackReply, outcome?.reply)
  const decision = outcome?.decision

  let action = ROUTE_TO_ACTION[inputRoute] ?? 'reply'
  if (inputRoute === 'recommendation' && !outcome?.decision?.cocktail) {
    action = 'ask-question'
  }

  const responseGoalMap: Record<string, string> = {
    'safety-alert': '안전 확인과 위기 상담 안내',
    'exit-intent': '퇴장 처리',
    'recommendation-cancel': '추천 질문 중단',
    'random-request': '랜덤 칵테일 추천',
    'cocktail-order': '칵테일 정보 제공',
    'recommend-request': '취향 기반 추천',
  }
  const intent = ROUTE_TO_INTENT[inputRoute] ?? 'general-chat'
  const responseGoal = responseGoalMap[intent] ?? '일반 대화 응대'

  const forbidden: string[] = []
  if (inputRoute === 'safety') {
    forbidden.push('농담', '가벼운 반응', '추천 진행', '사소한 위로')
  }

  const facts = decision ? buildFactsForDecision(decision) : [reply]

  const dialogueState: DialogueState = decision?.dialogue?.dialogueState ?? (
    inputRoute === 'recommendation' && action === 'ask-question' ? 'asking' :
    action === 'recommend' ? 'recommending' : 'idle'
  )
  const affectState: AffectState = decision?.dialogue?.affectState ?? (
    inputRoute === 'safety' ? 'concerned' :
    inputRoute === 'exit' ? 'neutral' : 'neutral'
  )

  return {
    intent,
    entities,
    confidence: inputRoute === 'recommendation' ? 0.6 : 0.9,
    route,
    routeTags,
    action,
    responseGoal,
    facts,
    forbidden,
    statePatch: {
      dialogueState,
      affectState,
      ...(inputRoute === 'recommendation-cancel' ? { resetRecommendation: true } : {}),
    },
    reply,
    expression: outcome?.expression ?? fallbackExpression,
  }
}

function resolveReply(
  inputRoute: InputRoute,
  fallbackReply: string,
  outcomeReply?: string,
): string {
  if (outcomeReply) return outcomeReply
  if (fallbackReply) return fallbackReply
  if (inputRoute === 'safety') return SAFETY_REDIRECT_REPLY
  return ''
}
