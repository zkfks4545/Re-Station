import { useCallback, useRef, useState, type RefObject } from 'react'
import type { TimerRegistry } from '@/lib/timing/timer-registry.js'
import type { CocktailData, Expression, Message } from '@/types.js'
import type { SfxChannel } from './useSfxManager.js'
import {
  KARUA_SERVING_CUE_DURATION_MS,
  type KaruaPresentationAction,
} from '@/lib/presentation/karua-presentation.js'
import {
  COCKTAIL_PREPARATION_DELAY_MS,
  COCKTAIL_PREPARATION_DURATION_MS,
  estimateTypingFallbackDelay,
  type InteractionStatus,
  type ServedCocktailMode,
} from './restation-controller-model.js'

export type BartenderReply = (
  text: string,
  expression: Expression,
  cocktail?: CocktailData | null,
  finishStatus?: InteractionStatus,
  afterMessages?: Message[],
  afterCocktailRevealed?: () => void,
) => void

export function useRestationPresentation(input: {
  sfx?: SfxChannel
  timerRegistry: RefObject<TimerRegistry>
  appendMessage(message: Message): void
}) {
  const { sfx, timerRegistry, appendMessage } = input
  const [expression, setExpression] = useState<Expression>('idle')
  const [interactionStatus, setInteractionStatus] = useState<InteractionStatus>('idle')
  const [servedCocktail, setServedCocktail] = useState<CocktailData | null>(null)
  const [servedCocktailMode, setServedCocktailMode] = useState<ServedCocktailMode>('recommendation')
  const [karuaPresentationAction, setKaruaPresentationAction] = useState<KaruaPresentationAction>('idle')
  const typingSequenceRef = useRef(0)
  const typingCompleteFnRef = useRef<() => void>(() => {})
  const typingCompletedRef = useRef(false)

  const runCocktailPreparation = useCallback((onPrepared: () => void) => {
    sfx?.stopAll()
    timerRegistry.current.schedule(() => {
      setInteractionStatus('preparing')
      setExpression('smirk')
      setKaruaPresentationAction('mixing')
      sfx?.play('shake')
      timerRegistry.current.schedule(() => {
        setKaruaPresentationAction('serving')
        sfx?.stop('shake')
        onPrepared()
        timerRegistry.current.schedule(() => {
          setKaruaPresentationAction('idle')
        }, KARUA_SERVING_CUE_DURATION_MS)
      }, COCKTAIL_PREPARATION_DURATION_MS)
    }, COCKTAIL_PREPARATION_DELAY_MS)
  }, [sfx, timerRegistry])

  const onTypingComplete = useCallback(() => {
    if (typingCompletedRef.current) return
    typingCompletedRef.current = true
    typingCompleteFnRef.current()
  }, [])

  const bartenderReply: BartenderReply = useCallback((
    text: string,
    nextExpression: Expression,
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
      setExpression(nextExpression)
      typingCompleteFnRef.current = () => {
        setExpression(nextExpression)

        if (afterMessages.length === 0) {
          setInteractionStatus(finishStatus)
          revealCocktail()
          return
        }

        let nextDelay = 450
        afterMessages.forEach((message, index) => {
          nextDelay += message.text.length * 12 + 300
          timerRegistry.current.schedule(() => {
            appendMessage(message)
            if (index === afterMessages.length - 1) {
              setInteractionStatus(finishStatus)
              revealCocktail()
            }
          }, nextDelay)
        })
      }

      appendMessage({ role: 'bartender', text, speaker: 'karua' })
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
  }, [appendMessage, onTypingComplete, runCocktailPreparation, timerRegistry])

  const invalidateTyping = useCallback(() => {
    typingSequenceRef.current += 1
  }, [])

  const cancelPresentation = useCallback(() => {
    setKaruaPresentationAction('idle')
  }, [])

  const setTypingCompleteHandler = useCallback((handler: () => void) => {
    typingCompletedRef.current = false
    typingCompleteFnRef.current = handler
  }, [])

  return {
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
  }
}
