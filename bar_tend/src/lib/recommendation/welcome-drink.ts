import type { CocktailData, Expression } from '../../types.js'
import type { RecommendationQuestion } from '../../types/recommendation.js'
import { getPublicCocktailData } from '../cocktails/database.js'
import type { InputRoute } from '../dialogue/input-router.js'
import type { ResponsePlan } from '../dialogue/response-plan.js'
import {
  renderWelcomeDrinkFeedbackResponsePlan,
  renderWelcomeDrinkResponsePlan,
} from '../dialogue/response-plan-renderer.js'
import { selectCocktailTalkingPoint } from './response.js'

export const WELCOME_DRINK_FEEDBACK_QUESTION: RecommendationQuestion = {
  id: 'welcome-drink-feedback',
  topic: 'welcome-feedback',
  prompt: '웰컴드링크는 괜찮으셨나요?',
  dialogueFlow: {
    leadIn: '첫 잔이라 가볍게 확인만 할게요.',
    continuation: '그럼 웰컴드링크 쪽 느낌만 한 번 더 볼게요.',
    goal: 'confirm-constraint',
  },
  choices: [
    {
      label: '좋았어요',
      signals: [],
      acknowledgement: '좋았어요. 그럼 이쪽 밸런스는 기억해둘게요.',
      finishRecommendation: true,
    },
    {
      label: '조금 더 가볍게',
      signals: [{ field: 'alcoholPreference', value: 'low', confidence: 0.8, source: 'question' }],
      acknowledgement: '좋아요. 다음 잔은 더 가볍고 편한 쪽으로 잡을게요.',
      finishRecommendation: true,
    },
    {
      label: '조금 더 달게',
      signals: [{ field: 'taste.sweetness', value: 0.7, confidence: 0.8, source: 'question' }],
      acknowledgement: '알겠습니다. 다음 잔은 단맛을 조금 더 올려볼게요.',
      finishRecommendation: true,
    },
    {
      label: '다른 느낌이 좋아요',
      signals: [],
      acknowledgement: '괜찮아요. 첫 잔은 기준점이니까요. 다음에는 다른 결로 맞춰볼게요.',
      finishRecommendation: true,
    },
  ],
}

export function selectWelcomeDrink(cocktails: CocktailData[] = getPublicCocktailData()): CocktailData {
  const approachable = cocktails.filter((cocktail) =>
    cocktail.type === 'CLASSIC' &&
    cocktail.features.alcohol_strength <= 0.65 &&
    cocktail.features.sweetness <= 0.75,
  )
  const candidates = approachable.length > 0 ? approachable : cocktails

  return candidates[Math.floor(Math.random() * candidates.length)] ?? cocktails[0]
}

function getWelcomeDrinkTalkingPoint(cocktail: CocktailData): string {
  return selectCocktailTalkingPoint(cocktail)
}

export function formatWelcomeDrinkReply(cocktail: CocktailData, options: {
  alcoholStarTotal?: number
} = {}): string {
  return formatWelcomeDrinkResponse(cocktail, options).text
}

export function formatWelcomeDrinkResponse(cocktail: CocktailData, options: {
  alcoholStarTotal?: number
  plans?: readonly ResponsePlan[]
} = {}): { text: string; expression: Expression } {
  const name = cocktail.name_ko ?? cocktail.name
  const alcoholStarTotal = options.alcoholStarTotal ?? 0
  const talkingPoint = getWelcomeDrinkTalkingPoint(cocktail)
  const rendered = renderWelcomeDrinkResponsePlan(
    getWelcomeDrinkResponseState(alcoholStarTotal),
    name,
    talkingPoint,
    options.plans,
  )

  return rendered ?? { text: formatWelcomeDrinkLegacy(cocktail, options), expression: 'smirk' }
}

function getWelcomeDrinkResponseState(alcoholStarTotal: number): string {
  if (alcoholStarTotal > 10) return 'late'
  if (alcoholStarTotal > 0) return 'after-order'
  return 'first'
}

function formatWelcomeDrinkLegacy(cocktail: CocktailData, options: {
  alcoholStarTotal?: number
} = {}): string {
  const name = cocktail.name_ko ?? cocktail.name
  const alcoholStarTotal = options.alcoholStarTotal ?? 0
  const context =
    alcoholStarTotal > 10
      ? '웰컴이라고 부르기엔 꽤 늦었네요. 그래도 아직 안 드린 잔은 안 드린 잔이라서요.'
      : alcoholStarTotal > 0
        ? '첫 순서에 드렸어야 했는데, 조금 앞질러 가버렸네요.'
        : '첫 잔이라 짧게 이야기 하나 얹어드릴게요.'
  const talkingPoint = getWelcomeDrinkTalkingPoint(cocktail)

  return `웰컴드링크로는 ${name}로 드릴게요.\n${context}\n${talkingPoint}`
}

export function formatWelcomeDrinkFeedbackReply(answer: string): { text: string; expression: Expression } {
  return formatWelcomeDrinkFeedbackResponse(answer)
}

export function formatWelcomeDrinkFeedbackResponse(
  answer: string,
  options: { plans?: readonly ResponsePlan[] } = {},
): { text: string; expression: Expression } {
  const rendered = renderWelcomeDrinkFeedbackResponsePlan(
    getWelcomeDrinkFeedbackResponseState(answer),
    options.plans,
  )

  return rendered ?? formatWelcomeDrinkFeedbackLegacy(answer)
}

function formatWelcomeDrinkFeedbackLegacy(answer: string): { text: string; expression: Expression } {
  const normalized = answer.replace(/\s+/g, '')
  const matched = WELCOME_DRINK_FEEDBACK_QUESTION.choices.find((choice) =>
    normalized.includes(choice.label.replace(/\s+/g, '')),
  )

  if (matched?.acknowledgement) {
    const isNegative = matched.label !== '좋았어요'
    return { text: matched.acknowledgement, expression: isNegative ? 'embarrassed' : 'smirk' }
  }
  if (/가볍|약하|낮/.test(answer)) {
    return { text: '좋아요. 다음 잔은 더 가볍고 편한 쪽으로 잡을게요.', expression: 'embarrassed' }
  }
  if (/달|스윗|sweet/i.test(answer)) {
    return { text: '알겠습니다. 다음 잔은 단맛을 조금 더 올려볼게요.', expression: 'embarrassed' }
  }
  if (/좋|괜찮|마음|맛있/.test(answer)) {
    return { text: '좋았어요. 그럼 이쪽 밸런스는 기억해둘게요.', expression: 'smirk' }
  }
  return { text: '좋아요. 첫 잔 반응은 기준점으로만 남겨둘게요. 다음 잔은 말씀 주신 느낌을 보고 다시 맞춰볼게요.', expression: 'embarrassed' }
}

function getWelcomeDrinkFeedbackResponseState(answer: string): string {
  const normalized = answer.replace(/\s+/g, '')
  const matched = WELCOME_DRINK_FEEDBACK_QUESTION.choices.find((choice) =>
    normalized.includes(choice.label.replace(/\s+/g, '')),
  )

  if (matched?.label === '좋았어요') return 'positive'
  if (matched?.label === '조금 더 가볍게') return 'lighter'
  if (matched?.label === '조금 더 달게') return 'sweeter'
  if (matched?.label === '다른 느낌이 좋아요') return 'alternate'
  if (/가볍|약하|낮/.test(answer)) return 'lighter'
  if (/달|스윗|sweet/i.test(answer)) return 'sweeter'
  if (/좋|괜찮|마음|맛있/.test(answer)) return 'positive'
  return 'neutral'
}

export function isWelcomeDrinkFeedbackAnswer(answer: string): boolean {
  const normalized = answer.replace(/\s+/g, '')
  return WELCOME_DRINK_FEEDBACK_QUESTION.choices.some((choice) =>
    normalized.includes(choice.label.replace(/\s+/g, '')),
  ) || /가볍|약하|낮|달|스윗|sweet|좋았|괜찮|마음에|맛있|별로|싫|다른\s*느낌|아쉬/.test(answer)
}

export function shouldHandleWelcomeDrinkFeedback(route: InputRoute, answer: string): boolean {
  return route === 'general' && isWelcomeDrinkFeedbackAnswer(answer)
}
