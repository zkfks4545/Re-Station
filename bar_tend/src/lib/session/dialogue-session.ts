import type { SessionPhase } from './session-flow.js'

export type DialogueSessionMode = 'conversation' | 'recommendation'

export type FarewellEntryKind =
  | 'none'
  | 'alcohol-xyz'
  | 'welcome-farewell-xyz'
  | 'standard'

export interface DialogueSessionState {
  phase: SessionPhase
  mode: DialogueSessionMode
  safetyLocked: boolean
  dialogue: {
    turnCount: number
    recommendationPrompted: boolean
  }
  welcomeDrink: {
    served: boolean
    resolved: boolean
  }
  order: {
    alcoholStarTotal: number
  }
  farewell: {
    entryKind: FarewellEntryKind
    turnCount: number
  }
}

export type DialogueSessionAction =
  | { type: 'reset'; phase?: SessionPhase }
  | { type: 'set-phase'; phase: SessionPhase }
  | { type: 'set-mode'; mode: DialogueSessionMode }
  | { type: 'record-conversation-turn'; recommendationPrompted: boolean }
  | { type: 'reset-conversation-progress' }
  | { type: 'welcome-served' }
  | { type: 'welcome-resolved' }
  | { type: 'set-alcohol-total'; total: number }
  | { type: 'lock-safety' }
  | { type: 'enter-farewell'; entryKind: Exclude<FarewellEntryKind, 'none'> }
  | { type: 'increment-farewell-turn' }

export function createDialogueSessionState(
  phase: SessionPhase = 'entry',
): DialogueSessionState {
  return {
    phase,
    mode: 'conversation',
    safetyLocked: false,
    dialogue: {
      turnCount: 0,
      recommendationPrompted: false,
    },
    welcomeDrink: {
      served: false,
      resolved: false,
    },
    order: {
      alcoholStarTotal: 0,
    },
    farewell: {
      entryKind: 'none',
      turnCount: 0,
    },
  }
}

export function dialogueSessionReducer(
  state: DialogueSessionState,
  action: DialogueSessionAction,
): DialogueSessionState {
  switch (action.type) {
    case 'reset':
      return createDialogueSessionState(action.phase)
    case 'set-phase':
      return { ...state, phase: action.phase }
    case 'set-mode':
      return { ...state, mode: action.mode }
    case 'record-conversation-turn':
      return {
        ...state,
        dialogue: {
          turnCount: state.dialogue.turnCount + 1,
          recommendationPrompted:
            state.dialogue.recommendationPrompted || action.recommendationPrompted,
        },
      }
    case 'reset-conversation-progress':
      return {
        ...state,
        dialogue: { turnCount: 0, recommendationPrompted: false },
      }
    case 'welcome-served':
      return {
        ...state,
        welcomeDrink: { served: true, resolved: false },
      }
    case 'welcome-resolved':
      return {
        ...state,
        welcomeDrink: { ...state.welcomeDrink, resolved: true },
      }
    case 'set-alcohol-total':
      return {
        ...state,
        order: { alcoholStarTotal: action.total },
      }
    case 'lock-safety':
      return {
        ...state,
        phase: 'safetyLocked',
        mode: 'conversation',
        safetyLocked: true,
        welcomeDrink: { ...state.welcomeDrink, resolved: true },
        farewell: { entryKind: 'none', turnCount: 0 },
      }
    case 'enter-farewell':
      return {
        ...state,
        phase: action.entryKind === 'alcohol-xyz' || action.entryKind === 'welcome-farewell-xyz'
          ? 'xyz'
          : 'farewell',
        mode: 'conversation',
        welcomeDrink: {
          ...state.welcomeDrink,
          resolved: true,
        },
        farewell: {
          entryKind: action.entryKind,
          turnCount: 0,
        },
      }
    case 'increment-farewell-turn':
      return {
        ...state,
        farewell: {
          ...state.farewell,
          turnCount: state.farewell.turnCount + 1,
        },
      }
  }
}

export function isWelcomeDrinkFeedbackPending(state: DialogueSessionState): boolean {
  return state.welcomeDrink.served && !state.welcomeDrink.resolved
}

export function decideFarewellEntry(
  state: DialogueSessionState,
  trigger: 'exit' | 'alcohol-limit',
): Exclude<FarewellEntryKind, 'none'> | null {
  if (state.safetyLocked) return null

  if (!state.welcomeDrink.served) return 'welcome-farewell-xyz'
  return trigger === 'alcohol-limit' ? 'alcohol-xyz' : 'standard'
}
