import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { SfxChannel } from './useSfxManager.js'
import { createSiestaEvent, MAX_SIESTA_EVENTS_PER_SESSION, SIESTA_EVENT_COOLDOWN_TURNS } from '@/lib/banter/siesta-event.js'
import { addUnknownCocktail } from '@/lib/cocktails/admin-queue-manager.js'
import { cocktails, getCocktailById } from '@/lib/cocktails/index.js'
import {
  createConversationContext,
  updateConversationContext,
  type ConversationContextEvent,
} from '@/lib/dialogue/conversation-context.js'
import { executeDialogueAction } from '@/lib/dialogue/action-executor.js'
import {
  compatibleControlTransitions,
  compatibleTopicTransition,
} from '@/lib/dialogue/decision-shadow.js'
import { getFeedbackExcludedCocktailId } from '@/lib/recommendation/feedback-exclusion.js'
import { DialogueService, type DialogueResolution } from '@/lib/dialogue/dialogue-service.js'
import {
  appendRecommendationResume,
  classifyRecommendationInterruption,
} from '@/lib/dialogue/conversation-expansion.js'
import {
  formatWelcomeDrinkFeedbackReply,
  shouldHandleWelcomeDrinkFeedback,
  WELCOME_DRINK_FEEDBACK_QUESTION,
} from '@/lib/recommendation/welcome-drink.js'
import {
  createDialogueSessionState,
  dialogueSessionReducer,
  isActiveSessionInput,
  isWelcomeDrinkFeedbackPending,
  sessionTopicForRoute,
} from '@/lib/session/dialogue-session.js'
import { transitionSessionAffect } from '@/lib/session/session-affect.js'
import {
  classifyRecommendationQuestionInput,
  createPendingRecommendationQuestion,
  explainRecommendationQuestion,
  isCurrentRecommendationChoice,
  preservesPendingRecommendationQuestion,
  type RecommendationChoiceInput,
} from '@/lib/recommendation/question-context.js'
import { getQuestionById } from '@/lib/recommendation/question-engine.js'
import {
  isOrderingClosedPhase,
  nextPhaseAfterRoute,
  XYZ_COCKTAIL_ID,
} from '@/lib/session/session-flow.js'
import {
  formatFarewellBlockResponse,
  formatFarewellConversationReply,
  formatReturnHomeResponse,
  formatWelcomeXyzClarificationReply,
  isEjectionConcern,
} from '@/lib/session/farewell-replies.js'
import type { SessionPhase } from '@/lib/session/session-flow.js'
import { unlockCocktailId } from '@/lib/storage/cocktail-unlocks.js'
import { createTimerRegistry } from '@/lib/timing/timer-registry.js'
import type { CocktailData, Message } from '@/types.js'
import { useGuestPreferenceSession } from './useGuestPreferenceSession.js'
import { useRecommendationSession } from './useRecommendationSession.js'
import { useRapportSession } from './useRapportSession.js'
import { createRestationDialogueRequest } from './restation-dialogue-request.js'
import { createRestationInteractionQueue } from './restation-interaction-queue.js'
import { runRestationInteraction } from './restation-interaction-runner.js'
import { createRestationServingDecision } from './restation-serving-decision.js'
import { useRestationPresentation } from './useRestationPresentation.js'
import { useRestationFarewell } from './useRestationFarewell.js'
import { useRestationWelcomeDrink } from './useRestationWelcomeDrink.js'
import {
  CONVERSATION_RECOMMENDATION_PROMPT_TURN,
  SIESTA_EVENTS_ENABLED,
  mapIntentToRapportContext,
  type ActionSessionMode,
  type QueuedInteraction,
} from './restation-controller-model.js'

const dialogueService = new DialogueService(cocktails)

export type { ActionSessionMode } from './restation-controller-model.js'

export function useRestationController(sfx?: SfxChannel) {
  const [scene, setScene] = useState<'outside' | 'inside'>('outside')
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dialogueSession, dispatchDialogueSession] = useReducer(
    dialogueSessionReducer,
    undefined,
    () => createDialogueSessionState(),
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const timerRegistry = useRef(createTimerRegistry())
  const appendMessage = useCallback((message: Message) => {
    setMessages((previous) => [...previous, message])
  }, [])
  const {
    expression,
    setExpression,
    interactionStatus,
    setInteractionStatus,
    servedCocktail,
    setServedCocktail,
    servedCocktailMode,
    setServedCocktailMode,
    karuaPresentationAction,
    cancelPresentation,
    bartenderReply,
    onTypingComplete,
    invalidateTyping,
    setTypingCompleteHandler,
  } = useRestationPresentation({
    sfx,
    timerRegistry,
    appendMessage,
  })
  const userMessageCountRef = useRef(0)
  const siestaEventCountRef = useRef(0)
  const siestaCooldownRef = useRef(0)
  const siestaRecentKeysRef = useRef(new Set<string>())
  const interactionQueueRef = useRef(createRestationInteractionQueue())
  const recommendationSessionSequenceRef = useRef(0)
  const sfxRef = useRef<SfxChannel | undefined>(sfx)
  const [conversationContext, dispatchConversationContext] = useReducer(
    updateConversationContext,
    undefined,
    createConversationContext,
  )

  useEffect(() => {
    sfxRef.current = sfx
  }, [sfx])

  const actionSessionMode = dialogueSession.mode
  const sessionPhase = dialogueSession.phase
  const alcoholStarTotal = dialogueSession.order.alcoholStarTotal
  const welcomeDrinkServed = dialogueSession.welcomeDrink.served
  const welcomeDrinkFeedbackPending = isWelcomeDrinkFeedbackPending(dialogueSession)
  const lastServedCocktail = conversationContext.lastServedCocktailId
    ? getCocktailById(conversationContext.lastServedCocktailId) ?? null
    : null

  const {
    preference,
    unlockedIds,
    setUnlockedIds,
    ingestUserMessage,
    resetNight,
  } = useGuestPreferenceSession()
  const {
    captureExtractedPreferences,
    clearExcludedCocktailIds,
    excludeCocktailFromRecommendations,
    resetRecommendation,
    resolveRandomRecommendation,
    resolveExplicitCocktail,
    resolveLoreBasedCocktail,
    resolveRecommendation,
  } = useRecommendationSession()
  const activeQuestion = getQuestionById(dialogueSession.pendingQuestion?.questionId ?? null)
  const { rapport, resetRapport, applyRapportUpdate } = useRapportSession()

  const recordConversationContext = useCallback((event: ConversationContextEvent) => {
    dispatchConversationContext(event)
  }, [])

  const recordConversationEvents = useCallback((events: ConversationContextEvent[]) => {
    for (const event of events) {
      recordConversationContext(event)
    }
  }, [recordConversationContext])

  const clearPendingWork = useCallback(() => {
    timerRegistry.current.clearAll()
    interactionQueueRef.current.clear()
    invalidateTyping()
    setInteractionStatus('idle')
    setScreenShake(false)
    cancelPresentation()
    sfxRef.current?.stopAll()
  }, [cancelPresentation, invalidateTyping, setInteractionStatus])

  const playScreenShakeCue = useCallback(() => {
    setScreenShake(true)
    timerRegistry.current.schedule(() => setScreenShake(false), 500)
  }, [])

  const enqueueInteraction = useCallback((interaction: QueuedInteraction) => {
    interactionQueueRef.current.enqueue(interaction)
  }, [])

  const resetSiestaEventSession = useCallback(() => {
    userMessageCountRef.current = 0
    siestaEventCountRef.current = 0
    siestaCooldownRef.current = 0
    siestaRecentKeysRef.current = new Set()
  }, [])

  const resetSessionFlow = useCallback((phase: SessionPhase = 'conversation') => {
    dispatchDialogueSession({ type: 'reset', phase })
    recordConversationContext({ type: 'reset' })
  }, [recordConversationContext])

  useEffect(() => () => {
    timerRegistry.current.clearAll()
    sfxRef.current?.stopAll()
  }, [])

  const { beginFarewell } = useRestationFarewell({
    bartenderReply,
    dispatchDialogueSession,
    playScreenShakeCue,
    recordConversationEvents,
    resetRecommendation,
    setServedCocktail,
    setUnlockedIds,
  })

  const moveOutsideAfterDelay = useCallback((delayMs: number) => {
    timerRegistry.current.schedule(() => {
      setScene('outside')
      setMessages([])
      setExpression('idle')
      setInteractionStatus('idle')
      cancelPresentation()
      setSidebarOpen(false)
      setServedCocktail(null)
      setServedCocktailMode('recommendation')
      clearExcludedCocktailIds()
      resetRecommendation()
      resetSessionFlow('entry')
    }, delayMs)
  }, [
    clearExcludedCocktailIds,
    resetRecommendation,
    resetSessionFlow,
    setExpression,
    setInteractionStatus,
    cancelPresentation,
    setServedCocktail,
    setServedCocktailMode,
  ])

  const handleEnter = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    resetSessionFlow('conversation')
    resetRapport()
    setErrorMessage(null)
    setScene('inside')
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    setInteractionStatus('typing')
    setExpression('idle')
    setTypingCompleteHandler(() => {
      setExpression('idle')
      setInteractionStatus('idle')
    })
    setMessages([
      {
        role: 'bartender',
        text: '어서 오세요, Re:Station입니다.\n자유롭게 이야기하다가 한 잔이 필요하면 언제든 말씀해 주세요.',
        speaker: 'karua',
      },
    ])
  }, [
    clearPendingWork,
    resetRapport,
    resetSessionFlow,
    resetSiestaEventSession,
    setExpression,
    setInteractionStatus,
    setServedCocktail,
    setServedCocktailMode,
    setTypingCompleteHandler,
  ])

  const handleExit = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    setErrorMessage(null)
    if (dialogueSession.safetyLocked) {
      setInteractionStatus('exiting')
      moveOutsideAfterDelay(0)
      return
    }
    if (
      dialogueSession.phase === 'xyz'
      || dialogueSession.phase === 'farewell'
      || dialogueSession.phase === 'returnHome'
    ) {
      setInteractionStatus('exiting')
      dispatchDialogueSession({ type: 'set-phase', phase: 'returnHome' })
      const reply = formatReturnHomeResponse()
      bartenderReply(reply.text, reply.expression, null, 'exiting')
      moveOutsideAfterDelay(2000)
      return
    }
    beginFarewell(dialogueSession, 'exit')
  }, [
    bartenderReply,
    beginFarewell,
    clearPendingWork,
    dialogueSession,
    moveOutsideAfterDelay,
    resetSiestaEventSession,
    setInteractionStatus,
  ])

  const handleResetNight = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    resetNight()
    resetSessionFlow('conversation')
    resetRapport()
    setMessages([])
    setExpression('idle')
    setErrorMessage(null)
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    cancelPresentation()
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
    resetRapport,
    resetSessionFlow,
    resetSiestaEventSession,
    setExpression,
    cancelPresentation,
    setServedCocktail,
    setServedCocktailMode,
  ])

  const performCancelRecommendation = useCallback(() => {
    if (!activeQuestion && !welcomeDrinkFeedbackPending) return false
    if (welcomeDrinkFeedbackPending) {
      dispatchDialogueSession({ type: 'welcome-resolved' })
      setMessages((prev) => [...prev, { role: 'user', text: '웰컴 드링크 피드백 건너뛰기' }])
      bartenderReply(
        '괜찮아요. 첫 잔은 편하게 두고, 다음 잔이 필요하시면 그때 다시 맞춰볼게요.',
        'idle',
      )
      return true
    }
    sfx?.stop('shake')
    resetRecommendation()
    dispatchDialogueSession({ type: 'set-mode', mode: 'conversation' })
    setMessages((prev) => [...prev, { role: 'user', text: '추천 질문 취소' }])
    bartenderReply('추천 질문은 여기서 멈출게요. 다른 게 필요하면 말씀해 주세요.', 'idle')
    return true
  }, [
    activeQuestion,
    bartenderReply,
    resetRecommendation,
    sfx,
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

  const { performWelcomeDrink, handleWelcomeDrink } = useRestationWelcomeDrink({
    recommendationActive: activeQuestion !== null,
    servedCocktail,
    welcomeDrinkServed,
    welcomeDrinkFeedbackPending,
    sessionPhase,
    alcoholStarTotal,
    interactionStatus,
    appendMessage,
    bartenderReply,
    dispatchDialogueSession,
    enqueueInteraction,
    playScreenShakeCue,
    recordConversationEvents,
    resetRecommendation,
    setErrorMessage,
    setUnlockedIds,
  })

  const resolveDialogueInput = useCallback((
    text: string,
    nextMessages: Message[],
    forcedSessionMode?: ActionSessionMode,
    inputKind: 'text' | 'recommendation-answer' = 'text',
  ) => {
    const effectiveSessionMode = forcedSessionMode ?? actionSessionMode
    return dialogueService.resolve(createRestationDialogueRequest({
      text,
      inputKind,
      messages: nextMessages,
      conversationContext,
      dialogueSession,
      effectiveSessionMode,
      activeQuestion,
      welcomeDrinkFeedbackPending,
      welcomeDrinkServed,
      alcoholStarTotal,
      totalUserMessages: userMessageCountRef.current,
      displayedCocktail: servedCocktail,
    }))
  }, [
    actionSessionMode,
    activeQuestion,
    alcoholStarTotal,
    conversationContext,
    dialogueSession,
    servedCocktail,
    welcomeDrinkFeedbackPending,
    welcomeDrinkServed,
  ])

  const executeAction = useCallback((
    action: DialogueResolution['action'],
    text: string,
    secretPassphrase?: string,
  ) => executeDialogueAction({ action, text, secretPassphrase }, {
    getCocktail: (cocktailId) => getCocktailById(cocktailId) ?? null,
    recommendByPreference: (input) => resolveRecommendation(
      input,
      preference,
      dialogueSession.pendingQuestion?.questionId ?? null,
    ),
    recommendRandom: resolveRandomRecommendation,
    orderExplicit: resolveExplicitCocktail,
    orderByLore: resolveLoreBasedCocktail,
  }), [
    preference,
    dialogueSession.pendingQuestion?.questionId,
    resolveExplicitCocktail,
    resolveLoreBasedCocktail,
    resolveRandomRecommendation,
    resolveRecommendation,
  ])

  const performSend = useCallback(
    (
      text: string,
      forcedSessionMode?: ActionSessionMode,
      options: {
        inputKind?: 'text' | 'recommendation-answer'
        switchSessionId?: string
      } = {},
    ) => {
      setErrorMessage(null)
      setInteractionStatus('processing')
      const userMessage: Message = { role: 'user', text }
      const nextMessages: Message[] = [...messages, userMessage]
      setMessages((prev) => [...prev, userMessage])
      ingestUserMessage(text)
      userMessageCountRef.current += 1

      const effectiveActionSessionMode = forcedSessionMode ?? actionSessionMode
      const interruption = activeQuestion
        ? classifyRecommendationInterruption(text, activeQuestion)
        : null
      const dialogueResolution = resolveDialogueInput(
        text,
        nextMessages,
        interruption ? 'conversation' : forcedSessionMode,
        options.inputKind,
      )
      const { routeResult, action: dialogueAction, classifiedIntent } = dialogueResolution
      const nextTopic = interruption?.topic ?? sessionTopicForRoute(routeResult.route)
      const recommendationQuestionInput = activeQuestion
        ? classifyRecommendationQuestionInput(text)
        : null
      if (!options.switchSessionId && !dialogueResolution.blockedBySession) {
        const topicTransition = interruption
          ? null
          : compatibleTopicTransition(dialogueResolution.move, dialogueResolution.understanding)
        dispatchDialogueSession(topicTransition ?? {
          type: 'set-topic', topic: nextTopic, cocktailId: routeResult.matchedCocktailId ?? null,
        })
      }
      if (!options.switchSessionId) {
        if (interruption) {
          captureExtractedPreferences(text)
          dispatchDialogueSession({ type: 'suspend-question', topic: interruption.topic })
        } else {
          dispatchDialogueSession({ type: 'resume-question' })
        }
        if (!interruption && !preservesPendingRecommendationQuestion(recommendationQuestionInput)) {
          dispatchDialogueSession({ type: 'set-pending-question', question: null })
        }
      }
      dispatchDialogueSession({
        type: 'set-session-affect',
        affect: transitionSessionAffect(dialogueSession, {
          candidate: classifiedIntent.metadata.keywordAffect,
          route: routeResult.route,
          input: text,
        }),
      })
      const handlesWelcomeFeedback = welcomeDrinkFeedbackPending
        && shouldHandleWelcomeDrinkFeedback(routeResult.route, text)
      const welcomeFeedback = handlesWelcomeFeedback
        ? formatWelcomeDrinkFeedbackReply(text)
        : null
      const rapportContext = welcomeFeedback
        ? (welcomeFeedback.expression === 'smirk' ? 'welcome-positive' : 'negative-feedback')
        : (dialogueResolution.reaction?.type ?? mapIntentToRapportContext(classifiedIntent.intent))
      const deferRapportUntilServe = rapportContext === 'cocktail-order'
        || routeResult.secretPassphrase !== undefined
      if (!deferRapportUntilServe) applyRapportUpdate(rapportContext)
      const isConversationFreeTurn = effectiveActionSessionMode === 'conversation'
        && routeResult.route === 'general'
        && dialogueResolution.move.speechAct !== 'answer'
      let shouldInviteRecommendationFromConversation = false
      if (isConversationFreeTurn) {
        const nextConversationTurnCount = dialogueSession.dialogue.turnCount + 1
        shouldInviteRecommendationFromConversation =
          nextConversationTurnCount >= CONVERSATION_RECOMMENDATION_PROMPT_TURN &&
          !dialogueSession.dialogue.recommendationPrompted
        dispatchDialogueSession({
          type: 'record-conversation-turn',
          recommendationPrompted: shouldInviteRecommendationFromConversation,
        })
      }

      if (welcomeDrinkFeedbackPending && handlesWelcomeFeedback) {
        dispatchDialogueSession({ type: 'welcome-resolved' })
        const feedback = welcomeFeedback ?? formatWelcomeDrinkFeedbackReply(text)
        bartenderReply(feedback.text, feedback.expression)
        return
      }
      if (welcomeDrinkFeedbackPending) {
        dispatchDialogueSession({ type: 'welcome-resolved' })
      }

      const handleInvalidTurn = () => {
        setExpression('idle')
        setInteractionStatus('idle')
        setErrorMessage('죄송합니다. 방금 말은 처리하지 못했어요. 다시 한 번 말씀해 주세요.')
      }

      // --- 안전 처리(Safety route) ---
      if (routeResult.route === 'safety') {
        const directResponse = dialogueResolution.directResponse
        if (!directResponse) return handleInvalidTurn()
        clearPendingWork()
        resetRecommendation()
        const transitions = compatibleControlTransitions(routeResult.route, dialogueResolution.move)
          ?? [{ type: 'lock-safety' } as const]
        transitions.forEach(dispatchDialogueSession)
        setServedCocktail(null)
        setSidebarOpen(false)
        bartenderReply(directResponse.turn.reply, directResponse.turn.expression, null, 'exiting')
        return
      }

      if (activeQuestion && routeResult.route === 'recommendation') {
        if (recommendationQuestionInput === 'help') {
          bartenderReply(explainRecommendationQuestion(activeQuestion), 'thinking')
          return
        }
        if (recommendationQuestionInput === 'repeat') {
          bartenderReply(activeQuestion.prompt, 'thinking')
          return
        }
      }

      if (interruption?.contractReply && activeQuestion) {
        bartenderReply(
          appendRecommendationResume(interruption.contractReply, activeQuestion),
          interruption.topic === 'worldview' ? 'smirk' : 'thinking',
        )
        return
      }

      // --- 세션 마감 처리(Farewell phase) ---
      if (sessionPhase === 'farewell') {
        dispatchDialogueSession({ type: 'increment-farewell-turn' })
        if (routeResult.route === 'exit') {
          resetRecommendation()
          dispatchDialogueSession({ type: 'set-phase', phase: 'returnHome' })
          setServedCocktail(null)
          const reply = formatReturnHomeResponse()
          bartenderReply(reply.text, reply.expression, null, 'exiting')
          moveOutsideAfterDelay(1800)
          return
        }
        if (routeResult.route === 'general') {
          resetRecommendation()
          const hasXyz = dialogueSession.farewell.entryKind === 'alcohol-xyz'
            || dialogueSession.farewell.entryKind === 'welcome-farewell-xyz'
          const reply = formatFarewellConversationReply(text, { hasXyz })
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
        if (!dialogueResolution.directResponse) return handleInvalidTurn()
        beginFarewell(dialogueSession, 'exit')
        return
      }

      // --- 추천 취소 처리(Recommendation cancel) ---
      if (routeResult.route === 'recommendation-cancel') {
        const directResponse = dialogueResolution.directResponse
        if (!directResponse) return handleInvalidTurn()
        resetRecommendation()
        const transitions = compatibleControlTransitions(routeResult.route, dialogueResolution.move)
          ?? [{ type: 'set-mode', mode: 'conversation' } as const]
        transitions.forEach(dispatchDialogueSession)
        bartenderReply(directResponse.turn.reply, directResponse.turn.expression)
        return
      }

      // --- 주문 차단 단계 처리(Blocked in ordering-closed phase) ---
      if (dialogueResolution.blockedBySession) {
        resetRecommendation()
        dispatchDialogueSession({ type: 'set-mode', mode: 'conversation' })
        const reply = formatFarewellBlockResponse()
        bartenderReply(reply.text, reply.expression)
        return
      }

      const feedbackExcludedCocktailId = getFeedbackExcludedCocktailId(
        dialogueResolution.reaction,
        conversationContext,
      )
      if (feedbackExcludedCocktailId) {
        excludeCocktailFromRecommendations(feedbackExcludedCocktailId)
      }

      recordConversationEvents(dialogueResolution.contextEvents)

      // --- 서비스에서 확정된 직접 응답 처리 ---
      const directResponse = dialogueResolution.directResponse
      if (directResponse) {
        recordConversationEvents(directResponse.contextEvents)
        if (directResponse.kind === 'unknown-cocktail' && directResponse.unknownCocktailName) {
          addUnknownCocktail(directResponse.unknownCocktailName, text)
        }
        if (directResponse.kind !== 'lore-followup') {
          dispatchDialogueSession({
            type: 'set-phase',
            phase: nextPhaseAfterRoute(routeResult.route, sessionPhase),
          })
        }
        bartenderReply(
          interruption && activeQuestion
            ? appendRecommendationResume(directResponse.turn.reply, activeQuestion)
            : directResponse.turn.reply,
          directResponse.turn.expression,
        )
        return
      }

      // --- 추천 / 일반 대화 처리(Main recommendation or general dialogue, async) ---
      setExpression('thinking')
      timerRegistry.current.schedule(() => {
        try {
          const execution = executeAction(
            dialogueAction,
            text,
            routeResult.secretPassphrase,
          )
          const recommendation = execution.status === 'completed'
            ? execution.outcome
            : null
          if (recommendation?.pendingQuestion) {
            const question = createPendingRecommendationQuestion(
              recommendation.pendingQuestion,
              dialogueSession.dialogue.turnCount,
              options.switchSessionId ?? dialogueSession.activeSessionId,
            )
            dispatchDialogueSession(options.switchSessionId
              ? { type: 'switch-to-recommendation', sessionId: options.switchSessionId, question }
              : { type: 'set-pending-question', question })
          }
          const turn = dialogueService.buildMainTurn(
            { text, messages: nextMessages },
            dialogueResolution,
            {
              outcome: recommendation,
              inviteRecommendation: shouldInviteRecommendationFromConversation,
              sessionAffect: dialogueSession.sessionAffect,
            },
          )
          if (!turn) throw new Error('Invalid dialogue turn')

          const servingEffect = execution.status === 'completed' && execution.effect.type === 'serve'
            ? execution.effect
            : null
          const cocktail = servingEffect?.cocktail ?? null
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
            if (routeResult.secretPassphrase !== undefined) {
              applyRapportUpdate('secret-event-success')
            } else if (deferRapportUntilServe) {
              applyRapportUpdate('cocktail-order')
            }
            const servingDecision = createRestationServingDecision({
              cocktail,
              currentPhase: sessionPhase,
              alcoholStarTotal,
              dialogueSession,
            })
            const servingPlan = servingDecision.plan
            dispatchDialogueSession({ type: 'cocktail-served', cocktailId: cocktail.id })
            const servingEvents = dialogueService.buildServingContextEvents(cocktail, {
              reply: turn.reply,
              recommended: servingEffect?.recommended ?? false,
            })
            afterCocktailRevealed = () => recordConversationEvents(servingEvents)
            sfx?.play('serve')
            playScreenShakeCue()
            const ids = unlockCocktailId(cocktail.id)
            setUnlockedIds(ids)
            if (servingPlan.shouldUpdateAlcoholTotal) {
              dispatchDialogueSession({ type: 'set-alcohol-total', total: servingPlan.nextAlcoholStarTotal })
            }
            if (servingPlan.requiresFarewell) {
              const entryKind = servingDecision.farewellEntryKind
              if (!entryKind) return
              dispatchDialogueSession({
                type: 'set-phase',
                phase: servingDecision.nextPhase,
              })
              afterCocktailRevealed = () => {
                recordConversationEvents(servingEvents)
                beginFarewell(dialogueSession, 'alcohol-limit')
              }
            } else {
              dispatchDialogueSession({
                type: 'set-phase',
                phase: servingDecision.nextPhase,
              })
            }
          } else {
            dispatchDialogueSession({ type: 'set-phase', phase: nextPhaseAfterRoute(routeResult.route, sessionPhase) })
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

          bartenderReply(
            interruption && activeQuestion
              ? appendRecommendationResume(turn.reply, activeQuestion)
              : turn.reply,
            turn.expression,
            cocktail,
            'idle',
            afterMessages,
            afterCocktailRevealed,
          )
        } catch {
          sfx?.stopAll()
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
      applyRapportUpdate,
      bartenderReply,
      beginFarewell,
      clearPendingWork,
      captureExtractedPreferences,
      conversationContext,
      dialogueSession,
      excludeCocktailFromRecommendations,
      executeAction,
      ingestUserMessage,
      lastServedCocktail,
      messages,
      moveOutsideAfterDelay,
      playScreenShakeCue,
      resetRecommendation,
      resolveDialogueInput,
      recordConversationEvents,
      sessionPhase,
      setExpression,
      setInteractionStatus,
      setServedCocktail,
      setUnlockedIds,
      sfx,
      welcomeDrinkFeedbackPending,
    ],
  )

  const handleSend = useCallback((text: string) => {
    if (dialogueSession.safetyLocked) return
    if (dialogueService.isSafetyConcern(text)) {
      performSend(text)
      return
    }
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 'send', text })
      return
    }
    performSend(text)
  }, [dialogueSession.safetyLocked, enqueueInteraction, interactionStatus, performSend])

  const performRecommendationAnswer = useCallback((input: RecommendationChoiceInput) => {
    if (!isCurrentRecommendationChoice(input, dialogueSession)) {
      setErrorMessage('이미 지난 선택지예요. 현재 질문에서 다시 골라주세요.')
      return false
    }
    performSend(input.answerValue, 'recommendation', { inputKind: 'recommendation-answer' })
    return true
  }, [dialogueSession, performSend])

  const handleRecommendationAnswer = useCallback((input: RecommendationChoiceInput) => {
    if (dialogueSession.safetyLocked || interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 'recommendation-answer', input })
      return
    }
    performRecommendationAnswer(input)
  }, [dialogueSession.safetyLocked, enqueueInteraction, interactionStatus, performRecommendationAnswer])

  const performStartRecommendation = useCallback(() => {
    if (actionSessionMode === 'recommendation' && activeQuestion) return true
    if (isOrderingClosedPhase(sessionPhase)) {
      const reply = formatFarewellBlockResponse()
      bartenderReply(reply.text, reply.expression)
      return true
    }
    setServedCocktail(null)
    recommendationSessionSequenceRef.current += 1
    const sessionId = `recommendation-${recommendationSessionSequenceRef.current}`
    performSend('추천받기', 'recommendation', { switchSessionId: sessionId })
    return true
  }, [
    actionSessionMode,
    activeQuestion,
    bartenderReply,
    performSend,
    sessionPhase,
    setServedCocktail,
  ])

  const handleStartRecommendation = useCallback(() => {
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 'start-recommendation' })
      return
    }
    performStartRecommendation()
  }, [enqueueInteraction, interactionStatus, performStartRecommendation])

  const performOrderCocktail = useCallback((cocktail: CocktailData) => {
    const text = `${cocktail.name} 주세요`
    const userMessage: Message = { role: 'user', text }
    const nextMessages = [...messages, userMessage]
    const dialogueResolution = resolveDialogueInput(text, nextMessages, 'conversation')
    if (dialogueResolution.blockedBySession) {
      setServedCocktail(null)
      const reply = formatFarewellBlockResponse()
      bartenderReply(reply.text, reply.expression)
      return true
    }
    const execution = executeAction(
      dialogueResolution.action,
      text,
      dialogueResolution.routeResult.secretPassphrase,
    )
    if (execution.status !== 'completed' || execution.effect.type !== 'serve') {
      setErrorMessage('죄송합니다. 방금 주문은 처리하지 못했어요. 다시 한 번 선택해 주세요.')
      return true
    }
    const orderedCocktail = execution.effect.cocktail

    setErrorMessage(null)
    setInteractionStatus('processing')
    setMessages((prev) => [...prev, userMessage])
    ingestUserMessage(text)
    userMessageCountRef.current += 1
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    setSidebarOpen(false)

    const turn = dialogueService.buildMainTurn(
      { text, messages: nextMessages },
      dialogueResolution,
      { outcome: execution.outcome, sessionAffect: dialogueSession.sessionAffect },
    )
    if (!turn) {
      setExpression('idle')
      setInteractionStatus('idle')
      setErrorMessage('죄송합니다. 방금 주문은 처리하지 못했어요. 다시 한 번 선택해 주세요.')
      return true
    }

    dispatchDialogueSession({ type: 'cocktail-served', cocktailId: orderedCocktail.id })
    recordConversationEvents(dialogueResolution.contextEvents)
    const servingEvents = dialogueService.buildServingContextEvents(orderedCocktail, { reply: turn.reply })

    sfx?.play('serve')
    playScreenShakeCue()
    const ids = unlockCocktailId(orderedCocktail.id)
    setUnlockedIds(ids)
    const servingDecision = createRestationServingDecision({
      cocktail: orderedCocktail,
      currentPhase: sessionPhase,
      alcoholStarTotal,
      dialogueSession,
    })
    const servingPlan = servingDecision.plan
    if (servingPlan.shouldUpdateAlcoholTotal) {
      dispatchDialogueSession({ type: 'set-alcohol-total', total: servingPlan.nextAlcoholStarTotal })
    }

    let afterCocktailRevealed = () => recordConversationEvents(servingEvents)
    if (servingPlan.requiresFarewell) {
      dispatchDialogueSession({
        type: 'set-phase',
        phase: servingDecision.nextPhase,
      })
      afterCocktailRevealed = () => {
        recordConversationEvents(servingEvents)
        beginFarewell(dialogueSession, 'alcohol-limit')
      }
    } else {
      dispatchDialogueSession({
        type: 'set-phase',
        phase: servingDecision.nextPhase,
      })
    }

    bartenderReply(turn.reply, turn.expression, orderedCocktail, 'idle', [], afterCocktailRevealed)
    return true
  }, [
    alcoholStarTotal,
    bartenderReply,
    beginFarewell,
    dialogueSession,
    executeAction,
    ingestUserMessage,
    messages,
    playScreenShakeCue,
    recordConversationEvents,
    resolveDialogueInput,
    sessionPhase,
    setExpression,
    setInteractionStatus,
    setServedCocktail,
    setServedCocktailMode,
    setUnlockedIds,
    sfx,
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
    recordConversationEvents(dialogueService.buildDiscussionContextEvents(cocktail))
  }, [recordConversationEvents, setServedCocktail, setServedCocktailMode])

  const performCardStory = useCallback((cocktail: CocktailData, sessionId = dialogueSession.activeSessionId) => {
    if (!isActiveSessionInput({
      mode: dialogueSession.mode,
      activeSessionId: dialogueSession.activeSessionId,
    }, sessionId, 'conversation')) return false
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    performSend(`${cocktail.name} 이야기 들려줘`, 'conversation')
    return true
  }, [dialogueSession.activeSessionId, dialogueSession.mode, performSend, setServedCocktail, setServedCocktailMode])

  const handleCardStory = useCallback((cocktail: CocktailData) => {
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({
        type: 'story-from-card', cocktail, sessionId: dialogueSession.activeSessionId,
      })
      return
    }
    performCardStory(cocktail)
  }, [dialogueSession.activeSessionId, enqueueInteraction, interactionStatus, performCardStory])

  const runQueuedInteraction = useCallback((interaction: QueuedInteraction): boolean => {
    return runRestationInteraction(interaction, {
      send: performSend,
      welcomeDrink: performWelcomeDrink,
      startRecommendation: performStartRecommendation,
      orderCocktail: performOrderCocktail,
      storyFromCard: performCardStory,
      recommendationAnswer: performRecommendationAnswer,
      cancelRecommendation: performCancelRecommendation,
    })
  }, [
    performCancelRecommendation,
    performCardStory,
    performOrderCocktail,
    performRecommendationAnswer,
    performSend,
    performStartRecommendation,
    performWelcomeDrink,
  ])

  const drainQueuedInteractions = useCallback(() => {
    const queue = interactionQueueRef.current
    if (interactionStatus !== 'idle' || queue.isScheduled()) return

    const runNextQueuedInteraction = () => {
      if (interactionStatus !== 'idle' || queue.isScheduled()) return

      const nextInteraction = queue.shift()
      if (!nextInteraction) return

      queue.setScheduled(true)
      timerRegistry.current.schedule(() => {
        queue.setScheduled(false)
        const accepted = runQueuedInteraction(nextInteraction)
        if (!accepted) runNextQueuedInteraction()
      }, 0)
    }

    runNextQueuedInteraction()
  }, [interactionStatus, runQueuedInteraction])

  useEffect(() => {
    drainQueuedInteractions()
  }, [drainQueuedInteractions])

  const canCardActions = !isOrderingClosedPhase(sessionPhase)

  return {
    scene,
    messages,
    expression,
    isBartenderTyping: interactionStatus === 'typing',
    isProcessing: interactionStatus !== 'idle',
    karuaPresentationAction,
    activeQuestion: dialogueSession.safetyLocked
      ? null
      : welcomeDrinkFeedbackPending
        ? WELCOME_DRINK_FEEDBACK_QUESTION
        : activeQuestion,
    activeQuestionOwner: activeQuestion && dialogueSession.mode === 'recommendation'
      ? {
          sessionId: dialogueSession.activeSessionId,
          questionId: dialogueSession.pendingQuestion?.questionId ?? activeQuestion.id,
        }
      : null,
    actionSessionMode,
    errorMessage,
    servedCocktail,
    lastServedCocktail,
    servedCocktailMode,
    sidebarOpen,
    screenShake,
    rapport,
    unlockedIds,
    canCardActions,
    handleEnter,
    handleExit,
    handleOrderCocktail,
    handleCardStory,
    handleResetNight,
    handleCancelRecommendation,
    handleViewCocktail,
    handleWelcomeDrink,
    handleStartRecommendation,
    handleRecommendationAnswer,
    handleSend,
    onTypingComplete,
    welcomeDrinkAvailable:
      !welcomeDrinkServed &&
      !welcomeDrinkFeedbackPending &&
      activeQuestion === null &&
      servedCocktail === null &&
      !isOrderingClosedPhase(sessionPhase),
    setServedCocktail,
    setSidebarOpen,
  }
}
