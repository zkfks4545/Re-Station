import { useCallback, useEffect, useRef, useState } from 'react'
import { getCocktailResponse } from '@/lib/bartender/engine.js'
import { routeUserInput } from '@/lib/dialogue/input-router.js'
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

  useEffect(() => () => timerRegistry.current.clearAll(), [])

  const bartenderReply = useCallback(
    (
      text: string,
      exp: Expression,
      cocktail?: CocktailData | null,
      finishStatus: InteractionStatus = 'idle',
    ) => {
      setInteractionStatus('typing')
      setExpression('talk')
      timerRegistry.current.schedule(() => {
        setMessages((prev) => [...prev, { role: 'bartender', text }])
        setExpression(exp)
        setInteractionStatus(finishStatus)
        if (cocktail) {
          timerRegistry.current.schedule(() => setServedCocktail(cocktail), 600)
        }
      }, text.length * 15 + 400)
    },
    [],
  )

  const handleEnter = useCallback(() => {
    clearPendingWork()
    setErrorMessage(null)
    setScene('inside')
    setMessages([
      {
        role: 'bartender',
        text: '어서 오세요. Re:Station입니다.\n오늘은 어떤 걸 찾으세요?',
      },
    ])
  }, [clearPendingWork])

  const handleExit = useCallback(() => {
    clearPendingWork()
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
  }, [bartenderReply, clearPendingWork, clearExcludedCocktailIds, resetRecommendation])

  const handleResetNight = useCallback(() => {
    clearPendingWork()
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
  }, [clearPendingWork, resetNight, clearExcludedCocktailIds, resetRecommendation, bartenderReply])

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

      const inputRoute = routeUserInput(text, { recommendationActive: activeQuestion !== null })

      if (inputRoute === 'safety') {
        resetRecommendation()
      }

      if (inputRoute === 'exit') {
        handleExit()
        return
      }

      setExpression('thinking')
      timerRegistry.current.schedule(() => {
        try {
          const recommendation =
            inputRoute === 'random-recommendation'
              ? resolveRandomRecommendation()
              : inputRoute === 'explicit-cocktail' || inputRoute === 'recommendation'
              ? resolveRecommendation(text, preference)
              : null
          const fallback = getCocktailResponse(text, messages)
          const reply = recommendation?.reply ?? fallback.response
          const nextExpression = recommendation?.expression ?? fallback.expression
          const cocktail = recommendation?.cocktail ?? null

          if (cocktail) {
            setScreenShake(true)
            timerRegistry.current.schedule(() => setScreenShake(false), 500)
            const ids = unlockCocktailId(cocktail.id)
            setUnlockedIds(ids)
          }

          bartenderReply(reply, nextExpression, cocktail)
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
