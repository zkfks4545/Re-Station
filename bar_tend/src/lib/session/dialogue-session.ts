import type { SessionPhase } from './session-flow.js'
import {
  createSessionAffect,
  type SessionAffect,
  type SessionAffectSnapshot,
} from './session-affect.js'
import type { InputRoute } from '../dialogue/input-router.js'

export type DialogueSessionMode = 'conversation' | 'recommendation'

export type { SessionAffect }

export type FarewellEntryKind =
  | 'none'
  | 'alcohol-xyz'
  | 'welcome-farewell-xyz'
  | 'standard'

export type SessionTopic =
  | 'none'
  | 'recommendation'
  | 'cocktail-story'
  | 'cocktail-info'
  | 'ingredient'
  | 'recipe'
  | 'smalltalk'
  | 'safety'

export interface PendingQuestion {
  kind: 'recommendation-flavor' | 'recommendation-strength' | 'recommendation-base' | 'recommendation-carbonation' | 'clarification'
  topic: Exclude<SessionTopic, 'none'>
  askedAtTurn: number
  sourcePlanId?: string
}

export interface DialogueSessionState {
  phase: SessionPhase
  mode: DialogueSessionMode
  sessionAffect: SessionAffect
  affectTurnsRemaining: number | null
  affectRecoveryTurns: number
  sessionTopic: SessionTopic
  topicCocktailId: string | null
  pendingQuestion: PendingQuestion | null
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
  | { type: 'set-session-affect'; affect: SessionAffectSnapshot }
  | { type: 'set-topic'; topic: SessionTopic; cocktailId?: string | null }
  | { type: 'set-pending-question'; question: PendingQuestion | null }
  | { type: 'record-conversation-turn'; recommendationPrompted: boolean }
  | { type: 'reset-conversation-progress' }
  | { type: 'welcome-served' }
  | { type: 'welcome-resolved' }
  | { type: 'cocktail-served'; cocktailId?: string }
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
    ...createSessionAffect('neutral'),
    sessionTopic: 'none',
    topicCocktailId: null,
    pendingQuestion: null,
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
  if (state.safetyLocked && action.type !== 'reset') return state

  switch (action.type) {
    case 'reset':
      return createDialogueSessionState(action.phase)
    case 'set-phase':
      return { ...state, phase: action.phase }
    case 'set-mode':
      return {
        ...state,
        mode: action.mode,
        pendingQuestion: action.mode === 'conversation' ? null : state.pendingQuestion,
      }
    case 'set-session-affect':
      return { ...state, ...action.affect }
    case 'set-topic':
      return {
        ...state,
        sessionTopic: action.topic,
        topicCocktailId: action.cocktailId === undefined ? state.topicCocktailId : action.cocktailId,
      }
    case 'set-pending-question':
      return { ...state, pendingQuestion: action.question }
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
    case 'cocktail-served':
      return {
        ...state,
        mode: 'conversation',
        sessionTopic: action.cocktailId ? 'cocktail-info' : state.sessionTopic,
        topicCocktailId: action.cocktailId ?? state.topicCocktailId,
        pendingQuestion: null,
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
        ...createSessionAffect('firm'),
        sessionTopic: 'safety',
        topicCocktailId: null,
        pendingQuestion: null,
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
        sessionTopic: 'smalltalk',
        topicCocktailId: null,
        pendingQuestion: null,
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

export function sessionTopicForRoute(route: InputRoute): SessionTopic {
  if (route === 'recommendation' || route === 'random-recommendation') return 'recommendation'
  if (route === 'story-query' || route === 'lore-query') return 'cocktail-story'
  if (route === 'cocktail-info-query') return 'cocktail-info'
  return route === 'safety' ? 'safety' : 'smalltalk'
}


export function decideFarewellEntry(
  state: DialogueSessionState,
  trigger: 'exit' | 'alcohol-limit',
): Exclude<FarewellEntryKind, 'none'> | null {
  if (state.safetyLocked) return null

  if (!state.welcomeDrink.served) return 'welcome-farewell-xyz'
  return trigger === 'alcohol-limit' ? 'alcohol-xyz' : 'standard'
}
