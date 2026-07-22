import { useCallback, useRef, useState } from 'react'
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
import { findCocktailByName, getRandomCocktail } from '@/lib/cocktails/index.js'
import { assembleResponse, type ResponseTone } from '@/lib/dialogue/response-pipeline.js'
import { classifyRecommendationQuestionInput } from '@/lib/recommendation/question-context.js'
import {
  formatExplicitCocktailReply,
  formatExactRecommendationResponse,
  formatLoreBasedOrderReply,
  formatNearestRecommendationResponse,
  formatRandomRecommendationResponse,
  formatRecommendationReply,
  formatSecretMenuOrderReply,
  selectRecommendationOpening,
} from '@/lib/recommendation/response.js'
import {
  addQuestionHistory,
  answerLatestQuestion,
  applyRecommendationSignals,
  createRecommendationDecision,
  createRecommendationState,
  extractRecommendationSignals,
  inferRecommendationDialogueContext,
  getQuestionCandidatePool,
  resolveCocktailsByRecommendationState,
} from '@/lib/recommendation/state.js'
import type { CocktailData, Expression } from '@/types.js'
import type { TastePreference } from '@/types/cocktail-db.js'
import type { RecommendationDecision, RecommendationQuestion, RecommendationState } from '@/types/recommendation.js'
import { addExcludedCocktailId } from '@/lib/recommendation/feedback-exclusion.js'

export interface RecommendationResult {
  reply: string
  expression: Expression
  cocktail: CocktailData | null
  decision: RecommendationDecision | null
  pendingQuestion: RecommendationQuestion | null
}

export function useRecommendationSession() {
  const [candidatePool, setCandidatePool] = useState<CocktailData[] | null>(null)
  const [recommendationState, setRecommendationState] = useState<RecommendationState>(
    createRecommendationState,
  )
  const [excludedCocktailIds, setExcludedCocktailIds] = useState<string[]>([])
  const excludedCocktailIdsRef = useRef<string[]>([])
  const [recentDialogueLineIds, setRecentDialogueLineIds] = useState<string[]>([])

  const resetRecommendation = useCallback(() => {
    setCandidatePool(null)
    setRecommendationState(createRecommendationState())
  }, [])

  const clearExcludedCocktailIds = useCallback(() => {
    excludedCocktailIdsRef.current = []
    setExcludedCocktailIds([])
  }, [])

  const captureExtractedPreferences = useCallback((text: string) => {
    const signals = extractRecommendationSignals(text)
    if (signals.length > 0) {
      setRecommendationState((current) => applyRecommendationSignals(current, signals))
    }
  }, [])

  const excludeCocktailFromRecommendations = useCallback((cocktailId: string) => {
    const next = addExcludedCocktailId(excludedCocktailIdsRef.current, cocktailId)
    excludedCocktailIdsRef.current = next
    setExcludedCocktailIds(next)
  }, [])

  const resolveRandomRecommendation = useCallback((): RecommendationResult => {
    const cocktail = getRandomCocktail()
    const state = createRecommendationState()
    const decision = createRecommendationDecision(
      cocktail,
      state,
      inferRecommendationDialogueContext(state, {
        route: 'randomPick',
        routeTags: ['random'],
        dialogueState: 'serving',
        affectState: 'playful',
      }),
    )
    const selectedOpening = selectRecommendationOpening(decision, recentDialogueLineIds)
    setRecentDialogueLineIds((prev) => [selectedOpening.id, ...prev].slice(0, 4))
    resetRecommendation()
    const formatted = formatRandomRecommendationResponse(cocktail, selectedOpening.text)
    return assembleRecommendationResult(
      formatted.text,
      'playful',
      cocktail,
      decision,
      formatted.expression,
    )
  }, [recentDialogueLineIds, resetRecommendation])

  const resolveExplicitCocktail = useCallback((
    cocktail: CocktailData,
    options: { secretPassphrase?: string } = {},
  ): RecommendationResult => {
    const dialogue = inferRecommendationDialogueContext(recommendationState, {
      route: 'directCocktailOrder',
      routeTags: options.secretPassphrase ? ['delegated'] : ['direct-name'],
      dialogueState: 'serving',
      affectState: options.secretPassphrase ? 'playful' : 'confident',
    })
    resetRecommendation()
    return assembleRecommendationResult(
      options.secretPassphrase
        ? formatSecretMenuOrderReply(cocktail)
        : formatExplicitCocktailReply(cocktail),
      dialogue.affectState,
      cocktail,
      createRecommendationDecision(cocktail, recommendationState, dialogue),
    )
  }, [recommendationState, resetRecommendation])

  const resolveLoreBasedCocktail = useCallback((cocktail: CocktailData): RecommendationResult => {
    const dialogue = inferRecommendationDialogueContext(recommendationState, {
      route: 'anecdoteOrPersonOrder',
      routeTags: ['delegated'],
      dialogueState: 'serving',
      affectState: 'confident',
    })
    resetRecommendation()
    return assembleRecommendationResult(
      formatLoreBasedOrderReply(cocktail),
      dialogue.affectState,
      cocktail,
      createRecommendationDecision(cocktail, recommendationState, dialogue),
    )
  }, [recommendationState, resetRecommendation])

  const resolveRecommendation = useCallback(
    (text: string, preference: TastePreference, activeQuestionId: string | null = null): RecommendationResult | null => {
      const explicitCocktail = findCocktailByName(text)
      const isRecommendation =
        !explicitCocktail && (candidatePool !== null || isRecommendationIntent(text))

      if (explicitCocktail) return resolveExplicitCocktail(explicitCocktail)

      if (!isRecommendation) return null

      const tasteSnapshot = ingestTasteSignals(text, preference)
      let nextState = recommendationState
      let acknowledgement: string | null = null
      let finishRecommendation = false
      const activeQuestion = getQuestionById(activeQuestionId)
      if (candidatePool !== null && activeQuestion) {
        const questionInput = classifyRecommendationQuestionInput(text)
        if (questionInput === 'delegate') {
          finishRecommendation = true
        } else {
          nextState = answerLatestQuestion(nextState, text)
          const applied = applyQuestionAnswer(nextState, activeQuestion, text)
          nextState = applied.state
          acknowledgement = questionInput === 'skip'
            ? '그 항목은 비워둘게요. 다른 쪽만 보고 골라볼게요.'
            : applied.acknowledgement
          finishRecommendation = applied.finishRecommendation
        }
      } else {
        nextState = applyRecommendationSignals(nextState, extractRecommendationSignals(text))
      }
      const sourcePool = createRecommendationSourcePool(excludedCocktailIdsRef.current)

      if (sourcePool.exhausted) {
        excludedCocktailIdsRef.current = []
        setExcludedCocktailIds([])
        resetRecommendation()
        return assembleRecommendationResult(
          '모든 칵테일을 이미 추천해 드렸네요. 처음부터 다시 골라볼게요.\n다시 한번 말씀해 주세요.',
          'embarrassed',
          null,
          null,
        )
      }

      const questionCandidates = getQuestionCandidatePool(sourcePool.cocktails, nextState)
      const resolved = resolveCocktailsByRecommendationState(sourcePool.cocktails, nextState)
      const pool = questionCandidates.cocktails
      const combinedTaste = { ...tasteSnapshot, ...nextState.taste }

      if (pool.length === 0) {
        resetRecommendation()
        return assembleRecommendationResult(
          '죄송합니다. 말씀해 주신 조건에 맞는 칵테일은 현재 메뉴에서 찾지 못했어요.',
          'embarrassed',
          null,
          null,
        )
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
        return assembleRecommendationResult(
          formatQuestion(
            nextQuestion,
            questionCandidates.exactMatch
              ? acknowledgement
              : '완전히 맞는 칵테일은 아직 없네요. 가장 가까운 걸 찾을 수 있게 한 가지만 더 여쭤볼게요.',
          ),
          'thinking',
          null,
          null,
          undefined,
          nextQuestion,
        )
      }

      const cocktail = pickFromPool(resolved.cocktails, combinedTaste)
      if (!cocktail) return null
      const decision = createRecommendationDecision(cocktail, nextState)
      const selectedOpening = acknowledgement
        ? null
        : selectRecommendationOpening(decision, recentDialogueLineIds)
      excludeCocktailFromRecommendations(cocktail.id)
      if (selectedOpening) {
        setRecentDialogueLineIds((prev) => [selectedOpening.id, ...prev].slice(0, 4))
      }
      resetRecommendation()

      const exactFormatted = resolved.exactMatch && !acknowledgement
        ? formatExactRecommendationResponse(decision)
        : null
      const nearestFormatted = !resolved.exactMatch
        ? formatNearestRecommendationResponse(decision)
        : null
      const formattedBody = exactFormatted ?? nearestFormatted
      const reply = formattedBody
        ? [acknowledgement ?? selectedOpening?.text, formattedBody.text].filter(Boolean).join('\n')
        : formatRecommendationReply(
            decision,
            acknowledgement ?? selectedOpening?.text,
            resolved.exactMatch ? 'exact' : 'nearest',
          )

      return assembleRecommendationResult(
        reply,
        decision.dialogue.affectState,
        cocktail,
        decision,
        formattedBody?.expression,
      )
    },
    [
      candidatePool,
      recommendationState,
      resetRecommendation,
      excludeCocktailFromRecommendations,
      recentDialogueLineIds,
      resolveExplicitCocktail,
    ],
  )

  return {
    captureExtractedPreferences,
    clearExcludedCocktailIds,
    excludeCocktailFromRecommendations,
    excludedCocktailIds,
    resetRecommendation,
    resolveRandomRecommendation,
    resolveExplicitCocktail,
    resolveLoreBasedCocktail,
    resolveRecommendation,
  }
}

function assembleRecommendationResult(
  text: string,
  tone: ResponseTone,
  cocktail: CocktailData | null,
  decision: RecommendationDecision | null,
  preferredExpression?: Expression,
  pendingQuestion: RecommendationQuestion | null = null,
): RecommendationResult {
  const assembled = assembleResponse({
    text,
    tone,
    preferredExpression,
    character: {
      intent: decision?.dialogue.route ?? 'recommendation-query',
      recommendationExpected: true,
    },
  })
  return {
    reply: assembled.response,
    expression: assembled.expression,
    cocktail,
    decision,
    pendingQuestion,
  }
}
