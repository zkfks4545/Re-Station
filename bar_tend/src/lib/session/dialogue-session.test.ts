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
})
