import type { RecommendationQuestion } from '../../types/recommendation.js'
import type { PendingQuestion } from '../session/dialogue-session.js'

export type RecommendationQuestionInput = 'help' | 'repeat' | 'skip' | 'delegate' | null

export function classifyRecommendationQuestionInput(input: string): RecommendationQuestionInput {
  const text = input.trim().toLowerCase()
  if (/카루아.*맡기|칼루아.*맡기|전부.*맡기|맡길|알아서.*골라|남은.*알아서|아무거나.*골라/.test(text)) return 'delegate'
  if (/베이스.*뭐|베이스.*뜻|도수.*뭐|탄산감.*뭐|맛.*톤.*뭐|무슨\s*뜻|예시/.test(text)) return 'help'
  if (/한잔|추천.*해|골라.*주/.test(text)) return 'repeat'
  if (/잘\s*모르|모르겠|상관없|아무거나.*괜찮/.test(text)) return 'skip'
  return null
}

export function explainRecommendationQuestion(question: RecommendationQuestion): string {
  const explanations: Record<string, string> = {
    base: '베이스는 칵테일의 중심이 되는 술이에요. 진, 럼, 보드카, 위스키처럼 어떤 술을 바탕으로 할지 고르는 거예요. 잘 모르시면 제가 골라도 돼요.',
    flavor: '맛은 달콤한 쪽, 상큼한 쪽, 쌉쌀한 쪽처럼 첫인상을 고르는 기준이에요. 떠오르는 쪽이 없으면 제가 무난하게 잡을게요.',
    strength: '도수는 술의 진한 정도예요. 가볍게 마실지, 술맛이 분명한 쪽을 원할지만 알려주셔도 충분해요.',
    carbonation: '탄산감은 입안에서 톡 쏘는 느낌이에요. 하이볼처럼 청량한 쪽과 잔잔한 쪽 중 편한 쪽을 고르면 돼요.',
  }
  return explanations[question.topic] ?? '이 질문은 취향을 조금만 좁히기 위한 거예요. 잘 모르시면 제가 편한 쪽으로 골라볼게요.'
}

export function createPendingRecommendationQuestion(
  question: RecommendationQuestion,
  askedAtTurn: number,
  sessionId = 'recommendation-session',
): PendingQuestion {
  const kindByTopic: Record<string, PendingQuestion['kind']> = {
    flavor: 'recommendation-flavor', alcohol: 'recommendation-strength',
    base: 'recommendation-base', fizz: 'recommendation-carbonation',
  }
  return {
    sessionId,
    questionId: question.id,
    kind: kindByTopic[question.topic] ?? 'clarification',
    topic: 'recommendation',
    askedAtTurn,
    sourcePlanId: question.promptPreset?.id ?? question.id,
  }
}

export interface RecommendationChoiceInput {
  sessionId: string
  questionId: string
  answerValue: string
}

export function createRecommendationChoiceInput(
  owner: Pick<RecommendationChoiceInput, 'sessionId' | 'questionId'>,
  answerValue: string,
): RecommendationChoiceInput {
  return { ...owner, answerValue }
}

export function isCurrentRecommendationChoice(
  input: RecommendationChoiceInput,
  session: { mode: 'conversation' | 'recommendation'; activeSessionId: string; pendingQuestion: PendingQuestion | null },
): boolean {
  return session.mode === 'recommendation'
    && session.activeSessionId === input.sessionId
    && session.pendingQuestion?.sessionId === input.sessionId
    && session.pendingQuestion.questionId === input.questionId
}

export function preservesPendingRecommendationQuestion(input: RecommendationQuestionInput): boolean {
  return input === 'help' || input === 'repeat'
}
