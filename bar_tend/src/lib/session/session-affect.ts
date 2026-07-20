import type { Expression } from '../../types.js'
import type { InputRoute } from '../dialogue/input-router.js'

/** Persistent emotional context. This is distinct from one-turn Expression. */
export type SessionAffect = 'neutral' | 'warm' | 'curious' | 'concerned' | 'playful' | 'guarded' | 'firm'

export interface SessionAffectSnapshot {
  sessionAffect: SessionAffect
  affectTurnsRemaining: number | null
  affectRecoveryTurns: number
}

const DECAY_TURNS: Record<SessionAffect, number | null> = {
  neutral: 0,
  warm: 1,
  curious: 1,
  playful: 2,
  concerned: 3,
  guarded: null,
  firm: null,
}

const ALLOWED_EXPRESSIONS: Record<SessionAffect, readonly Expression[]> = {
  neutral: ['idle', 'talk', 'thinking', 'smirk', 'surprised'],
  warm: ['talk', 'smirk', 'thinking', 'idle'],
  curious: ['thinking', 'talk', 'idle'],
  concerned: ['sympathy', 'thinking', 'idle', 'talk'],
  playful: ['smirk', 'talk', 'surprised', 'idle'],
  guarded: ['annoyed', 'stern', 'thinking', 'idle'],
  firm: ['stern', 'annoyed', 'idle'],
}

const FALLBACK_EXPRESSION: Record<SessionAffect, Expression> = {
  neutral: 'talk', warm: 'talk', curious: 'thinking', concerned: 'sympathy',
  playful: 'smirk', guarded: 'annoyed', firm: 'stern',
}

const CONTROL_ROUTES: readonly InputRoute[] = [
  'exit', 'recommendation-cancel', 'random-recommendation', 'lore-based-order',
  'explicit-cocktail', 'unknown-cocktail-query', 'recommendation',
]

function isRepairInput(input: string): boolean {
  return /미안|죄송|사과|심했|그럴s*뜻.*없|천천히|부탁/.test(input.toLowerCase())
}

export function transitionSessionAffect(
  previous: SessionAffectSnapshot,
  options: { candidate?: SessionAffect; route: InputRoute; input: string },
): SessionAffectSnapshot {
  // Priority: Safety > control route > keyword/context candidate > existing state.
  if (options.route === 'safety') return { sessionAffect: 'firm', affectTurnsRemaining: null, affectRecoveryTurns: 0 }
  if (CONTROL_ROUTES.includes(options.route)) return decaySessionAffect(previous)

  const repaired = isRepairInput(options.input)
  if (previous.sessionAffect === 'firm') return previous
  if (previous.sessionAffect === 'guarded') {
    if (!repaired) return { ...previous, affectRecoveryTurns: 0 }
    const recoveryTurns = previous.affectRecoveryTurns + 1
    return recoveryTurns >= 2
      ? { sessionAffect: 'neutral', affectTurnsRemaining: 0, affectRecoveryTurns: 0 }
      : { ...previous, affectRecoveryTurns: recoveryTurns }
  }

  if (options.candidate) return createSessionAffect(options.candidate)
  return decaySessionAffect(previous)
}

export function createSessionAffect(sessionAffect: SessionAffect): SessionAffectSnapshot {
  return { sessionAffect, affectTurnsRemaining: DECAY_TURNS[sessionAffect], affectRecoveryTurns: 0 }
}

export function decaySessionAffect(previous: SessionAffectSnapshot): SessionAffectSnapshot {
  if (previous.affectTurnsRemaining === null || previous.affectTurnsRemaining <= 0) {
    return previous.sessionAffect === 'neutral' ? previous : createSessionAffect('neutral')
  }
  const remaining = previous.affectTurnsRemaining - 1
  return remaining <= 0
    ? createSessionAffect('neutral')
    : { ...previous, affectTurnsRemaining: remaining }
}

export function expressionForSessionAffect(expression: Expression, sessionAffect: SessionAffect): Expression {
  return ALLOWED_EXPRESSIONS[sessionAffect].includes(expression)
    ? expression
    : FALLBACK_EXPRESSION[sessionAffect]
}
