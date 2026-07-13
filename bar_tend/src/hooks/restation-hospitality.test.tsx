import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createDialogueSessionState } from '@/lib/session/dialogue-session.js'
import type { BartenderReply } from './useRestationPresentation.js'
import { useRestationFarewell } from './useRestationFarewell.js'
import { useRestationWelcomeDrink } from './useRestationWelcomeDrink.js'

describe('Restation hospitality hooks', () => {
  it('blocks a welcome drink while a recommendation is active', () => {
    let performWelcomeDrink: (() => boolean) | undefined
    const dispatchDialogueSession = vi.fn()

    function Harness() {
      ({ performWelcomeDrink } = useRestationWelcomeDrink({
        recommendationActive: true,
        servedCocktail: null,
        welcomeDrinkServed: false,
        welcomeDrinkFeedbackPending: false,
        sessionPhase: 'conversation',
        alcoholStarTotal: 0,
        interactionStatus: 'idle',
        appendMessage: vi.fn(),
        bartenderReply: vi.fn(),
        dispatchDialogueSession,
        enqueueInteraction: vi.fn(),
        playScreenShakeCue: vi.fn(),
        recordConversationEvents: vi.fn(),
        resetRecommendation: vi.fn(),
        setErrorMessage: vi.fn(),
        setUnlockedIds: vi.fn(),
      }))
      return null
    }

    renderToStaticMarkup(<Harness />)

    expect(performWelcomeDrink?.()).toBe(false)
    expect(dispatchDialogueSession).not.toHaveBeenCalled()
  })

  it('dispatches and presents an accepted welcome drink', () => {
    let performWelcomeDrink: (() => boolean) | undefined
    const appendMessage = vi.fn()
    const bartenderReply = vi.fn() as unknown as BartenderReply
    const dispatchDialogueSession = vi.fn()
    const setUnlockedIds = vi.fn()

    function Harness() {
      ({ performWelcomeDrink } = useRestationWelcomeDrink({
        recommendationActive: false,
        servedCocktail: null,
        welcomeDrinkServed: false,
        welcomeDrinkFeedbackPending: false,
        sessionPhase: 'conversation',
        alcoholStarTotal: 0,
        interactionStatus: 'idle',
        appendMessage,
        bartenderReply,
        dispatchDialogueSession,
        enqueueInteraction: vi.fn(),
        playScreenShakeCue: vi.fn(),
        recordConversationEvents: vi.fn(),
        resetRecommendation: vi.fn(),
        setErrorMessage: vi.fn(),
        setUnlockedIds,
      }))
      return null
    }

    renderToStaticMarkup(<Harness />)

    expect(performWelcomeDrink?.()).toBe(true)
    expect(dispatchDialogueSession).toHaveBeenCalledWith({ type: 'welcome-served' })
    expect(appendMessage).toHaveBeenCalledWith({ role: 'user', text: '웰컴 드링크' })
    expect(setUnlockedIds).toHaveBeenCalledOnce()
    expect(bartenderReply).toHaveBeenCalledOnce()
  })

  it('enters the standard farewell flow after a served welcome drink', () => {
    let beginFarewell: ReturnType<typeof useRestationFarewell>['beginFarewell'] | undefined
    const bartenderReply = vi.fn() as unknown as BartenderReply
    const dispatchDialogueSession = vi.fn()
    const resetRecommendation = vi.fn()
    const state = createDialogueSessionState()
    state.welcomeDrink.served = true

    function Harness() {
      ({ beginFarewell } = useRestationFarewell({
        bartenderReply,
        dispatchDialogueSession,
        playScreenShakeCue: vi.fn(),
        recordConversationEvents: vi.fn(),
        resetRecommendation,
        setServedCocktail: vi.fn(),
        setUnlockedIds: vi.fn(),
      }))
      return null
    }

    renderToStaticMarkup(<Harness />)
    beginFarewell?.(state, 'exit')

    expect(dispatchDialogueSession).toHaveBeenCalledWith({
      type: 'enter-farewell',
      entryKind: 'standard',
    })
    expect(resetRecommendation).toHaveBeenCalled()
    expect(bartenderReply).toHaveBeenCalledOnce()
  })
})
