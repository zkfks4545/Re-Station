import { useCallback, useEffect, useRef, useState } from 'react'
import { getCocktailResponse } from '@/lib/bartender/engine.js'
import { createSiestaEvent, MAX_SIESTA_EVENTS_PER_SESSION, SIESTA_EVENT_COOLDOWN_TURNS } from '@/lib/banter/siesta-event.js'
import { addUnknownCocktail } from '@/lib/cocktails/admin-queue-manager.js'
import { routeUserInput } from '@/lib/dialogue/input-router.js'
import type { RouteResult } from '@/lib/dialogue/input-router.js'
import { buildDialogueTurn } from '@/lib/dialogue/turn-builder.js'
import {
  formatWelcomeDrinkFeedbackReply,
  formatWelcomeDrinkReply,
  selectWelcomeDrink,
  shouldHandleWelcomeDrinkFeedback,
  WELCOME_DRINK_FEEDBACK_QUESTION,
} from '@/lib/recommendation/welcome-drink.js'
import {
  isRecommendationBlockedInPhase,
  isOrderingClosedPhase,
  nextPhaseAfterRoute,
  nextPhaseAfterServedCocktail,
  shouldEnterFarewellAfterServedCocktail,
  shouldReturnHomeAfterFarewellTurn,
  XYZ_COCKTAIL_ID,
} from '@/lib/session/session-flow.js'
import {
  formatAlcoholLimitFarewellReply,
  formatFarewellBlockReply,
  formatFarewellConversationReply,
  formatReturnHomeReply,
  formatWelcomeXyzClarificationReply,
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

const COCKTAIL_PREPARATION_DELAY_MS = 600
const COCKTAIL_PREPARATION_DURATION_MS = 1800
const SIESTA_EVENTS_ENABLED = false

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
    resolveRecommendation,
  } = useRecommendationSession()

  const clearPendingWork = useCallback(() => {
    timerRegistry.current.clearAll()
    setInteractionStatus('idle')
    setScreenShake(false)
    setIsPreparingCocktail(false)
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
  }, [])

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
    ) => {
      const revealCocktail = () => {
        if (!cocktail) return
        timerRegistry.current.schedule(() => {
          setServedCocktailMode('recommendation')
          setServedCocktail(cocktail)
          setLastServedCocktail(cocktail)
        }, 600)
      }

      const showReply = () => {
        typingCompletedRef.current = false
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
      }

      if (cocktail) {
        runCocktailPreparation(showReply)
        return
      }

      showReply()
    },
    [runCocktailPreparation],
  )

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
        text: '어서 오세요. Re:Station입니다.\n오늘은 어떤 걸 찾으세요?',
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

  const handleCancelRecommendation = useCallback(() => {
    if (interactionStatus !== 'idle' || (!activeQuestion && !welcomeDrinkFeedbackPending)) return
    if (welcomeDrinkFeedbackPending) {
      setWelcomeDrinkFeedbackPending(false)
      setMessages((prev) => [...prev, { role: 'user', text: '웰컴 드링크 피드백 건너뛰기' }])
      bartenderReply(
        '괜찮아요. 첫 잔은 편하게 두고, 다음 잔이 필요하시면 그때 다시 맞춰볼게요.',
        'idle',
      )
      return
    }
    resetRecommendation()
    setMessages((prev) => [...prev, { role: 'user', text: '추천 질문 취소' }])
    bartenderReply('추천 질문은 여기서 멈출게요. 다른 게 필요하면 말씀해 주세요.', 'idle')
  }, [
    activeQuestion,
    bartenderReply,
    interactionStatus,
    resetRecommendation,
    welcomeDrinkFeedbackPending,
  ])

  const handleWelcomeDrink = useCallback(() => {
    if (
      interactionStatus !== 'idle' ||
      activeQuestion ||
      servedCocktail ||
      welcomeDrinkUsed ||
      welcomeDrinkFeedbackPending ||
      isOrderingClosedPhase(sessionPhase)
    ) return

    const cocktail = selectWelcomeDrink()
    setErrorMessage(null)
    setWelcomeDrinkUsed(true)
    setWelcomeDrinkFeedbackPending(true)
    setSessionPhase('conversation')
    resetRecommendation()
    setMessages((prev) => [...prev, { role: 'user', text: '웰컴 드링크' }])
    setScreenShake(true)
    timerRegistry.current.schedule(() => setScreenShake(false), 500)
    const ids = unlockCocktailId(cocktail.id)
    setUnlockedIds(ids)
    bartenderReply(formatWelcomeDrinkReply(cocktail, { alcoholStarTotal }), 'smirk', cocktail)
  }, [
    activeQuestion,
    alcoholStarTotal,
    bartenderReply,
    interactionStatus,
    resetRecommendation,
    servedCocktail,
    sessionPhase,
    setUnlockedIds,
    welcomeDrinkFeedbackPending,
    welcomeDrinkUsed,
  ])

  const handleSend = useCallback(
    (text: string) => {
      if (interactionStatus !== 'idle') return
      setErrorMessage(null)
      setInteractionStatus('processing')
      const userMessage: Message = { role: 'user', text }
      const nextMessages: Message[] = [...messages, userMessage]
      setMessages((prev) => [...prev, userMessage])
      ingestUserMessage(text)
      userMessageCountRef.current += 1

      const routeResult: RouteResult = routeUserInput(text, { recommendationActive: activeQuestion !== null })

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
        bartenderReply(turn.reply, turn.expression)
        return
      }

      // --- 주문 차단 단계 처리(Blocked in ordering-closed phase) ---
      if (isRecommendationBlockedInPhase(sessionPhase, routeResult.route)) {
        resetRecommendation()
        bartenderReply(formatFarewellBlockReply(), 'smirk')
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
          const recommendation = routeResult.route === 'random-recommendation'
            ? resolveRandomRecommendation()
            : (routeResult.route === 'explicit-cocktail' || routeResult.route === 'recommendation')
              ? resolveRecommendation(text, preference)
              : null
          const fallback = getCocktailResponse(text, nextMessages)
          const turn = buildDialogueTurn(text, routeResult.route, fallback.response, fallback.expression, recommendation ?? undefined, { confidence: routeResult.confidence })
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
          let afterMessages = siestaResult?.messages ?? []

          if (cocktail) {
            setScreenShake(true)
            timerRegistry.current.schedule(() => setScreenShake(false), 500)
            const ids = unlockCocktailId(cocktail.id)
            setUnlockedIds(ids)
            const nextAlcoholStarTotal = isXyzCocktail
              ? alcoholStarTotal
              : alcoholStarTotal + cocktail.taste.alcohol
            if (!isXyzCocktail) setAlcoholStarTotal(nextAlcoholStarTotal)
            if (shouldEnterFarewellAfterServedCocktail({
              current: sessionPhase,
              alcoholStarTotal: nextAlcoholStarTotal,
              isXyz: isXyzCocktail,
            })) {
              setSessionPhase('farewell')
              setFarewellTurnCount(0)
              afterMessages = [
                ...afterMessages,
                {
                  role: 'bartender',
                  text: formatAlcoholLimitFarewellReply(),
                  speaker: 'karua',
                },
              ]
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

          bartenderReply(turn.reply, turn.expression, cocktail, 'idle', afterMessages)
        } catch {
          setExpression('idle')
          setInteractionStatus('idle')
          setErrorMessage('죄송합니다. 방금 말은 처리하지 못했어요. 다시 한 번 말씀해 주세요.')
        }
      }, 800 + Math.random() * 600)
    },
    [
      activeQuestion,
      alcoholStarTotal,
      bartenderReply,
      farewellTurnCount,
      handleExit,
      ingestUserMessage,
      interactionStatus,
      lastServedCocktail?.id,
      messages,
      moveOutsideAfterDelay,
      preference,
      resetRecommendation,
      resolveRandomRecommendation,
      resolveRecommendation,
      sessionPhase,
      setUnlockedIds,
      welcomeDrinkFeedbackPending,
    ],
  )

  const handleOrderCocktail = useCallback((cocktailName: string) => {
    if (interactionStatus !== 'idle') return
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    setSidebarOpen(false)
    handleSend(`${cocktailName} 주세요`)
  }, [handleSend, interactionStatus])

  const handleViewCocktail = useCallback((cocktail: CocktailData) => {
    setServedCocktailMode('codex')
    setServedCocktail(cocktail)
    setSidebarOpen(false)
  }, [])

  const handleReRecommend = useCallback(() => {
    if (interactionStatus !== 'idle') return
    if (isOrderingClosedPhase(sessionPhase)) {
      setServedCocktail(null)
      bartenderReply(formatFarewellBlockReply(), 'smirk')
      return
    }
    setServedCocktail(null)
    setServedCocktailMode('recommendation')
    handleSend('다른 걸로 추천해줘')
  }, [bartenderReply, handleSend, interactionStatus, sessionPhase])

  const canReRecommend = !isOrderingClosedPhase(sessionPhase)

  return {
    scene,
    messages,
    expression,
    isBartenderTyping: interactionStatus === 'typing',
    isProcessing: interactionStatus !== 'idle',
    isPreparingCocktail,
    activeQuestion: welcomeDrinkFeedbackPending ? WELCOME_DRINK_FEEDBACK_QUESTION : activeQuestion,
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
