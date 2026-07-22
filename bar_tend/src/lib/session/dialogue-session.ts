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

export type ConversationTopic =
  | 'none'
  | 'recommendation'
  | 'cocktail-story'
  | 'cocktail-info'
  | 'ingredient'
  | 'recipe'
  | 'smalltalk'
  | 'world-building'
  | 'character'
  | 'daily-life'
  | 'worldview'
  | 'knowledge'
  | 'safety'

export type SessionTopic = ConversationTopic

export interface PendingQuestion {
  sessionId: string
  questionId: string
  kind: 'recommendation-flavor' | 'recommendation-strength' | 'recommendation-base' | 'recommendation-carbonation' | 'clarification'
  topic: Exclude<SessionTopic, 'none'>
  askedAtTurn: number
  sourcePlanId?: string
}

export type SuspendedQuestion = PendingQuestion

export interface DialogueSessionState {
  phase: SessionPhase
  mode: DialogueSessionMode
  activeSessionId: string
  sessionAffect: SessionAffect
  affectTurnsRemaining: number | null
  affectRecoveryTurns: number
  sessionTopic: SessionTopic
  topicCocktailId: string | null
  pendingQuestion: PendingQuestion | null
  suspendedQuestion: SuspendedQuestion | null
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
  | { type: 'switch-to-recommendation'; sessionId: string; question: PendingQuestion }
  | { type: 'set-session-affect'; affect: SessionAffectSnapshot }
  | { type: 'set-topic'; topic: SessionTopic; cocktailId?: string | null }
  | { type: 'set-pending-question'; question: PendingQuestion | null }
  | { type: 'suspend-question'; topic: Exclude<ConversationTopic, 'none' | 'recommendation' | 'safety'> }
  | { type: 'resume-question' }
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
    activeSessionId: 'conversation',
    ...createSessionAffect('neutral'),
    sessionTopic: 'none',
    topicCocktailId: null,
    pendingQuestion: null,
    suspendedQuestion: null,
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
        activeSessionId: action.mode === 'conversation' ? 'conversation' : state.activeSessionId,
        sessionTopic: action.mode === 'conversation' ? 'smalltalk' : state.sessionTopic,
        topicCocktailId: action.mode === 'conversation' ? null : state.topicCocktailId,
        pendingQuestion: action.mode === 'conversation' ? null : state.pendingQuestion,
        suspendedQuestion: action.mode === 'conversation' ? null : state.suspendedQuestion,
      }
    case 'switch-to-recommendation':
      return {
        ...state,
        mode: 'recommendation',
        activeSessionId: action.sessionId,
        sessionTopic: 'recommendation',
        topicCocktailId: null,
        pendingQuestion: { ...action.question, sessionId: action.sessionId },
        suspendedQuestion: null,
        dialogue: { turnCount: 0, recommendationPrompted: false },
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
      return {
        ...state,
        pendingQuestion: action.question,
        suspendedQuestion: action.question === null ? null : state.suspendedQuestion,
      }
    case 'suspend-question':
      return {
        ...state,
        sessionTopic: action.topic,
        suspendedQuestion: state.pendingQuestion,
      }
    case 'resume-question':
      return {
        ...state,
        sessionTopic: state.pendingQuestion ? 'recommendation' : state.sessionTopic,
        suspendedQuestion: null,
      }
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
        activeSessionId: 'conversation',
        sessionTopic: action.cocktailId ? 'cocktail-info' : state.sessionTopic,
        topicCocktailId: action.cocktailId ?? state.topicCocktailId,
        pendingQuestion: null,
        suspendedQuestion: null,
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
        activeSessionId: 'conversation',
        ...createSessionAffect('firm'),
        sessionTopic: 'safety',
        topicCocktailId: null,
        pendingQuestion: null,
        suspendedQuestion: null,
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
        activeSessionId: 'conversation',
        sessionTopic: 'smalltalk',
        topicCocktailId: null,
        pendingQuestion: null,
        suspendedQuestion: null,
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

export function isActiveSessionInput(
  state: Pick<DialogueSessionState, 'mode' | 'activeSessionId'>,
  sessionId: string,
  mode: DialogueSessionMode,
): boolean {
  return state.mode === mode && state.activeSessionId === sessionId
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
