import { useCallback, useState } from 'react'
import {
  applyQuestionAnswer,
  formatQuestion,
  getQuestionById,
  ingestTasteSignals,
  initCandidatePool,
  isRecommendationDecisive,
  isRecommendationIntent,
  pickFromPool,
  selectNextQuestion,
} from '@/lib/recommendation/question-engine.js'
import { findCocktailByName, getRandomCocktail } from '@/lib/cocktails/database.js'
import {
  formatExplicitCocktailReply,
  formatRandomRecommendationReply,
  formatRecommendationReply,
} from '@/lib/recommendation/response.js'
import {
  addQuestionHistory,
  answerLatestQuestion,
  applyRecommendationSignals,
  createRecommendationDecision,
  createRecommendationState,
  extractRecommendationSignals,
  getQuestionCandidatePool,
  resolveCocktailsByRecommendationState,
} from '@/lib/recommendation/state.js'
import type { CocktailData, Expression } from '@/types.js'
import type { TastePreference } from '@/types/cocktail-db.js'
import type { RecommendationDecision, RecommendationState } from '@/types/recommendation.js'

export interface RecommendationResult {
  reply: string
  expression: Expression
  cocktail: CocktailData | null
  decision: RecommendationDecision | null
}

export function useRecommendationSession() {
  const [candidatePool, setCandidatePool] = useState<CocktailData[] | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [recommendationState, setRecommendationState] = useState<RecommendationState>(
    createRecommendationState,
  )

  const resetRecommendation = useCallback(() => {
    setCandidatePool(null)
    setActiveQuestionId(null)
    setRecommendationState(createRecommendationState())
  }, [])

  const resolveRandomRecommendation = useCallback((): RecommendationResult => {
    const cocktail = getRandomCocktail()
    const state = createRecommendationState()
    resetRecommendation()
    return {
      cocktail,
      decision: createRecommendationDecision(cocktail, state),
      reply: formatRandomRecommendationReply(cocktail),
      expression: 'smirk',
    }
  }, [resetRecommendation])

  const resolveRecommendation = useCallback(
    (text: string, preference: TastePreference): RecommendationResult | null => {
      const explicitCocktail = findCocktailByName(text)
      const isRecommendation =
        !explicitCocktail && (candidatePool !== null || isRecommendationIntent(text))

      if (explicitCocktail) {
        return {
          cocktail: explicitCocktail,
          decision: createRecommendationDecision(explicitCocktail, recommendationState),
          reply: formatExplicitCocktailReply(explicitCocktail),
          expression: 'smirk',
        }
      }

      if (!isRecommendation) return null

      const tasteSnapshot = ingestTasteSignals(text, preference)
      let nextState = recommendationState
      let acknowledgement: string | null = null
      let finishRecommendation = false
      const activeQuestion = getQuestionById(activeQuestionId)
      if (candidatePool !== null && activeQuestion) {
        nextState = answerLatestQuestion(nextState, text)
        const applied = applyQuestionAnswer(nextState, activeQuestion, text)
        nextState = applied.state
        acknowledgement = applied.acknowledgement
        finishRecommendation = applied.finishRecommendation
      } else {
        nextState = applyRecommendationSignals(nextState, extractRecommendationSignals(text))
      }
      const sourcePool = initCandidatePool()
      const questionCandidates = getQuestionCandidatePool(sourcePool, nextState)
      const resolved = resolveCocktailsByRecommendationState(sourcePool, nextState)
      const pool = questionCandidates.cocktails
      const combinedTaste = { ...tasteSnapshot, ...nextState.taste }

      if (pool.length === 0) {
        resetRecommendation()
        return {
          cocktail: null,
          decision: null,
          reply: '그 조건에 맞는 잔은 지금 목록에 없네요. 없는 술을 있는 척하면 재고 조사가 길어지거든요.',
          expression: 'thinking',
        }
      }

      const nextQuestion = finishRecommendation
        || isRecommendationDecisive(pool)
        ? null
        : selectNextQuestion(pool, nextState)

      if (nextQuestion) {
        nextState = addQuestionHistory(nextState, {
          topic: nextQuestion.topic,
        })
        setRecommendationState(nextState)
        setCandidatePool(pool)
        setActiveQuestionId(nextQuestion.id)
        return {
          cocktail: null,
          decision: null,
          reply: formatQuestion(
            nextQuestion,
            questionCandidates.exactMatch
              ? acknowledgement
              : '정확히 일치하는 후보는 아직 없습니다. 가까운 후보를 좁히기 위해 조건을 더 확인합니다.',
          ),
          expression: 'thinking',
        }
      }

      const cocktail = pickFromPool(resolved.cocktails, combinedTaste)
      if (!cocktail) return null
      const decision = createRecommendationDecision(cocktail, nextState)
      resetRecommendation()

      return {
        cocktail,
        decision,
        reply: formatRecommendationReply(
          decision,
          acknowledgement,
          resolved.exactMatch ? 'exact' : 'nearest',
        ),
        expression: 'smirk',
      }
    },
    [activeQuestionId, candidatePool, recommendationState, resetRecommendation],
  )

  return {
    activeQuestion: getQuestionById(activeQuestionId),
    resetRecommendation,
    resolveRandomRecommendation,
    resolveRecommendation,
  }
}
