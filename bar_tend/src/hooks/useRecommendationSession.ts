import { useCallback, useState } from 'react'
import {
  applyQuestionAnswer,
  createRecommendationSourcePool,
  formatQuestion,
  getQuestionById,
  ingestTasteSignals,
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
  const [excludedCocktailIds, setExcludedCocktailIds] = useState<string[]>([])

  const resetRecommendation = useCallback(() => {
    setCandidatePool(null)
    setActiveQuestionId(null)
    setRecommendationState(createRecommendationState())
  }, [])

  const clearExcludedCocktailIds = useCallback(() => {
    setExcludedCocktailIds([])
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
      const sourcePool = createRecommendationSourcePool(excludedCocktailIds)

      if (sourcePool.exhausted) {
        setExcludedCocktailIds([])
        resetRecommendation()
        return {
          cocktail: null,
          decision: null,
          reply: '모든 칵테일을 이미 추천해 드렸네요. 처음부터 다시 골라볼게요.\n다시 한번 말씀해 주세요.',
          expression: 'smirk',
        }
      }

      const questionCandidates = getQuestionCandidatePool(sourcePool.cocktails, nextState)
      const resolved = resolveCocktailsByRecommendationState(sourcePool.cocktails, nextState)
      const pool = questionCandidates.cocktails
      const combinedTaste = { ...tasteSnapshot, ...nextState.taste }

      if (pool.length === 0) {
        resetRecommendation()
        return {
          cocktail: null,
          decision: null,
          reply: '죄송합니다. 말씀해 주신 조건에 맞는 칵테일은 현재 메뉴에서 찾지 못했어요.',
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
              : '완전히 맞는 칵테일은 아직 없네요. 가장 가까운 걸 찾을 수 있게 한 가지만 더 여쭤볼게요.',
          ),
          expression: 'thinking',
        }
      }

      const cocktail = pickFromPool(resolved.cocktails, combinedTaste)
      if (!cocktail) return null
      const decision = createRecommendationDecision(cocktail, nextState)
      setExcludedCocktailIds((prev) => [...prev, cocktail.id])
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
    [activeQuestionId, candidatePool, recommendationState, resetRecommendation, excludedCocktailIds],
  )

  return {
    activeQuestion: getQuestionById(activeQuestionId),
    clearExcludedCocktailIds,
    excludedCocktailIds,
    resetRecommendation,
    resolveRandomRecommendation,
    resolveRecommendation,
  }
}
