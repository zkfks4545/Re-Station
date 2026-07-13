import { describe, expect, it } from 'vitest'
import { createConversationContext } from '@/lib/dialogue/conversation-context.js'
import { createDialogueSessionState, dialogueSessionReducer } from '@/lib/session/dialogue-session.js'
import { createRestationDialogueRequest } from './restation-dialogue-request.js'

describe('restation dialogue request builder', () => {
  it('maps controller state into the DialogueService boundary without UI state leakage', () => {
    let session = createDialogueSessionState('conversation')
    session = dialogueSessionReducer(session, {
      type: 'set-topic',
      topic: 'recommendation',
    })
    const request = createRestationDialogueRequest({
      text: '추천받기',
      messages: [{ role: 'user', text: '추천받기' }],
      conversationContext: createConversationContext(),
      dialogueSession: session,
      effectiveSessionMode: 'recommendation',
      activeQuestion: null,
      welcomeDrinkFeedbackPending: false,
      welcomeDrinkServed: true,
      alcoholStarTotal: 3,
      totalUserMessages: 2,
      displayedCocktail: null,
    })

    expect(request.session).toMatchObject({
      phase: 'conversation',
      activeRecommendationSession: false,
      allowRecommendationRoutes: true,
      welcomeDrinkUsed: true,
      alcoholStarsTotal: 3,
      totalUserMessages: 2,
      sessionTopic: 'recommendation',
    })
    expect(request.continuationContext).toMatchObject({
      topic: 'recommendation',
    })
  })
})
