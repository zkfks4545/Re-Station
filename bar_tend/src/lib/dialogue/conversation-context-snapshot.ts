import type { ConversationContextState } from './conversation-context.js'
import type { DialogueSessionState } from '../session/dialogue-session.js'

export interface ConversationContextSnapshot {
  topic: DialogueSessionState['sessionTopic']
  affect: DialogueSessionState['sessionAffect']
  subject: { type: 'cocktail' | 'recommendation' | 'none'; id: string | null }
  pendingQuestion: DialogueSessionState['pendingQuestion']
  recommendationActive: boolean
  safetyLocked: boolean
}

export function createConversationContextSnapshot(
  session: DialogueSessionState,
  conversation: ConversationContextState,
): ConversationContextSnapshot {
  const cocktailId = session.topicCocktailId
    ?? conversation.lastStoryTargetCocktailId
    ?? conversation.lastDiscussedCocktailId
  return {
    topic: session.sessionTopic,
    affect: session.sessionAffect,
    subject: session.sessionTopic === 'recommendation'
      ? { type: 'recommendation', id: null }
      : { type: cocktailId ? 'cocktail' : 'none', id: cocktailId },
    pendingQuestion: session.pendingQuestion,
    recommendationActive: session.mode === 'recommendation',
    safetyLocked: session.safetyLocked,
  }
}
