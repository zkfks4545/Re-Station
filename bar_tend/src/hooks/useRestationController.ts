import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { createSiestaEvent, MAX_SIESTA_EVENTS_PER_SESSION, SIESTA_EVENT_COOLDOWN_TURNS } from '@/lib/banter/siesta-event.js'
import { addUnknownCocktail } from '@/lib/cocktails/admin-queue-manager.js'
import { cocktails, getCocktailById } from '@/lib/cocktails/database.js'
import {
  createConversationContext,
  updateConversationContext,
  type ConversationContextEvent,
} from '@/lib/dialogue/conversation-context.js'
import { executeDialogueAction } from '@/lib/dialogue/action-executor.js'
import { getFeedbackExcludedCocktailId } from '@/lib/recommendation/feedback-exclusion.js'
import { DialogueService, type DialogueResolution } from '@/lib/dialogue/dialogue-service.js'
import { createServingPlan } from '@/lib/dialogue/serving-plan.js'
import {
  formatWelcomeDrinkFeedbackReply,
  formatWelcomeDrinkReply,
  selectWelcomeDrink,
  shouldHandleWelcomeDrinkFeedback,
  WELCOME_DRINK_FEEDBACK_QUESTION,
} from '@/lib/recommendation/welcome-drink.js'
import {
  createDialogueSessionState,
  decideFarewellEntry,
  dialogueSessionReducer,
  isWelcomeDrinkFeedbackPending,
  type DialogueSessionMode,
  type DialogueSessionState,
} from '@/lib/session/dialogue-session.js'
import {
  isOrderingClosedPhase,
  nextPhaseAfterRoute,
  XYZ_COCKTAIL_ID,
} from '@/lib/session/session-flow.js'
import {
  formatFarewellBlockReply,
  formatFarewellConversationReply,
  formatReturnHomeReply,
  formatStandardFarewellEntryReply,
  formatWelcomeFarewellXyzReply,
  formatWelcomeXyzClarificationReply,
  formatXyzReply,
  isEjectionConcern,
} from '@/lib/session/farewell-replies.js'
import type { SessionPhase } from '@/lib/session/session-flow.js'
import { unlockCocktailId } from '@/lib/storage/cocktail-unlocks.js'
import { experimentalSemanticAssistant } from '@/lib/webllm/service.js'
import { semanticSessionTags } from '@/lib/webllm/session-tags.js'
import { createTimerRegistry } from '@/lib/timing/timer-registry.js'
import type { CocktailData, Expression, Message } from '@/types.js'
import type { IntentType } from '@/lib/bartender/intent-classifier.js'
import { createInitialRapport, updateRapport, createUpdateTracker } from '@/lib/relationship/index.js'
import { useGuestPreferenceSession } from './useGuestPreferenceSession.js'
import { useRecommendationSession } from './useRecommendationSession.js'

type InteractionStatus = 'idle' | 'processing' | 'typing' | 'preparing' | 'exiting'
type ServedCocktailMode = 'recommendation' | 'codex'
export type ActionSessionMode = DialogueSessionMode
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
const dialogueService = new DialogueService(cocktails)

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
  const [servedCocktailMode, setServedCocktailMode] = useState<ServedCocktailMode>('recommendation')
  const [isPreparingCocktail, setIsPreparingCocktail] = useState(false)
  const [dialogueSession, dispatchDialogueSession] = useReducer(
    dialogueSessionReducer,
    undefined,
    () => createDialogueSessionState(),
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [rapport, setRapport] = useState(createInitialRapport)
  const rapportRef = useRef(rapport)
  const rapportTrackerRef = useRef(createUpdateTracker())
  const rapportTurnRef = useRef(0)
  const timerRegistry = useRef(createTimerRegistry())
  const userMessageCountRef = useRef(0)
  const siestaEventCountRef = useRef(0)
  const siestaCooldownRef = useRef(0)
  const siestaRecentKeysRef = useRef(new Set<string>())
  const queuedInteractionsRef = useRef<QueuedInteraction[]>([])
  const queuedInteractionScheduledRef = useRef(false)
  const typingSequenceRef = useRef(0)
  const [conversationContext, dispatchConversationContext] = useReducer(
    updateConversationContext,
    undefined,
    createConversationContext,
  )

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
    activeQuestion,
    clearExcludedCocktailIds,
    excludeCocktailFromRecommendations,
    resetRecommendation,
    resolveRandomRecommendation,
    resolveExplicitCocktail,
    resolveLoreBasedCocktail,
    resolveRecommendation,
  } = useRecommendationSession()

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
    dispatchDialogueSession({ type: 'reset', phase })
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
          afterCocktailRevealed?.()
        }, 600)
      }

      const showReply = () => {
        typingCompletedRef.current = false
        const typingSequence = typingSequenceRef.current + 1
        typingSequenceRef.current = typingSequence
        setInteractionStatus('typing')
        setExpression(exp)

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

  const serveXyzAndEnterFarewell = useCallback((entryKind: 'alcohol-xyz' | 'welcome-farewell-xyz') => {
    const xyzCocktail = getCocktailById(XYZ_COCKTAIL_ID)
    if (!xyzCocktail) {
      dispatchDialogueSession({ type: 'enter-farewell', entryKind: 'standard' })
      bartenderReply('마지막 잔 데이터를 찾지 못했어요. 오늘 주문은 여기까지 받을게요.', 'sympathy')
      return
    }

    dispatchDialogueSession({ type: 'enter-farewell', entryKind })
    setScreenShake(true)
    timerRegistry.current.schedule(() => setScreenShake(false), 500)
    const ids = unlockCocktailId(xyzCocktail.id)
    setUnlockedIds(ids)
    const servingEvents = dialogueService.buildServingContextEvents(xyzCocktail)
    bartenderReply(
      entryKind === 'welcome-farewell-xyz'
        ? formatWelcomeFarewellXyzReply(xyzCocktail)
        : formatXyzReply(xyzCocktail),
      'smirk',
      xyzCocktail,
      'idle',
      [],
      () => {
        recordConversationEvents(servingEvents)
        dispatchDialogueSession({ type: 'set-phase', phase: 'farewell' })
      },
    )
  }, [bartenderReply, recordConversationEvents, setUnlockedIds])

  const enterStandardFarewell = useCallback(() => {
    dispatchDialogueSession({ type: 'enter-farewell', entryKind: 'standard' })
    resetRecommendation()
    setServedCocktail(null)
    bartenderReply(formatStandardFarewellEntryReply(), 'sympathy')
  }, [bartenderReply, resetRecommendation])

  const beginFarewell = useCallback((
    state: DialogueSessionState,
    trigger: 'exit' | 'alcohol-limit',
  ) => {
    resetRecommendation()
    const entryKind = decideFarewellEntry(state, trigger)
    if (!entryKind) return
    if (entryKind === 'alcohol-xyz' || entryKind === 'welcome-farewell-xyz') {
      serveXyzAndEnterFarewell(entryKind)
      return
    }
    enterStandardFarewell()
  }, [enterStandardFarewell, resetRecommendation, serveXyzAndEnterFarewell])

  const moveOutsideAfterDelay = useCallback((delayMs: number) => {
    timerRegistry.current.schedule(() => {
      setScene('outside')
      setMessages([])
      setExpression('idle')
      setInteractionStatus('idle')
      setIsPreparingCocktail(false)
      setSidebarOpen(false)
      setServedCocktail(null)
      setServedCocktailMode('recommendation')
      clearExcludedCocktailIds()
      resetRecommendation()
      resetSessionFlow('entry')
      semanticSessionTags.reset()
    }, delayMs)
  }, [clearExcludedCocktailIds, resetRecommendation, resetSessionFlow])

  const handleEnter = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    semanticSessionTags.reset()
    resetSessionFlow('conversation')
    const initialRapport = createInitialRapport()
    rapportRef.current = initialRapport
    setRapport(initialRapport)
    rapportTrackerRef.current = createUpdateTracker()
    rapportTurnRef.current = 0
    setErrorMessage(null)
    setScene('inside')
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    setInteractionStatus('typing')
    setExpression('idle')
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
      bartenderReply(formatReturnHomeReply(), 'idle', null, 'exiting')
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
  ])

  const handleResetNight = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    resetNight()
    semanticSessionTags.reset()
    resetSessionFlow('conversation')
    const initialRapport = createInitialRapport()
    rapportRef.current = initialRapport
    setRapport(initialRapport)
    rapportTrackerRef.current = createUpdateTracker()
    rapportTurnRef.current = 0
    setMessages([])
    setExpression('idle')
    setErrorMessage(null)
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    setIsPreparingCocktail(false)
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
      dispatchDialogueSession({ type: 'welcome-resolved' })
      setMessages((prev) => [...prev, { role: 'user', text: '웰컴 드링크 피드백 건너뛰기' }])
      bartenderReply(
        '괜찮아요. 첫 잔은 편하게 두고, 다음 잔이 필요하시면 그때 다시 맞춰볼게요.',
        'idle',
      )
      return true
    }
    resetRecommendation()
    dispatchDialogueSession({ type: 'set-mode', mode: 'conversation' })
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
      welcomeDrinkServed ||
      welcomeDrinkFeedbackPending ||
      isOrderingClosedPhase(sessionPhase)
    ) return false

    const cocktail = selectWelcomeDrink()
    setErrorMessage(null)
    dispatchDialogueSession({ type: 'welcome-served' })
    dispatchDialogueSession({ type: 'set-mode', mode: 'conversation' })
    dispatchDialogueSession({ type: 'set-phase', phase: 'conversation' })
    resetRecommendation()
    setMessages((prev) => [...prev, { role: 'user', text: '웰컴 드링크' }])
    setScreenShake(true)
    timerRegistry.current.schedule(() => setScreenShake(false), 500)
    const ids = unlockCocktailId(cocktail.id)
    setUnlockedIds(ids)
    const reply = formatWelcomeDrinkReply(cocktail, { alcoholStarTotal })
    const servingEvents = dialogueService.buildServingContextEvents(cocktail, { reply })
    bartenderReply(
      reply,
      'smirk',
      cocktail,
      'idle',
      [],
      () => recordConversationEvents(servingEvents),
    )
    return true
  }, [
    activeQuestion,
    alcoholStarTotal,
    bartenderReply,
    recordConversationEvents,
    resetRecommendation,
    servedCocktail,
    sessionPhase,
    setUnlockedIds,
    welcomeDrinkFeedbackPending,
    welcomeDrinkServed,
  ])

  const handleWelcomeDrink = useCallback(() => {
    if (interactionStatus === 'exiting') return
    if (interactionStatus !== 'idle') {
      enqueueInteraction({ type: 'welcome-drink' })
      return
    }
    performWelcomeDrink()
  }, [enqueueInteraction, interactionStatus, performWelcomeDrink])

  const resolveDialogueInput = useCallback((
    text: string,
    nextMessages: Message[],
    forcedSessionMode?: ActionSessionMode,
  ) => {
    const effectiveSessionMode = forcedSessionMode ?? actionSessionMode
    return dialogueService.resolve({
      text,
      messages: nextMessages,
      conversationContext,
      session: {
        phase: sessionPhase,
        activeRecommendationSession: effectiveSessionMode === 'recommendation' && activeQuestion !== null,
        allowRecommendationRoutes:
          effectiveSessionMode === 'recommendation' || welcomeDrinkFeedbackPending,
        welcomeDrinkUsed: welcomeDrinkServed,
        alcoholStarsTotal: alcoholStarTotal,
        totalUserMessages: userMessageCountRef.current,
        conversationTurnCount: dialogueSession.dialogue.turnCount,
      },
      displayedCocktail: servedCocktail,
    })
  }, [
    actionSessionMode,
    activeQuestion,
    alcoholStarTotal,
    conversationContext,
    dialogueSession.dialogue.turnCount,
    servedCocktail,
    sessionPhase,
    welcomeDrinkFeedbackPending,
    welcomeDrinkServed,
  ])

  const executeAction = useCallback((
    action: DialogueResolution['action'],
    text: string,
    secretPassphrase?: string,
  ) => executeDialogueAction({ action, text, secretPassphrase }, {
    getCocktail: (cocktailId) => getCocktailById(cocktailId) ?? null,
    recommendByPreference: (input) => resolveRecommendation(input, preference),
    recommendRandom: resolveRandomRecommendation,
    orderExplicit: resolveExplicitCocktail,
    orderByLore: resolveLoreBasedCocktail,
  }), [
    preference,
    resolveExplicitCocktail,
    resolveLoreBasedCocktail,
    resolveRandomRecommendation,
    resolveRecommendation,
  ])

  const mapIntentToRapportContext = useCallback((intent: IntentType): string => {
    const MAP: Partial<Record<IntentType, string>> = {
      'order-cocktail': 'cocktail-order',
      'order-cocktail-mixed': 'cocktail-order',
      'recommendation-query': 'recommend-request',
      'mood-talk': 'mood-expression',
      'taste-query': 'taste-statement',
      'uncertain-talk': 'general-chat',
    }
    return MAP[intent] ?? intent
  }, [])

  const applyRapportUpdate = useCallback((intent: IntentType) => {
    rapportTurnRef.current += 1
    const ctx = mapIntentToRapportContext(intent)
    const result = updateRapport(rapportRef.current, {
      intent: ctx,
      sessionTurnCount: rapportTurnRef.current,
    }, rapportTrackerRef.current)
    if (result.rapport !== rapportRef.current) {
      rapportRef.current = result.rapport
      setRapport(result.rapport)
    }
  }, [mapIntentToRapportContext])

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
      const dialogueResolution = resolveDialogueInput(text, nextMessages, forcedSessionMode)
      const { routeResult, action: dialogueAction, classifiedIntent } = dialogueResolution
      applyRapportUpdate(classifiedIntent.intent)
      void experimentalSemanticAssistant.analyze({
        input: text,
        route: classifiedIntent.intent,
        history: messages,
      })
      const isConversationFreeTurn = effectiveActionSessionMode === 'conversation' && routeResult.route === 'general'
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

      if (welcomeDrinkFeedbackPending && shouldHandleWelcomeDrinkFeedback(routeResult.route, text)) {
        dispatchDialogueSession({ type: 'welcome-resolved' })
        const feedback = formatWelcomeDrinkFeedbackReply(text)
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
        dispatchDialogueSession({ type: 'lock-safety' })
        setServedCocktail(null)
        setSidebarOpen(false)
        bartenderReply(directResponse.turn.reply, directResponse.turn.expression, null, 'exiting')
        return
      }

      // --- 세션 마감 처리(Farewell phase) ---
      if (sessionPhase === 'farewell') {
        dispatchDialogueSession({ type: 'increment-farewell-turn' })
        if (routeResult.route === 'exit') {
          resetRecommendation()
          dispatchDialogueSession({ type: 'set-phase', phase: 'returnHome' })
          setServedCocktail(null)
          bartenderReply(formatReturnHomeReply(), 'idle', null, 'exiting')
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
        dispatchDialogueSession({ type: 'set-mode', mode: 'conversation' })
        bartenderReply(directResponse.turn.reply, directResponse.turn.expression)
        return
      }

      // --- 주문 차단 단계 처리(Blocked in ordering-closed phase) ---
      if (dialogueResolution.blockedBySession) {
        resetRecommendation()
        dispatchDialogueSession({ type: 'set-mode', mode: 'conversation' })
        bartenderReply(formatFarewellBlockReply(), 'smirk')
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
        bartenderReply(directResponse.turn.reply, directResponse.turn.expression)
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
          const turn = dialogueService.buildMainTurn(
            { text, messages: nextMessages },
            dialogueResolution,
            {
              outcome: recommendation,
              inviteRecommendation: shouldInviteRecommendationFromConversation,
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
            const servingPlan = createServingPlan({
              cocktail,
              currentPhase: sessionPhase,
              alcoholStarTotal,
            })
            dispatchDialogueSession({ type: 'cocktail-served' })
            const servingEvents = dialogueService.buildServingContextEvents(cocktail, {
              reply: turn.reply,
              recommended: servingEffect?.recommended ?? false,
            })
            afterCocktailRevealed = () => recordConversationEvents(servingEvents)
            setScreenShake(true)
            timerRegistry.current.schedule(() => setScreenShake(false), 500)
            const ids = unlockCocktailId(cocktail.id)
            setUnlockedIds(ids)
            if (servingPlan.shouldUpdateAlcoholTotal) {
              dispatchDialogueSession({ type: 'set-alcohol-total', total: servingPlan.nextAlcoholStarTotal })
            }
            if (servingPlan.requiresFarewell) {
              const entryKind = decideFarewellEntry(dialogueSession, 'alcohol-limit')
              if (!entryKind) return
              dispatchDialogueSession({
                type: 'set-phase',
                phase: entryKind === 'alcohol-xyz' || entryKind === 'welcome-farewell-xyz'
                  ? 'xyz'
                  : 'farewell',
              })
              afterCocktailRevealed = () => {
                recordConversationEvents(servingEvents)
                beginFarewell(dialogueSession, 'alcohol-limit')
              }
            } else {
              dispatchDialogueSession({
                type: 'set-phase',
                phase: servingPlan.nextPhase ?? sessionPhase,
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
      applyRapportUpdate,
      bartenderReply,
      beginFarewell,
      clearPendingWork,
      conversationContext,
      dialogueSession,
      excludeCocktailFromRecommendations,
      executeAction,
      ingestUserMessage,
      lastServedCocktail,
      messages,
      moveOutsideAfterDelay,
      resetRecommendation,
      resolveDialogueInput,
      recordConversationEvents,
      sessionPhase,
      setUnlockedIds,
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

  const performStartRecommendation = useCallback(() => {
    if (actionSessionMode === 'recommendation' && activeQuestion) return true
    if (isOrderingClosedPhase(sessionPhase)) {
      bartenderReply(formatFarewellBlockReply(), 'smirk')
      return true
    }
    setServedCocktail(null)
    dispatchDialogueSession({ type: 'set-mode', mode: 'recommendation' })
    dispatchDialogueSession({ type: 'reset-conversation-progress' })
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
    const text = `${cocktail.name} 주세요`
    const userMessage: Message = { role: 'user', text }
    const nextMessages = [...messages, userMessage]
    const dialogueResolution = resolveDialogueInput(text, nextMessages, 'conversation')
    if (dialogueResolution.blockedBySession) {
      setServedCocktail(null)
      bartenderReply(formatFarewellBlockReply(), 'smirk')
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
      { outcome: execution.outcome },
    )
    if (!turn) {
      setExpression('idle')
      setInteractionStatus('idle')
      setErrorMessage('죄송합니다. 방금 주문은 처리하지 못했어요. 다시 한 번 선택해 주세요.')
      return true
    }

    dispatchDialogueSession({ type: 'cocktail-served' })
    recordConversationEvents(dialogueResolution.contextEvents)
    const servingEvents = dialogueService.buildServingContextEvents(orderedCocktail, { reply: turn.reply })

    setScreenShake(true)
    timerRegistry.current.schedule(() => setScreenShake(false), 500)
    const ids = unlockCocktailId(orderedCocktail.id)
    setUnlockedIds(ids)
    const servingPlan = createServingPlan({
      cocktail: orderedCocktail,
      currentPhase: sessionPhase,
      alcoholStarTotal,
    })
    if (servingPlan.shouldUpdateAlcoholTotal) {
      dispatchDialogueSession({ type: 'set-alcohol-total', total: servingPlan.nextAlcoholStarTotal })
    }

    let afterCocktailRevealed = () => recordConversationEvents(servingEvents)
    if (servingPlan.requiresFarewell) {
      const entryKind = decideFarewellEntry(dialogueSession, 'alcohol-limit')
      dispatchDialogueSession({
        type: 'set-phase',
        phase: entryKind === 'alcohol-xyz' || entryKind === 'welcome-farewell-xyz'
          ? 'xyz'
          : 'farewell',
      })
      afterCocktailRevealed = () => {
        recordConversationEvents(servingEvents)
        beginFarewell(dialogueSession, 'alcohol-limit')
      }
    } else {
      dispatchDialogueSession({
        type: 'set-phase',
        phase: servingPlan.nextPhase ?? sessionPhase,
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
    recordConversationEvents,
    resolveDialogueInput,
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
    recordConversationEvents(dialogueService.buildDiscussionContextEvents(cocktail))
  }, [recordConversationEvents])

  const performReRecommend = useCallback(() => {
    if (isOrderingClosedPhase(sessionPhase)) {
      setServedCocktail(null)
      bartenderReply(formatFarewellBlockReply(), 'smirk')
      return true
    }
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    dispatchDialogueSession({ type: 'set-mode', mode: 'recommendation' })
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
    activeQuestion: dialogueSession.safetyLocked
      ? null
      : welcomeDrinkFeedbackPending
        ? WELCOME_DRINK_FEEDBACK_QUESTION
        : activeQuestion,
    actionSessionMode,
    errorMessage,
    servedCocktail,
    lastServedCocktail,
    servedCocktailMode,
    sidebarOpen,
    screenShake,
    rapport,
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
      !welcomeDrinkServed &&
      !welcomeDrinkFeedbackPending &&
      activeQuestion === null &&
      servedCocktail === null &&
      !isOrderingClosedPhase(sessionPhase),
    setServedCocktail,
    setSidebarOpen,
  }
}
