import { describe, expect, it } from 'vitest'
import {
  createDialogueSessionState,
  decideFarewellEntry,
  dialogueSessionReducer,
  isWelcomeDrinkFeedbackPending,
} from './dialogue-session.js'

describe('DialogueSessionState', () => {
  it('tracks welcome drink service and resolution without a separate FSM', () => {
    let state = createDialogueSessionState('conversation')
    expect(isWelcomeDrinkFeedbackPending(state)).toBe(false)

    state = dialogueSessionReducer(state, { type: 'welcome-served' })
    expect(state.welcomeDrink).toEqual({ served: true, resolved: false })
    expect(isWelcomeDrinkFeedbackPending(state)).toBe(true)

    state = dialogueSessionReducer(state, { type: 'welcome-resolved' })
    expect(isWelcomeDrinkFeedbackPending(state)).toBe(false)
  })

  it('keeps conversation progress in the session state', () => {
    const state = dialogueSessionReducer(
      createDialogueSessionState('conversation'),
      { type: 'record-conversation-turn', recommendationPrompted: true },
    )
    expect(state.dialogue).toEqual({ turnCount: 1, recommendationPrompted: true })
  })

  it('persists the affect selected by a conversational keyword', () => {
    const state = dialogueSessionReducer(
      createDialogueSessionState('conversation'),
      { type: 'set-session-affect', affect: { sessionAffect: 'concerned', affectTurnsRemaining: 3, affectRecoveryTurns: 0 } },
    )
    expect(state.sessionAffect).toBe('concerned')
  })

  it('uses Welcome-Farewell XYZ when farewell starts before a welcome drink', () => {
    const state = createDialogueSessionState('conversation')
    expect(decideFarewellEntry(state, 'exit')).toBe('welcome-farewell-xyz')
    expect(decideFarewellEntry(state, 'alcohol-limit')).toBe('welcome-farewell-xyz')
  })

  it('uses regular XYZ at the alcohol limit after a welcome drink', () => {
    const state = dialogueSessionReducer(
      createDialogueSessionState('conversation'),
      { type: 'welcome-served' },
    )
    expect(decideFarewellEntry(state, 'alcohol-limit')).toBe('alcohol-xyz')
  })

  it('hard-locks the session and suppresses every farewell entry after safety', () => {
    let active = dialogueSessionReducer(
      createDialogueSessionState('conversation'),
      { type: 'welcome-served' },
    )
    active = dialogueSessionReducer(active, { type: 'set-mode', mode: 'recommendation' })
    active = dialogueSessionReducer(active, {
      type: 'enter-farewell',
      entryKind: 'welcome-farewell-xyz',
    })
    const locked = dialogueSessionReducer(active, { type: 'lock-safety' })

    expect(locked.phase).toBe('safetyLocked')
    expect(locked.safetyLocked).toBe(true)
    expect(locked.mode).toBe('conversation')
    expect(locked.sessionAffect).toBe('firm')
    expect(locked.welcomeDrink.resolved).toBe(true)
    expect(locked.farewell.entryKind).toBe('none')
    expect(decideFarewellEntry(locked, 'exit')).toBeNull()
    expect(decideFarewellEntry(locked, 'alcohol-limit')).toBeNull()
  })

  it('enters the correct phase and resets farewell counters', () => {
    const state = dialogueSessionReducer(
      createDialogueSessionState('aftertalk'),
      { type: 'enter-farewell', entryKind: 'welcome-farewell-xyz' },
    )
    expect(state.phase).toBe('xyz')
    expect(state.farewell).toEqual({ entryKind: 'welcome-farewell-xyz', turnCount: 0 })
  })

  it('returns to conversation mode whenever a cocktail service completes', () => {
    const recommending = dialogueSessionReducer(
      createDialogueSessionState('conversation'),
      { type: 'set-mode', mode: 'recommendation' },
    )
    const served = dialogueSessionReducer(recommending, { type: 'cocktail-served' })

    expect(served.mode).toBe('conversation')
  })

  it('keeps safetyLocked absorbing until an explicit session reset', () => {
    const locked = dialogueSessionReducer(
      createDialogueSessionState('conversation'),
      { type: 'lock-safety' },
    )
    const attemptedActions = [
      { type: 'set-mode', mode: 'recommendation' } as const,
      { type: 'welcome-served' } as const,
      { type: 'set-alcohol-total', total: 20 } as const,
      { type: 'enter-farewell', entryKind: 'alcohol-xyz' } as const,
      { type: 'set-phase', phase: 'xyz' } as const,
    ]

    for (const action of attemptedActions) {
      expect(dialogueSessionReducer(locked, action)).toEqual(locked)
    }

    const reset = dialogueSessionReducer(locked, { type: 'reset', phase: 'conversation' })
    expect(reset.safetyLocked).toBe(false)
    expect(reset.phase).toBe('conversation')
  })
})
