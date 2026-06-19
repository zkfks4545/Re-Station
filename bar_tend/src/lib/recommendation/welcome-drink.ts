import type { CocktailData } from '../../types.js'
import type { RecommendationQuestion } from '../../types/recommendation.js'
import { getAllCocktailData } from '../cocktails/database.js'

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

export function selectWelcomeDrink(cocktails: CocktailData[] = getAllCocktailData()): CocktailData {
  const approachable = cocktails.filter((cocktail) =>
    cocktail.type === 'CLASSIC' &&
    cocktail.features.alcohol_strength <= 0.65 &&
    cocktail.features.sweetness <= 0.75,
  )
  const candidates = approachable.length > 0 ? approachable : cocktails

  return candidates[Math.floor(Math.random() * candidates.length)] ?? cocktails[0]
}

export function formatWelcomeDrinkReply(cocktail: CocktailData): string {
  const name = cocktail.name_ko ?? cocktail.name
  return `웰컴드링크로는 ${name}로 드릴게요.\n처음 오신 분께는 너무 앞서 나가지 않는 잔이 좋거든요. 가볍게 분위기를 맞춰볼게요.`
}

export function formatWelcomeDrinkFeedbackReply(answer: string): string {
  const normalized = answer.replace(/\s+/g, '')
  const matched = WELCOME_DRINK_FEEDBACK_QUESTION.choices.find((choice) =>
    normalized.includes(choice.label.replace(/\s+/g, '')),
  )

  if (matched?.acknowledgement) return matched.acknowledgement
  if (/가볍|약하|낮/.test(answer)) {
    return '좋아요. 다음 잔은 더 가볍고 편한 쪽으로 잡을게요.'
  }
  if (/달|스윗|sweet/i.test(answer)) {
    return '알겠습니다. 다음 잔은 단맛을 조금 더 올려볼게요.'
  }
  if (/좋|괜찮|마음|맛있/.test(answer)) {
    return '좋았어요. 그럼 이쪽 밸런스는 기억해둘게요.'
  }
  return '좋아요. 첫 잔 반응은 기준점으로만 남겨둘게요. 다음 잔은 말씀 주신 느낌을 보고 다시 맞춰볼게요.'
}
