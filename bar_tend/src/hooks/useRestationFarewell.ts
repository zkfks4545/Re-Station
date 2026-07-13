import { useCallback, type Dispatch } from 'react'
import { cocktails, getCocktailById } from '@/lib/cocktails/index.js'
import type { ConversationContextEvent } from '@/lib/dialogue/conversation-context.js'
import { DialogueService } from '@/lib/dialogue/dialogue-service.js'
import {
  decideFarewellEntry,
  type DialogueSessionAction,
  type DialogueSessionState,
} from '@/lib/session/dialogue-session.js'
import {
  formatStandardFarewellEntryResponse,
  formatWelcomeFarewellXyzResponse,
  formatXyzResponse,
} from '@/lib/session/farewell-replies.js'
import { XYZ_COCKTAIL_ID } from '@/lib/session/session-flow.js'
import { unlockCocktailId } from '@/lib/storage/cocktail-unlocks.js'
import type { CocktailData } from '@/types.js'
import type { BartenderReply } from './useRestationPresentation.js'

const dialogueService = new DialogueService(cocktails)

export function useRestationFarewell(input: {
  bartenderReply: BartenderReply
  dispatchDialogueSession: Dispatch<DialogueSessionAction>
  playScreenShakeCue(): void
  recordConversationEvents(events: ConversationContextEvent[]): void
  resetRecommendation(): void
  setServedCocktail(cocktail: CocktailData | null): void
  setUnlockedIds(ids: Set<string>): void
}) {
  const {
    bartenderReply,
    dispatchDialogueSession,
    playScreenShakeCue,
    recordConversationEvents,
    resetRecommendation,
    setServedCocktail,
    setUnlockedIds,
  } = input
  const serveXyzAndEnterFarewell = useCallback((
    entryKind: 'alcohol-xyz' | 'welcome-farewell-xyz',
  ) => {
    const xyzCocktail = getCocktailById(XYZ_COCKTAIL_ID)
    if (!xyzCocktail) {
      dispatchDialogueSession({ type: 'enter-farewell', entryKind: 'standard' })
      bartenderReply('마지막 잔 데이터를 찾지 못했어요. 오늘 주문은 여기까지 받을게요.', 'sympathy')
      return
    }

    dispatchDialogueSession({ type: 'enter-farewell', entryKind })
    playScreenShakeCue()
    setUnlockedIds(unlockCocktailId(xyzCocktail.id))
    const servingEvents = dialogueService.buildServingContextEvents(xyzCocktail)
    const reply = entryKind === 'welcome-farewell-xyz'
      ? formatWelcomeFarewellXyzResponse(xyzCocktail)
      : formatXyzResponse(xyzCocktail)
    bartenderReply(reply.text, reply.expression, xyzCocktail, 'idle', [], () => {
      recordConversationEvents(servingEvents)
      dispatchDialogueSession({ type: 'set-phase', phase: 'farewell' })
    })
  }, [
    bartenderReply,
    dispatchDialogueSession,
    playScreenShakeCue,
    recordConversationEvents,
    setUnlockedIds,
  ])

  const enterStandardFarewell = useCallback(() => {
    dispatchDialogueSession({ type: 'enter-farewell', entryKind: 'standard' })
    resetRecommendation()
    setServedCocktail(null)
    const reply = formatStandardFarewellEntryResponse()
    bartenderReply(reply.text, reply.expression)
  }, [bartenderReply, dispatchDialogueSession, resetRecommendation, setServedCocktail])

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

  return { beginFarewell }
}
