import { describe, expect, it, vi } from 'vitest'
import type { CocktailData } from '@/types.js'
import {
  runRestationInteraction,
  type RestationInteractionHandlers,
} from './restation-interaction-runner.js'

function createHandlers(): RestationInteractionHandlers {
  return {
    send: vi.fn(),
    welcomeDrink: vi.fn(() => true),
    startRecommendation: vi.fn(() => true),
    recommendationAnswer: vi.fn(() => true),
    orderCocktail: vi.fn(() => true),
    storyFromCard: vi.fn(() => true),
    cancelRecommendation: vi.fn(() => true),
  }
}

describe('Restation interaction runner', () => {
  it('maps queued payloads to their matching handlers', () => {
    const cocktail = { id: 'test-cocktail' } as CocktailData
    const handlers = createHandlers()

    expect(runRestationInteraction({ type: 'send', text: 'hello' }, handlers)).toBe(true)
    runRestationInteraction({ type: 'welcome-drink' }, handlers)
    runRestationInteraction({ type: 'start-recommendation' }, handlers)
    runRestationInteraction({
      type: 'recommendation-answer',
      input: { sessionId: 'recommendation-1', questionId: 'flavor-profile', answerValue: '달콤하게' },
    }, handlers)
    runRestationInteraction({ type: 'order-cocktail', cocktail }, handlers)
    runRestationInteraction({ type: 'story-from-card', cocktail, sessionId: 'conversation' }, handlers)
    runRestationInteraction({ type: 'cancel-recommendation' }, handlers)

    expect(handlers.send).toHaveBeenCalledWith('hello')
    expect(handlers.welcomeDrink).toHaveBeenCalledOnce()
    expect(handlers.startRecommendation).toHaveBeenCalledOnce()
    expect(handlers.recommendationAnswer).toHaveBeenCalledWith({
      sessionId: 'recommendation-1', questionId: 'flavor-profile', answerValue: '달콤하게',
    })
    expect(handlers.orderCocktail).toHaveBeenCalledWith(cocktail)
    expect(handlers.storyFromCard).toHaveBeenCalledWith(cocktail, 'conversation')
    expect(handlers.cancelRecommendation).toHaveBeenCalledOnce()
  })

  it('preserves a rejected handler result so the queue can continue draining', () => {
    const handlers = createHandlers()
    vi.mocked(handlers.welcomeDrink).mockReturnValue(false)

    expect(runRestationInteraction({ type: 'welcome-drink' }, handlers)).toBe(false)
  })
})
