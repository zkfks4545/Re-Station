import type { CocktailData, Message } from '@/types.js'
import type { ConversationContextState } from '@/lib/dialogue/conversation-context.js'
import type { RecommendationQuestion } from '@/types/recommendation.js'
import { createConversationContextSnapshot } from '@/lib/dialogue/conversation-context-snapshot.js'
import type { DialogueServiceRequest } from '@/lib/dialogue/dialogue-service.js'
import type {
  DialogueSessionMode,
  DialogueSessionState,
} from '@/lib/session/dialogue-session.js'

interface RestationDialogueRequestInput {
  text: string
  messages: Message[]
  conversationContext: ConversationContextState
  dialogueSession: DialogueSessionState
  effectiveSessionMode: DialogueSessionMode
  activeQuestion: RecommendationQuestion | null
  welcomeDrinkFeedbackPending: boolean
  welcomeDrinkServed: boolean
  alcoholStarTotal: number
  totalUserMessages: number
  displayedCocktail: CocktailData | null
}

export function createRestationDialogueRequest(
  input: RestationDialogueRequestInput,
): DialogueServiceRequest {
  return {
    text: input.text,
    messages: input.messages,
    conversationContext: input.conversationContext,
    session: {
      phase: input.dialogueSession.phase,
      activeRecommendationSession:
        input.effectiveSessionMode === 'recommendation' && input.activeQuestion !== null,
      allowRecommendationRoutes:
        input.effectiveSessionMode === 'recommendation' || input.welcomeDrinkFeedbackPending,
      welcomeDrinkUsed: input.welcomeDrinkServed,
      alcoholStarsTotal: input.alcoholStarTotal,
      totalUserMessages: input.totalUserMessages,
      conversationTurnCount: input.dialogueSession.dialogue.turnCount,
      sessionAffect: input.dialogueSession.sessionAffect,
      sessionTopic: input.dialogueSession.sessionTopic,
      pendingQuestion: input.dialogueSession.pendingQuestion,
    },
    displayedCocktail: input.displayedCocktail,
    continuationContext: createConversationContextSnapshot(
      input.dialogueSession,
      input.conversationContext,
    ),
  }
}
