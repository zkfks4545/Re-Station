import { useCallback, type Dispatch } from 'react'
import { cocktails } from '@/lib/cocktails/index.js'
import type { ConversationContextEvent } from '@/lib/dialogue/conversation-context.js'
import { DialogueService } from '@/lib/dialogue/dialogue-service.js'
import {
  formatWelcomeDrinkResponse,
  selectWelcomeDrink,
} from '@/lib/recommendation/welcome-drink.js'
import type { DialogueSessionAction } from '@/lib/session/dialogue-session.js'
import type { SessionPhase } from '@/lib/session/session-flow.js'
import { isOrderingClosedPhase } from '@/lib/session/session-flow.js'
import { unlockCocktailId } from '@/lib/storage/cocktail-unlocks.js'
import type { CocktailData, Message } from '@/types.js'
import type { QueuedInteraction } from './restation-controller-model.js'
import type { BartenderReply } from './useRestationPresentation.js'

const dialogueService = new DialogueService(cocktails)

export function useRestationWelcomeDrink(input: {
  recommendationActive: boolean
  servedCocktail: CocktailData | null
  welcomeDrinkServed: boolean
  welcomeDrinkFeedbackPending: boolean
  sessionPhase: SessionPhase
  alcoholStarTotal: number
  interactionStatus: 'idle' | 'processing' | 'typing' | 'preparing' | 'exiting'
  appendMessage(message: Message): void
  bartenderReply: BartenderReply
  dispatchDialogueSession: Dispatch<DialogueSessionAction>
  enqueueInteraction(interaction: QueuedInteraction): void
  playScreenShakeCue(): void
  recordConversationEvents(events: ConversationContextEvent[]): void
  resetRecommendation(): void
  setErrorMessage(message: string | null): void
  setUnlockedIds(ids: Set<string>): void
}) {
  const {
    recommendationActive,
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
  } = input
  const performWelcomeDrink = useCallback(() => {
    if (
      recommendationActive ||
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
    appendMessage({ role: 'user', text: '웰컴 드링크' })
    playScreenShakeCue()
    setUnlockedIds(unlockCocktailId(cocktail.id))
    const welcomeReply = formatWelcomeDrinkResponse(cocktail, {
      alcoholStarTotal,
    })
    const servingEvents = dialogueService.buildServingContextEvents(cocktail, {
      reply: welcomeReply.text,
    })
    bartenderReply(
      welcomeReply.text,
      welcomeReply.expression,
      cocktail,
      'idle',
      [],
      () => recordConversationEvents(servingEvents),
    )
    return true
  }, [
    alcoholStarTotal,
    appendMessage,
    bartenderReply,
    dispatchDialogueSession,
    playScreenShakeCue,
    recommendationActive,
    recordConversationEvents,
    resetRecommendation,
    servedCocktail,
    sessionPhase,
    setErrorMessage,
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

  return { performWelcomeDrink, handleWelcomeDrink }
}
