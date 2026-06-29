import { useCallback, useEffect, useRef, useState } from 'react'
import { getCocktailResponseFromClassified } from '@/lib/bartender/engine.js'
import { IntentClassifier, type DialogueContext } from '@/lib/bartender/intent-classifier.js'
import { createSiestaEvent, MAX_SIESTA_EVENTS_PER_SESSION, SIESTA_EVENT_COOLDOWN_TURNS } from '@/lib/banter/siesta-event.js'
import { addUnknownCocktail } from '@/lib/cocktails/admin-queue-manager.js'
import { cocktails, getCocktailById } from '@/lib/cocktails/database.js'
import { resolveDialogueAction } from '@/lib/dialogue/action-resolver.js'
import {
  createConversationContext,
  getDiscussedCocktailIds,
  getOrderCandidateCocktailId,
  getStoryCocktailId,
  updateConversationContext,
  type ConversationContextEvent,
} from '@/lib/dialogue/conversation-context.js'
import { formatStoryQueryReply } from '@/lib/dialogue/story-query.js'
import { buildDialogueTurn } from '@/lib/dialogue/turn-builder.js'
import {
  formatWelcomeDrinkFeedbackReply,
  formatWelcomeDrinkReply,
  selectWelcomeDrink,
  shouldHandleWelcomeDrinkFeedback,
  WELCOME_DRINK_FEEDBACK_QUESTION,
} from '@/lib/recommendation/welcome-drink.js'
import { formatExplicitCocktailReply } from '@/lib/recommendation/response.js'
import {
  isRecommendationBlockedInPhase,
  isOrderingClosedPhase,
  nextPhaseAfterRoute,
  nextPhaseAfterServedCocktail,
  shouldReturnHomeAfterFarewellTurn,
  shouldServeXyzAfterAlcoholLimit,
  XYZ_COCKTAIL_ID,
} from '@/lib/session/session-flow.js'
import {
  formatFarewellBlockReply,
  formatFarewellConversationReply,
  formatReturnHomeReply,
  formatWelcomeXyzClarificationReply,
  formatXyzReply,
  isEjectionConcern,
} from '@/lib/session/farewell-replies.js'
import type { SessionPhase } from '@/lib/session/session-flow.js'
import { unlockCocktailId } from '@/lib/storage/cocktail-unlocks.js'
import { createTimerRegistry } from '@/lib/timing/timer-registry.js'
import { validateDialogueTurn } from '@/types/dialogue-turn.js'
import type { CocktailData, Expression, Message } from '@/types.js'
import { useGuestPreferenceSession } from './useGuestPreferenceSession.js'
import { useRecommendationSession } from './useRecommendationSession.js'

type InteractionStatus = 'idle' | 'processing' | 'typing' | 'preparing' | 'exiting'
type ServedCocktailMode = 'recommendation' | 'codex'
export type ActionSessionMode = 'conversation' | 'recommendation'
type QueuedInteraction =
  | { type: 'send'; text: string }
  | { type: 'welcome-drink' }
  | { type: 'start-recommendation' }
  | { type: 'order-cocktail'; cocktail: CocktailData }
  | { type: 're-recommend' }
  | { type: 'cancel-recommendation' }

const COCKTAIL_PREPARATION_DELAY_MS = 600
const COCKTAIL_PREPARATION_DURATION_MS = 1800
const TYPING_FALLBACK_BUFFER_MS = 1200
const TYPING_FALLBACK_MAX_TOKEN_MS = 180
const CONVERSATION_RECOMMENDATION_PROMPT_TURN = 12
const SIESTA_EVENTS_ENABLED = false
const intentClassifier = new IntentClassifier(cocktails)

function estimateTypingFallbackDelay(text: string): number {
  return Array.from(text).length * TYPING_FALLBACK_MAX_TOKEN_MS + TYPING_FALLBACK_BUFFER_MS
}

export function useRestationController() {
  const [scene, setScene] = useState<'outside' | 'inside'>('outside')
  const [messages, setMessages] = useState<Message[]>([])
  const [expression, setExpression] = useState<Expression>('idle')
  const [interactionStatus, setInteractionStatus] = useState<InteractionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [servedCocktail, setServedCocktail] = useState<CocktailData | null>(null)
  const [lastServedCocktail, setLastServedCocktail] = useState<CocktailData | null>(null)
  const [servedCocktailMode, setServedCocktailMode] = useState<ServedCocktailMode>('recommendation')
  const [isPreparingCocktail, setIsPreparingCocktail] = useState(false)
  const [welcomeDrinkUsed, setWelcomeDrinkUsed] = useState(false)
  const [welcomeDrinkFeedbackPending, setWelcomeDrinkFeedbackPending] = useState(false)
  const [actionSessionMode, setActionSessionMode] = useState<ActionSessionMode>('conversation')
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('entry')
  const [alcoholStarTotal, setAlcoholStarTotal] = useState(0)
  const [farewellTurnCount, setFarewellTurnCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const timerRegistry = useRef(createTimerRegistry())
  const userMessageCountRef = useRef(0)
  const siestaEventCountRef = useRef(0)
  const siestaCooldownRef = useRef(0)
  const siestaRecentKeysRef = useRef(new Set<string>())
  const conversationTurnCountRef = useRef(0)
  const conversationRecommendationPromptedRef = useRef(false)
  const queuedInteractionsRef = useRef<QueuedInteraction[]>([])
  const queuedInteractionScheduledRef = useRef(false)
  const typingSequenceRef = useRef(0)
  const conversationContextRef = useRef(createConversationContext())

  const {
    preference,
    unlockedIds,
    setUnlockedIds,
    ingestUserMessage,
    resetNight,
  } = useGuestPreferenceSession()
  const {
    activeQuestion,
    clearExcludedCocktailIds,
    resetRecommendation,
    resolveRandomRecommendation,
    resolveExplicitCocktail,
    resolveLoreBasedCocktail,
    resolveRecommendation,
  } = useRecommendationSession()

  const recordConversationContext = useCallback((event: ConversationContextEvent) => {
    conversationContextRef.current = updateConversationContext(conversationContextRef.current, event)
  }, [])

  const clearPendingWork = useCallback(() => {
    timerRegistry.current.clearAll()
    queuedInteractionsRef.current = []
    queuedInteractionScheduledRef.current = false
    typingSequenceRef.current += 1
    setInteractionStatus('idle')
    setScreenShake(false)
    setIsPreparingCocktail(false)
  }, [])

  const enqueueInteraction = useCallback((interaction: QueuedInteraction) => {
    const queue = queuedInteractionsRef.current
    const shouldKeepSingle =
      interaction.type === 'welcome-drink' ||
      interaction.type === 're-recommend' ||
      interaction.type === 'cancel-recommendation'

    if (shouldKeepSingle && queue.some((item) => item.type === interaction.type)) return
    queue.push(interaction)
  }, [])

  const resetSiestaEventSession = useCallback(() => {
    userMessageCountRef.current = 0
    siestaEventCountRef.current = 0
    siestaCooldownRef.current = 0
    siestaRecentKeysRef.current = new Set()
  }, [])

  const resetSessionFlow = useCallback((phase: SessionPhase = 'conversation') => {
    setSessionPhase(phase)
    setAlcoholStarTotal(0)
    setFarewellTurnCount(0)
    setActionSessionMode('conversation')
    conversationTurnCountRef.current = 0
    conversationRecommendationPromptedRef.current = false
    recordConversationContext({ type: 'reset' })
  }, [recordConversationContext])

  useEffect(() => () => timerRegistry.current.clearAll(), [])

  const runCocktailPreparation = useCallback((onPrepared: () => void) => {
    timerRegistry.current.schedule(() => {
      setInteractionStatus('preparing')
      setExpression('smirk')
      setIsPreparingCocktail(true)
      timerRegistry.current.schedule(() => {
        setIsPreparingCocktail(false)
        onPrepared()
      }, COCKTAIL_PREPARATION_DURATION_MS)
    }, COCKTAIL_PREPARATION_DELAY_MS)
  }, [])

  const typingCompleteFnRef = useRef<() => void>(() => {})
  const typingCompletedRef = useRef(false)

  const onTypingComplete = useCallback(() => {
    if (typingCompletedRef.current) return
    typingCompletedRef.current = true
    typingCompleteFnRef.current()
  }, [])

  const bartenderReply = useCallback(
    (
      text: string,
      exp: Expression,
      cocktail?: CocktailData | null,
      finishStatus: InteractionStatus = 'idle',
      afterMessages: Message[] = [],
      afterCocktailRevealed?: () => void,
    ) => {
      const revealCocktail = () => {
        if (!cocktail) return
        timerRegistry.current.schedule(() => {
          setServedCocktailMode('recommendation')
          setServedCocktail(cocktail)
          setLastServedCocktail(cocktail)
          afterCocktailRevealed?.()
        }, 600)
      }

      const showReply = () => {
        typingCompletedRef.current = false
        const typingSequence = typingSequenceRef.current + 1
        typingSequenceRef.current = typingSequence
        setInteractionStatus('typing')
        setExpression('talk')

        typingCompleteFnRef.current = () => {
          setExpression(exp)

          if (afterMessages.length === 0) {
            setInteractionStatus(finishStatus)
            revealCocktail()
            return
          }

          let nextDelay = 450
          afterMessages.forEach((message, index) => {
            nextDelay += message.text.length * 12 + 300
            timerRegistry.current.schedule(() => {
              setMessages((prev) => [...prev, message])
              if (index === afterMessages.length - 1) {
                setInteractionStatus(finishStatus)
                revealCocktail()
              }
            }, nextDelay)
          })
        }

        setMessages((prev) => [...prev, { role: 'bartender', text, speaker: 'karua' }])
        timerRegistry.current.schedule(() => {
          if (typingSequenceRef.current !== typingSequence || typingCompletedRef.current) return
          onTypingComplete()
        }, estimateTypingFallbackDelay(text))
      }

      if (cocktail) {
        runCocktailPreparation(showReply)
        return
      }

      showReply()
    },
    [onTypingComplete, runCocktailPreparation],
  )

  const serveXyzAndEnterFarewell = useCallback(() => {
    const xyzCocktail = getCocktailById(XYZ_COCKTAIL_ID)
    if (!xyzCocktail) {
      setSessionPhase('farewell')
      bartenderReply('마지막 잔 데이터를 찾지 못했어요. 오늘 주문은 여기까지 받을게요.', 'sympathy')
      return
    }

    setSessionPhase('xyz')
    setFarewellTurnCount(0)
    setScreenShake(true)
    timerRegistry.current.schedule(() => setScreenShake(false), 500)
    const ids = unlockCocktailId(xyzCocktail.id)
    setUnlockedIds(ids)
    recordConversationContext({ type: 'served', cocktailId: xyzCocktail.id })
    bartenderReply(
      formatXyzReply(xyzCocktail, { welcomeDrinkUsed }),
      'smirk',
      xyzCocktail,
      'idle',
      [],
      () => setSessionPhase('farewell'),
    )
  }, [bartenderReply, recordConversationContext, setUnlockedIds, welcomeDrinkUsed])

  const moveOutsideAfterDelay = useCallback((delayMs: number) => {
    timerRegistry.current.schedule(() => {
      setScene('outside')
      setMessages([])
      setExpression('idle')
      setInteractionStatus('idle')
      setIsPreparingCocktail(false)
      setSidebarOpen(false)
      setServedCocktail(null)
      setLastServedCocktail(null)
      setServedCocktailMode('recommendation')
      setWelcomeDrinkUsed(false)
      setWelcomeDrinkFeedbackPending(false)
      clearExcludedCocktailIds()
      resetRecommendation()
      resetSessionFlow('entry')
    }, delayMs)
  }, [clearExcludedCocktailIds, resetRecommendation, resetSessionFlow])

  const handleEnter = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    resetSessionFlow('conversation')
    setErrorMessage(null)
    setScene('inside')
    setServedCocktail(null)
    setLastServedCocktail(null)
    setServedCocktailMode('recommendation')
    setWelcomeDrinkUsed(false)
    setWelcomeDrinkFeedbackPending(false)
    setInteractionStatus('typing')
    setExpression('talk')
    typingCompleteFnRef.current = () => {
      setExpression('idle')
      setInteractionStatus('idle')
    }
    setMessages([
      {
        role: 'bartender',
        text: '어서 오세요, Re:Station입니다.\n자유롭게 이야기하다가 한 잔이 필요하면 언제든 말씀해 주세요.',
        speaker: 'karua',
      },
    ])
  }, [clearPendingWork, resetSessionFlow, resetSiestaEventSession])

  const handleExit = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    setErrorMessage(null)
    setInteractionStatus('exiting')
    setSessionPhase('returnHome')
    bartenderReply('들러주셔서 감사합니다. 조심히 가세요.', 'idle', null, 'exiting')
    moveOutsideAfterDelay(2000)
  }, [bartenderReply, clearPendingWork, moveOutsideAfterDelay, resetSiestaEventSession])

  const handleResetNight = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    resetNight()
    resetSessionFlow('conversation')
    setMessages([])
    setExpression('idle')
    setErrorMessage(null)
    setServedCocktail(null)
    setLastServedCocktail(null)
    setServedCocktailMode('recommendation')
    setIsPreparingCocktail(false)
    setWelcomeDrinkUsed(false)
    setWelcomeDrinkFeedbackPending(false)
    clearExcludedCocktailIds()
    resetRecommendation()
    bartenderReply(
      '오늘의 취향 정보를 초기화했어요.\n새로운 밤으로 다시 맞춰볼게요.',
      'idle',
    )
  }, [
    bartenderReply,
    clearExcludedCocktailIds,
    clearPendingWork,
    resetNight,
    resetRecommendation,
    resetSessionFlow,
    resetSiestaEventSession,
  ])

  const performCancelRecommendation = useCallback(() => {
    if (!activeQuestion && !welcomeDrinkFeedbackPending) return false
    if (welcomeDrinkFeedbackPending) {
      setWelcomeDrinkFeedbackPending(false)
      setMessages((prev) => [...prev, { role: 'user', text: '웰컴 드링크 피드백 건너뛰기' }])
      bartenderReply(
        '괜찮아요. 첫 잔은 편하게 두고, 다음 잔이 필요하시면 그때 다시 맞춰볼게요.',
        'idle',
      )
      return true
    }
    resetRecommendation()
    setActionSessionMode('conversation')
    setMessages((prev) => [...prev, { role: 'user', text: '추천 질문 취소' }])
    bartenderReply('추천 질문은 여기서 멈출게요. 다른 게 필요하면 말씀해 주세요.', 'idle')
    return true
  }, [
    activeQuestion,
    bartenderReply,
    resetRecommendation,
    welcomeDrinkFeedbackPending,
  ])

  const handleCancelRecommendation = useCallback(() => {
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 'cancel-recommendation' })
      return
    }
    performCancelRecommendation()
  }, [enqueueInteraction, interactionStatus, performCancelRecommendation])

  const performWelcomeDrink = useCallback(() => {
    if (
      activeQuestion ||
      servedCocktail ||
      welcomeDrinkUsed ||
      welcomeDrinkFeedbackPending ||
      isOrderingClosedPhase(sessionPhase)
    ) return false

    const cocktail = selectWelcomeDrink()
    setErrorMessage(null)
    setWelcomeDrinkUsed(true)
    setWelcomeDrinkFeedbackPending(true)
    setActionSessionMode('conversation')
    setSessionPhase('conversation')
    resetRecommendation()
    setMessages((prev) => [...prev, { role: 'user', text: '웰컴 드링크' }])
    setScreenShake(true)
    timerRegistry.current.schedule(() => setScreenShake(false), 500)
    const ids = unlockCocktailId(cocktail.id)
    setUnlockedIds(ids)
    recordConversationContext({ type: 'served', cocktailId: cocktail.id })
    bartenderReply(formatWelcomeDrinkReply(cocktail, { alcoholStarTotal }), 'smirk', cocktail)
    return true
  }, [
    activeQuestion,
    alcoholStarTotal,
    bartenderReply,
    recordConversationContext,
    resetRecommendation,
    servedCocktail,
    sessionPhase,
    setUnlockedIds,
    welcomeDrinkFeedbackPending,
    welcomeDrinkUsed,
  ])

  const handleWelcomeDrink = useCallback(() => {
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 'welcome-drink' })
      return
    }
    performWelcomeDrink()
  }, [enqueueInteraction, interactionStatus, performWelcomeDrink])

  const performSend = useCallback(
    (text: string, forcedSessionMode?: ActionSessionMode) => {
      setErrorMessage(null)
      setInteractionStatus('processing')
      const userMessage: Message = { role: 'user', text }
      const nextMessages: Message[] = [...messages, userMessage]
      setMessages((prev) => [...prev, userMessage])
      ingestUserMessage(text)
      userMessageCountRef.current += 1

      const effectiveActionSessionMode = forcedSessionMode ?? actionSessionMode
      const recommendationRoutesEnabled =
        effectiveActionSessionMode === 'recommendation' ||
        welcomeDrinkFeedbackPending
      const conversationContext = conversationContextRef.current
      const discussedCocktailIds = getDiscussedCocktailIds(conversationContext)
      const dialogueContext: DialogueContext = {
        lastServedCocktail,
        mentionedCocktails: discussedCocktailIds
          .map((id) => getCocktailById(id))
          .filter((cocktail): cocktail is CocktailData => cocktail !== undefined),
        sessionPhase,
        activeRecommendationSession: effectiveActionSessionMode === 'recommendation' && activeQuestion !== null,
        allowRecommendationRoutes: recommendationRoutesEnabled,
        lastDiscussedCocktailId: getStoryCocktailId(conversationContext) ?? undefined,
        orderCandidateCocktailId: getOrderCandidateCocktailId(conversationContext) ?? undefined,
        welcomeDrinkUsed,
        alcoholStarsTotal: alcoholStarTotal,
        totalUserMessages: userMessageCountRef.current,
        conversationTurnCount: conversationTurnCountRef.current,
      }
      const classifiedIntent = intentClassifier.classify(text, dialogueContext)
      const routeResult = classifiedIntent.route
      const dialogueAction = resolveDialogueAction(classifiedIntent, conversationContext)
      if (dialogueAction.type === 'loreBasedOrder') {
        recordConversationContext({ type: 'order-candidate', cocktailId: dialogueAction.cocktailId })
      }
      if (dialogueAction.type === 'discuss') {
        recordConversationContext({ type: 'discussed', cocktailId: dialogueAction.cocktailId })
      }
      const isConversationFreeTurn = effectiveActionSessionMode === 'conversation' && routeResult.route === 'general'
      let shouldInviteRecommendationFromConversation = false
      if (isConversationFreeTurn) {
        conversationTurnCountRef.current += 1
        shouldInviteRecommendationFromConversation =
          conversationTurnCountRef.current >= CONVERSATION_RECOMMENDATION_PROMPT_TURN &&
          !conversationRecommendationPromptedRef.current
        if (shouldInviteRecommendationFromConversation) {
          conversationRecommendationPromptedRef.current = true
        }
      }

      if (welcomeDrinkFeedbackPending && shouldHandleWelcomeDrinkFeedback(routeResult.route, text)) {
        setWelcomeDrinkFeedbackPending(false)
        const feedback = formatWelcomeDrinkFeedbackReply(text)
        bartenderReply(feedback.text, feedback.expression)
        return
      }
      if (welcomeDrinkFeedbackPending) {
        setWelcomeDrinkFeedbackPending(false)
      }

      const handleInvalidTurn = () => {
        setExpression('idle')
        setInteractionStatus('idle')
        setErrorMessage('죄송합니다. 방금 말은 처리하지 못했어요. 다시 한 번 말씀해 주세요.')
      }

      // --- 안전 처리(Safety route) ---
      if (routeResult.route === 'safety') {
        const turn = buildDialogueTurn(text, 'safety', '', 'sympathy', null, {
          confidence: routeResult.confidence,
        })
        if (!validateDialogueTurn(turn)) return handleInvalidTurn()
        resetRecommendation()
        bartenderReply(turn.reply, turn.expression)
        return
      }

      // --- 세션 마감 처리(Farewell phase) ---
      if (sessionPhase === 'farewell') {
        const nextCount = farewellTurnCount + 1
        setFarewellTurnCount(nextCount)
        if (shouldReturnHomeAfterFarewellTurn({ phase: sessionPhase, farewellTurnCount: nextCount })) {
          resetRecommendation()
          setSessionPhase('returnHome')
          setServedCocktail(null)
          bartenderReply(formatReturnHomeReply(), 'idle', null, 'exiting')
          moveOutsideAfterDelay(1800)
          return
        }
        if (routeResult.route === 'general') {
          resetRecommendation()
          const reply = formatFarewellConversationReply(text)
          bartenderReply(reply.text, reply.expression)
          return
        }
      }

      // --- XYZ 확인 처리(XYZ clarification) ---
      if (routeResult.route === 'general' && lastServedCocktail?.id === XYZ_COCKTAIL_ID && !isOrderingClosedPhase(sessionPhase) && isEjectionConcern(text)) {
        const reply = formatWelcomeXyzClarificationReply()
        bartenderReply(reply.text, reply.expression)
        return
      }

      // --- 퇴장 처리(Exit route) ---
      if (routeResult.route === 'exit') {
        const turn = buildDialogueTurn(text, 'exit', '', 'idle', null, { confidence: routeResult.confidence })
        if (!validateDialogueTurn(turn)) return handleInvalidTurn()
        handleExit()
        return
      }

      // --- 추천 취소 처리(Recommendation cancel) ---
      if (routeResult.route === 'recommendation-cancel') {
        const turn = buildDialogueTurn(text, 'recommendation-cancel', '', 'idle', null, { confidence: routeResult.confidence })
        if (!validateDialogueTurn(turn)) return handleInvalidTurn()
        resetRecommendation()
        setActionSessionMode('conversation')
        bartenderReply(turn.reply, turn.expression)
        return
      }

      // --- 주문 차단 단계 처리(Blocked in ordering-closed phase) ---
      if (isRecommendationBlockedInPhase(sessionPhase, routeResult.route)) {
        resetRecommendation()
        setActionSessionMode('conversation')
        bartenderReply(formatFarewellBlockReply(), 'smirk')
        return
      }

      // --- 이야기/배경 설명 처리(Story and lore query) ---
      if (routeResult.route === 'story-query') {
        const storyCocktailId = dialogueAction.type === 'continueStory'
          ? dialogueAction.cocktailId
          : routeResult.matchedCocktailId ?? null
        const storyCocktail = storyCocktailId
          ? getCocktailById(storyCocktailId) ?? null
          : servedCocktail ?? lastServedCocktail
        if (storyCocktail) recordConversationContext({ type: 'discussed', cocktailId: storyCocktail.id })
        const storyReply = formatStoryQueryReply(storyCocktail)
        const turn = buildDialogueTurn(text, 'story-query', storyReply.text, storyReply.expression, null, {
          confidence: routeResult.confidence,
          entities: storyCocktail ? { cocktailName: storyCocktail.name } : {},
        })
        if (!validateDialogueTurn(turn)) return handleInvalidTurn()
        setSessionPhase(nextPhaseAfterRoute(routeResult.route, sessionPhase))
        bartenderReply(turn.reply, turn.expression)
        return
      }

      // --- 칵테일 유래/이름 배경 질문 처리(Lore query, interrupt-safe) ---
      if (routeResult.route === 'lore-query') {
        const loreCocktailId = dialogueAction.type === 'continueStory'
          ? dialogueAction.cocktailId
          : routeResult.matchedCocktailId ?? null
        const loreCocktail = loreCocktailId ? getCocktailById(loreCocktailId) ?? null : null
        if (loreCocktail) recordConversationContext({ type: 'discussed', cocktailId: loreCocktail.id })
        const loreResponse = getCocktailResponseFromClassified(text, nextMessages, classifiedIntent, loreCocktail)
        const turn = buildDialogueTurn(text, 'lore-query', loreResponse.response, loreResponse.expression, null, {
          confidence: routeResult.confidence,
        })
        if (!validateDialogueTurn(turn)) return handleInvalidTurn()
        setSessionPhase(nextPhaseAfterRoute(routeResult.route, sessionPhase))
        bartenderReply(turn.reply, turn.expression)
        return
      }

      // --- 칵테일 정보/레시피/재료 질문 처리(Cocktail info query, interrupt-safe) ---
      if (routeResult.route === 'cocktail-info-query') {
        const infoCocktailId = dialogueAction.type === 'continueStory'
          ? dialogueAction.cocktailId
          : routeResult.matchedCocktailId ?? null
        const infoCocktail = infoCocktailId ? getCocktailById(infoCocktailId) ?? null : null
        if (infoCocktail) recordConversationContext({ type: 'discussed', cocktailId: infoCocktail.id })
        const infoResponse = getCocktailResponseFromClassified(text, nextMessages, classifiedIntent, infoCocktail)
        const turn = buildDialogueTurn(text, 'cocktail-info-query', infoResponse.response, infoResponse.expression, null, {
          confidence: routeResult.confidence,
        })
        if (!validateDialogueTurn(turn)) return handleInvalidTurn()
        setSessionPhase(nextPhaseAfterRoute(routeResult.route, sessionPhase))
        bartenderReply(turn.reply, turn.expression)
        return
      }

      // --- 캐릭터 질문 처리(Character query, interrupt-safe) ---
      if (routeResult.route === 'character-query') {
        const charResponse = getCocktailResponseFromClassified(text, nextMessages, classifiedIntent)
        const turn = buildDialogueTurn(text, 'character-query', charResponse.response, charResponse.expression, null, {
          confidence: routeResult.confidence,
        })
        if (!validateDialogueTurn(turn)) return handleInvalidTurn()
        setSessionPhase(nextPhaseAfterRoute(routeResult.route, sessionPhase))
        bartenderReply(turn.reply, turn.expression)
        return
      }

      // --- 미등록 칵테일 처리(Unknown cocktail query) ---
      if (routeResult.route === 'unknown-cocktail-query' && routeResult.unknownCocktailName) {
        const unknownReply = `「${routeResult.unknownCocktailName}」이라는 메뉴는 아직 등록하지 않았어요.\n비슷한 맛이나 원하시는 종류를 말씀해 주시면 다른 칵테일을 찾아드릴게요.`
        const turn = buildDialogueTurn(text, 'unknown-cocktail-query', unknownReply, 'thinking', null, {
          confidence: routeResult.confidence,
          entities: { cocktailName: routeResult.unknownCocktailName },
        })
        if (!validateDialogueTurn(turn)) return handleInvalidTurn()
        addUnknownCocktail(routeResult.unknownCocktailName, text)
        setSessionPhase(nextPhaseAfterRoute(routeResult.route, sessionPhase))
        bartenderReply(turn.reply, turn.expression)
        return
      }

      // --- 추천 / 일반 대화 처리(Main recommendation or general dialogue, async) ---
      setExpression('thinking')
      timerRegistry.current.schedule(() => {
        try {
          const actionCocktail = dialogueAction.type === 'order' || dialogueAction.type === 'loreBasedOrder'
            ? getCocktailById(dialogueAction.cocktailId) ?? null
            : null
          const recommendation = dialogueAction.type === 'recommend'
            ? dialogueAction.mode === 'random'
              ? resolveRandomRecommendation()
              : resolveRecommendation(text, preference)
            : dialogueAction.type === 'order' || dialogueAction.type === 'loreBasedOrder'
              ? actionCocktail
                ? dialogueAction.type === 'loreBasedOrder'
                  ? resolveLoreBasedCocktail(actionCocktail)
                  : resolveExplicitCocktail(actionCocktail)
                : null
              : null
          const fallback = getCocktailResponseFromClassified(text, nextMessages, classifiedIntent)
          const reply = shouldInviteRecommendationFromConversation
            ? `${fallback.response}\n슬슬 빈 잔이 심심해 보이네요. 괜찮으면 이제 제가 한 잔 맞춰볼까요?`
            : fallback.response
          const expression = shouldInviteRecommendationFromConversation ? 'smirk' : fallback.expression
          const turn = buildDialogueTurn(text, routeResult.route, reply, expression, recommendation ?? undefined, { confidence: routeResult.confidence })
          if (!validateDialogueTurn(turn)) throw new Error('Invalid dialogue turn')

          const cocktail = recommendation?.cocktail ?? null
          const isXyzCocktail = cocktail?.id === XYZ_COCKTAIL_ID
          const siestaResult = SIESTA_EVENTS_ENABLED
            ? createSiestaEvent({
                inputText: text,
                replyText: turn.reply,
                inputRoute: routeResult.route,
                userMessageCount: userMessageCountRef.current,
                eventCount: siestaEventCountRef.current,
                cooldownTurns: siestaCooldownRef.current,
                recommendationActive: activeQuestion !== null && !cocktail,
                recommendedCocktailName: cocktail?.name,
              }, siestaRecentKeysRef.current)
            : null
          const afterMessages = siestaResult?.messages ?? []
          let afterCocktailRevealed: (() => void) | undefined

          if (cocktail) {
            setActionSessionMode('conversation')
            if (dialogueAction.type === 'recommend') {
              recordConversationContext({ type: 'recommended', cocktailId: cocktail.id })
            }
            recordConversationContext({ type: 'served', cocktailId: cocktail.id })
    setScreenShake(true)
    timerRegistry.current.schedule(() => setScreenShake(false), 500)
    const ids = unlockCocktailId(cocktail.id)
    setUnlockedIds(ids)
            const nextAlcoholStarTotal = isXyzCocktail
              ? alcoholStarTotal
              : alcoholStarTotal + cocktail.taste.alcohol
            if (!isXyzCocktail) setAlcoholStarTotal(nextAlcoholStarTotal)
            if (shouldServeXyzAfterAlcoholLimit({
              current: sessionPhase,
              alcoholStarTotal: nextAlcoholStarTotal,
              isXyz: isXyzCocktail,
            })) {
              setSessionPhase('xyz')
              setFarewellTurnCount(0)
              afterCocktailRevealed = serveXyzAndEnterFarewell
            } else {
              setSessionPhase(nextPhaseAfterServedCocktail({ current: sessionPhase, isXyz: isXyzCocktail }))
            }
          } else {
            setSessionPhase(nextPhaseAfterRoute(routeResult.route, sessionPhase))
          }

          if (siestaResult) {
            siestaEventCountRef.current += 1
            siestaCooldownRef.current = SIESTA_EVENT_COOLDOWN_TURNS
            siestaRecentKeysRef.current.add(siestaResult.key)
            if (siestaRecentKeysRef.current.size >= MAX_SIESTA_EVENTS_PER_SESSION * 3) {
              siestaRecentKeysRef.current = new Set()
            }
          } else if (siestaCooldownRef.current > 0) {
            siestaCooldownRef.current -= 1
          }

          bartenderReply(turn.reply, turn.expression, cocktail, 'idle', afterMessages, afterCocktailRevealed)
        } catch {
          setExpression('idle')
          setInteractionStatus('idle')
          setErrorMessage('죄송합니다. 방금 말은 처리하지 못했어요. 다시 한 번 말씀해 주세요.')
        }
      }, 800 + Math.random() * 600)
    },
    [
      actionSessionMode,
      activeQuestion,
      alcoholStarTotal,
      bartenderReply,
      farewellTurnCount,
      handleExit,
      ingestUserMessage,
      lastServedCocktail,
      messages,
      moveOutsideAfterDelay,
      preference,
      resetRecommendation,
      resolveRandomRecommendation,
      resolveExplicitCocktail,
      resolveLoreBasedCocktail,
      resolveRecommendation,
      recordConversationContext,
      servedCocktail,
      sessionPhase,
      serveXyzAndEnterFarewell,
      setUnlockedIds,
      welcomeDrinkUsed,
      welcomeDrinkFeedbackPending,
    ],
  )

  const handleSend = useCallback((text: string) => {
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 'send', text })
      return
    }
    performSend(text)
  }, [enqueueInteraction, interactionStatus, performSend])

  const performStartRecommendation = useCallback(() => {
    if (actionSessionMode === 'recommendation' && activeQuestion) return true
    if (isOrderingClosedPhase(sessionPhase)) {
      bartenderReply(formatFarewellBlockReply(), 'smirk')
      return true
    }
    setServedCocktail(null)
    setActionSessionMode('recommendation')
    conversationTurnCountRef.current = 0
    conversationRecommendationPromptedRef.current = false
    performSend('추천받기', 'recommendation')
    return true
  }, [actionSessionMode, activeQuestion, bartenderReply, performSend, sessionPhase])

  const handleStartRecommendation = useCallback(() => {
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 'start-recommendation' })
      return
    }
    performStartRecommendation()
  }, [enqueueInteraction, interactionStatus, performStartRecommendation])

  const performOrderCocktail = useCallback((cocktail: CocktailData) => {
    if (isOrderingClosedPhase(sessionPhase)) {
      setServedCocktail(null)
      bartenderReply(formatFarewellBlockReply(), 'smirk')
      return true
    }
    const text = `${cocktail.name} 주세요`
    setErrorMessage(null)
    setInteractionStatus('processing')
    setMessages((prev) => [...prev, { role: 'user', text }])
    ingestUserMessage(text)
    userMessageCountRef.current += 1
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    setActionSessionMode('recommendation')
    setSidebarOpen(false)

    const reply = formatExplicitCocktailReply(cocktail)
    const turn = buildDialogueTurn(text, 'explicit-cocktail', reply, 'smirk', null, {
      confidence: 0.95,
      entities: { cocktailName: cocktail.name },
    })
    if (!validateDialogueTurn(turn)) {
      setExpression('idle')
      setInteractionStatus('idle')
      setErrorMessage('죄송합니다. 방금 주문은 처리하지 못했어요. 다시 한 번 선택해 주세요.')
      return true
    }

    setScreenShake(true)
    timerRegistry.current.schedule(() => setScreenShake(false), 500)
    const ids = unlockCocktailId(cocktail.id)
    setUnlockedIds(ids)
    recordConversationContext({ type: 'served', cocktailId: cocktail.id })
    const isXyzCocktail = cocktail.id === XYZ_COCKTAIL_ID
    const nextAlcoholStarTotal = isXyzCocktail
      ? alcoholStarTotal
      : alcoholStarTotal + cocktail.taste.alcohol
    if (!isXyzCocktail) setAlcoholStarTotal(nextAlcoholStarTotal)

    let afterCocktailRevealed: (() => void) | undefined
    if (shouldServeXyzAfterAlcoholLimit({
      current: sessionPhase,
      alcoholStarTotal: nextAlcoholStarTotal,
      isXyz: isXyzCocktail,
    })) {
      setSessionPhase('xyz')
      setFarewellTurnCount(0)
      afterCocktailRevealed = serveXyzAndEnterFarewell
    } else {
      setSessionPhase(nextPhaseAfterServedCocktail({ current: sessionPhase, isXyz: isXyzCocktail }))
    }

    bartenderReply(turn.reply, turn.expression, cocktail, 'idle', [], afterCocktailRevealed)
    return true
  }, [
    alcoholStarTotal,
    bartenderReply,
    ingestUserMessage,
    recordConversationContext,
    serveXyzAndEnterFarewell,
    sessionPhase,
    setUnlockedIds,
  ])

  const handleOrderCocktail = useCallback((cocktail: CocktailData) => {
    setSidebarOpen(false)
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 'order-cocktail', cocktail })
      return
    }
    performOrderCocktail(cocktail)
  }, [enqueueInteraction, interactionStatus, performOrderCocktail])

  const handleViewCocktail = useCallback((cocktail: CocktailData) => {
    setServedCocktailMode('codex')
    setServedCocktail(cocktail)
    setSidebarOpen(false)
    recordConversationContext({ type: 'discussed', cocktailId: cocktail.id })
  }, [recordConversationContext])

  const performReRecommend = useCallback(() => {
    if (isOrderingClosedPhase(sessionPhase)) {
      setServedCocktail(null)
      bartenderReply(formatFarewellBlockReply(), 'smirk')
      return true
    }
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    setActionSessionMode('recommendation')
    performSend('다른 걸로 추천해줘', 'recommendation')
    return true
  }, [bartenderReply, performSend, sessionPhase])

  const handleReRecommend = useCallback(() => {
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 're-recommend' })
      return
    }
    performReRecommend()
  }, [enqueueInteraction, interactionStatus, performReRecommend])

  const runQueuedInteraction = useCallback((interaction: QueuedInteraction): boolean => {
    switch (interaction.type) {
      case 'send':
        performSend(interaction.text)
        return true
      case 'welcome-drink':
        return performWelcomeDrink()
      case 'start-recommendation':
        return performStartRecommendation()
      case 'order-cocktail':
        return performOrderCocktail(interaction.cocktail)
      case 're-recommend':
        return performReRecommend()
      case 'cancel-recommendation':
        return performCancelRecommendation()
    }
  }, [
    performCancelRecommendation,
    performOrderCocktail,
    performReRecommend,
    performSend,
    performStartRecommendation,
    performWelcomeDrink,
  ])

  const drainQueuedInteractions = useCallback(() => {
    if (interactionStatus !== 'idle' || queuedInteractionScheduledRef.current) return

    const runNextQueuedInteraction = () => {
      if (interactionStatus !== 'idle' || queuedInteractionScheduledRef.current) return

      const nextInteraction = queuedInteractionsRef.current.shift()
      if (!nextInteraction) return

      queuedInteractionScheduledRef.current = true
      timerRegistry.current.schedule(() => {
        queuedInteractionScheduledRef.current = false
        const accepted = runQueuedInteraction(nextInteraction)
        if (!accepted) runNextQueuedInteraction()
      }, 0)
    }

    runNextQueuedInteraction()
  }, [interactionStatus, runQueuedInteraction])

  useEffect(() => {
    drainQueuedInteractions()
  }, [drainQueuedInteractions])

  const canReRecommend = !isOrderingClosedPhase(sessionPhase)

  return {
    scene,
    messages,
    expression,
    isBartenderTyping: interactionStatus === 'typing',
    isProcessing: interactionStatus !== 'idle',
    isPreparingCocktail,
    activeQuestion: welcomeDrinkFeedbackPending ? WELCOME_DRINK_FEEDBACK_QUESTION : activeQuestion,
    actionSessionMode,
    errorMessage,
    servedCocktail,
    lastServedCocktail,
    servedCocktailMode,
    sidebarOpen,
    screenShake,
    unlockedIds,
    canReRecommend,
    handleEnter,
    handleExit,
    handleOrderCocktail,
    handleReRecommend,
    handleResetNight,
    handleCancelRecommendation,
    handleViewCocktail,
    handleWelcomeDrink,
    handleStartRecommendation,
    handleSend,
    onTypingComplete,
    welcomeDrinkAvailable:
      !welcomeDrinkUsed &&
      !welcomeDrinkFeedbackPending &&
      activeQuestion === null &&
      servedCocktail === null &&
      !isOrderingClosedPhase(sessionPhase),
    setServedCocktail,
    setSidebarOpen,
  }
}
