import { useCallback, useEffect, useRef, useState } from 'react'
import { getCocktailResponse } from '@/lib/bartender/engine.js'
import { createSiestaEvent, MAX_SIESTA_EVENTS_PER_SESSION, SIESTA_EVENT_COOLDOWN_TURNS } from '@/lib/banter/siesta-event.js'
import { routeUserInput } from '@/lib/dialogue/input-router.js'
import type { RouteResult } from '@/lib/dialogue/input-router.js'
import { buildDialogueTurn } from '@/lib/dialogue/turn-builder.js'
import { validateDialogueTurn } from '@/types/dialogue-turn.js'
import { addUnknownCocktail } from '@/lib/cocktails/admin-queue-manager.js'
import { unlockCocktailId } from '@/lib/storage/cocktail-unlocks.js'
import { createTimerRegistry } from '@/lib/timing/timer-registry.js'
import type { CocktailData, Expression, Message } from '@/types.js'
import { useGuestPreferenceSession } from './useGuestPreferenceSession.js'
import { useRecommendationSession } from './useRecommendationSession.js'

type InteractionStatus = 'idle' | 'processing' | 'typing' | 'exiting'

export function useRestationController() {
  const [scene, setScene] = useState<'outside' | 'inside'>('outside')
  const [messages, setMessages] = useState<Message[]>([])
  const [expression, setExpression] = useState<Expression>('idle')
  const [interactionStatus, setInteractionStatus] = useState<InteractionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [servedCocktail, setServedCocktail] = useState<CocktailData | null>(null)
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
  }, [])

  const resetSiestaEventSession = useCallback(() => {
    userMessageCountRef.current = 0
    siestaEventCountRef.current = 0
    siestaCooldownRef.current = 0
    siestaRecentKeysRef.current = new Set()
  }, [])

  useEffect(() => () => timerRegistry.current.clearAll(), [])

  const bartenderReply = useCallback(
    (
      text: string,
      exp: Expression,
      cocktail?: CocktailData | null,
      finishStatus: InteractionStatus = 'idle',
      afterMessages: Message[] = [],
    ) => {
      setInteractionStatus('typing')
      setExpression('talk')
      timerRegistry.current.schedule(() => {
        setMessages((prev) => [...prev, { role: 'bartender', text }])
        setExpression(exp)

        if (afterMessages.length === 0) {
          setInteractionStatus(finishStatus)
          if (cocktail) {
            timerRegistry.current.schedule(() => setServedCocktail(cocktail), 600)
          }
          return
        }

        let nextDelay = 450
        afterMessages.forEach((message, index) => {
          nextDelay += message.text.length * 12 + 300
          timerRegistry.current.schedule(() => {
            setMessages((prev) => [...prev, message])
            if (index === afterMessages.length - 1) {
              setInteractionStatus(finishStatus)
              if (cocktail) {
                timerRegistry.current.schedule(() => setServedCocktail(cocktail), 600)
              }
            }
          }, nextDelay)
        })
      }, text.length * 15 + 400)
    },
    [],
  )

  const handleEnter = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    setErrorMessage(null)
    setScene('inside')
    setMessages([
      {
        role: 'bartender',
        text: '어서 오세요. Re:Station입니다.\n오늘은 어떤 걸 찾으세요?',
      },
    ])
  }, [clearPendingWork, resetSiestaEventSession])

  const handleExit = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    setErrorMessage(null)
    setInteractionStatus('exiting')
    bartenderReply('들러주셔서 감사합니다. 조심히 가세요.', 'idle', null, 'exiting')
    timerRegistry.current.schedule(() => {
      setScene('outside')
      setMessages([])
      setExpression('idle')
      setInteractionStatus('idle')
      setSidebarOpen(false)
      setServedCocktail(null)
      clearExcludedCocktailIds()
      resetRecommendation()
    }, 2000)
  }, [bartenderReply, clearPendingWork, clearExcludedCocktailIds, resetRecommendation, resetSiestaEventSession])

  const handleResetNight = useCallback(() => {
    clearPendingWork()
    resetSiestaEventSession()
    resetNight()
    setMessages([])
    setExpression('idle')
    setErrorMessage(null)
    setServedCocktail(null)
    clearExcludedCocktailIds()
    resetRecommendation()
    bartenderReply(
      '대화와 취향 정보를 초기화했습니다.\n도감에 등록된 칵테일 정보는 유지됩니다.',
      'idle',
    )
  }, [clearPendingWork, resetSiestaEventSession, resetNight, clearExcludedCocktailIds, resetRecommendation, bartenderReply])

  const handleCancelRecommendation = useCallback(() => {
    if (interactionStatus !== 'idle' || !activeQuestion) return
    resetRecommendation()
    setMessages((prev) => [...prev, { role: 'user', text: '추천 질문 취소' }])
    bartenderReply('추천 질문은 여기서 멈출게요. 다른 게 필요하면 말씀해 주세요.', 'idle')
  }, [activeQuestion, bartenderReply, interactionStatus, resetRecommendation])

  const handleSend = useCallback(
    (text: string) => {
      if (interactionStatus !== 'idle') return
      setErrorMessage(null)
      setInteractionStatus('processing')
      setMessages((prev) => [...prev, { role: 'user', text }])
      ingestUserMessage(text)
      userMessageCountRef.current += 1

      const routeResult: RouteResult = routeUserInput(text, { recommendationActive: activeQuestion !== null })

      if (routeResult.route === 'safety') {
        resetRecommendation()
        const turn = buildDialogueTurn(text, routeResult.route, '', 'sympathy')
        if (!validateDialogueTurn(turn)) return
        bartenderReply(turn.reply, turn.expression)
        return
      }

      if (routeResult.route === 'exit') {
        handleExit()
        return
      }

      if (routeResult.route === 'recommendation-cancel') {
        resetRecommendation()
        bartenderReply('추천 질문은 여기서 멈출게요. 다른 게 필요하면 말씀해 주세요.', 'idle')
        return
      }

      if (routeResult.route === 'unknown-cocktail-query' && routeResult.unknownCocktailName) {
        addUnknownCocktail(routeResult.unknownCocktailName, text)
        bartenderReply(
          `「${routeResult.unknownCocktailName}」이라는 메뉴는 아직 등록되지 않았네요.\n비슷한 맛이나 원하시는 종류를 말씀해 주시면 다른 칵테일을 찾아드릴게요.`,
          'thinking',
        )
        return
      }

      setExpression('thinking')
      timerRegistry.current.schedule(() => {
        try {
          const recommendation =
            routeResult.route === 'random-recommendation'
              ? resolveRandomRecommendation()
              : routeResult.route === 'explicit-cocktail' || routeResult.route === 'recommendation'
              ? resolveRecommendation(text, preference)
              : null
          const fallback = getCocktailResponse(text, messages)
          const turn = buildDialogueTurn(
            text,
            routeResult.route,
            fallback.response,
            fallback.expression,
            recommendation ?? undefined,
          )
          if (!validateDialogueTurn(turn)) {
            throw new Error('Invalid dialogue turn')
          }
          const cocktail = recommendation?.cocktail ?? null
          const siestaResult = createSiestaEvent({
            inputText: text,
            replyText: turn.reply,
            inputRoute: routeResult.route,
            userMessageCount: userMessageCountRef.current,
            eventCount: siestaEventCountRef.current,
            cooldownTurns: siestaCooldownRef.current,
            recommendationActive: activeQuestion !== null && !cocktail,
            recommendedCocktailName: cocktail?.name,
          }, siestaRecentKeysRef.current)

          if (cocktail) {
            setScreenShake(true)
            timerRegistry.current.schedule(() => setScreenShake(false), 500)
            const ids = unlockCocktailId(cocktail.id)
            setUnlockedIds(ids)
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

          bartenderReply(turn.reply, turn.expression, cocktail, 'idle', siestaResult?.messages ?? [])
        } catch {
          setExpression('idle')
          setInteractionStatus('idle')
          setErrorMessage('죄송합니다. 방금 말씀은 처리하지 못했어요. 다시 한번 말씀해 주세요.')
        }
      }, 800 + Math.random() * 600)
    },
    [
      interactionStatus,
      activeQuestion,
      ingestUserMessage,
      handleExit,
      resetRecommendation,
      resolveRandomRecommendation,
      resolveRecommendation,
      preference,
      messages,
      setUnlockedIds,
      bartenderReply,
    ],
  )

  const handleReRecommend = useCallback(() => {
    if (interactionStatus !== 'idle') return
    setServedCocktail(null)
    handleSend('다른 걸로 추천해줘')
  }, [handleSend, interactionStatus])

  return {
    scene,
    messages,
    expression,
    isBartenderTyping: interactionStatus === 'typing',
    isProcessing: interactionStatus !== 'idle',
    activeQuestion,
    errorMessage,
    servedCocktail,
    sidebarOpen,
    screenShake,
    unlockedIds,
    handleEnter,
    handleExit,
    handleReRecommend,
    handleResetNight,
    handleCancelRecommendation,
    handleSend,
    setServedCocktail,
    setSidebarOpen,
  }
}
