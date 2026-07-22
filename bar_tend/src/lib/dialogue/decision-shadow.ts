import type { CocktailData } from '../../types.js'
import type {
  RecommendationQuestion,
  RecommendationSignal,
  RecommendationState,
} from '../../types/recommendation.js'
import type { DialogueSessionAction } from '../session/dialogue-session.js'
import {
  applyRecommendationSignals,
  resolveCocktailsByRecommendationState,
} from '../recommendation/state.js'
import { pickFromPool, selectNextQuestion } from '../recommendation/question-engine.js'
import type { DialogueAction } from './action-resolver.js'
import type {
  EvidenceSpan,
  InputUnderstanding,
  PreferenceSignal,
  SignalSource,
} from './input-understanding.js'

export interface EvaluationContribution {
  code: string
  score: number
}

interface EvaluationBase {
  candidateId: string
  eligible: boolean
  score: number
  hardConstraints: readonly string[]
  contributions: readonly EvaluationContribution[]
}

export interface CocktailEvaluation extends EvaluationBase {
  candidate: CocktailData
}

export interface QuestionEvaluation extends EvaluationBase {
  candidate: RecommendationQuestion
}

export interface DialogueEvaluation extends EvaluationBase {
  candidate: DialogueAction
}

export interface Selection<T extends EvaluationBase> {
  selected: T | null
  evaluations: readonly T[]
}

export type PreferenceScope =
  | { type: 'general' }
  | { type: 'session' }
  | { type: 'entity'; entityId: string }

export interface PreferenceEvidence {
  field: RecommendationSignal['field']
  value: RecommendationSignal['value']
  strength: number
  scope: PreferenceScope
  evidence: readonly EvidenceSpan[]
  source: SignalSource | 'question'
  observedAtTurn: number
}

export interface PreferenceProjectionContext {
  includeSession: boolean
  entityId?: string | null
}

export type DialogueMoveType =
  | 'safety'
  | 'exit'
  | 'cancel-recommendation'
  | 'recommend'
  | 'serve-order'
  | 'continue-story'
  | 'discuss'
  | 'respond'

export interface DialogueMove {
  type: DialogueMoveType
  action: DialogueAction
  transitions: readonly DialogueSessionAction[]
}

export function selectDeterministically<T extends EvaluationBase>(
  evaluations: readonly T[],
): Selection<T> {
  const selected = [...evaluations]
    .filter(({ eligible, hardConstraints }) => eligible && hardConstraints.length === 0)
    .sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId))[0]
    ?? null
  return { selected, evaluations }
}

export function evaluateLegacyCocktailSelection(
  pool: readonly CocktailData[],
  state: RecommendationState,
): CocktailEvaluation[] {
  const resolved = resolveCocktailsByRecommendationState([...pool], state).cocktails
  const eligibleIds = new Set(resolved.map(({ id }) => id))
  const selectedId = pickFromPool(resolved, state.taste)?.id ?? null

  return pool.map((candidate) => {
    const eligible = eligibleIds.has(candidate.id)
    const score = candidate.id === selectedId ? 2 : eligible ? 1 : 0
    return {
      candidate,
      candidateId: candidate.id,
      eligible,
      score,
      hardConstraints: eligible ? [] : ['legacy-ineligible'],
      contributions: [{ code: 'legacy-selection', score }],
    }
  })
}

export function evaluateLegacyQuestionSelection(
  pool: readonly CocktailData[],
  state: RecommendationState,
  questions: readonly RecommendationQuestion[],
): QuestionEvaluation[] {
  const selectedId = selectNextQuestion([...pool], state)?.id ?? null
  return questions.map((candidate) => {
    const eligible = candidate.id === selectedId
    const score = eligible ? 1 : 0
    return {
      candidate,
      candidateId: candidate.id,
      eligible,
      score,
      hardConstraints: eligible ? [] : ['legacy-not-selected'],
      contributions: [{ code: 'legacy-selection', score }],
    }
  })
}

export function evaluateLegacyDialogueAction(
  action: DialogueAction,
  blockedBySession: boolean,
): DialogueEvaluation {
  return {
    candidate: action,
    candidateId: dialogueActionKey(action),
    eligible: !blockedBySession,
    score: blockedBySession ? 0 : 1,
    hardConstraints: blockedBySession ? ['session-blocked'] : [],
    contributions: [{ code: 'legacy-action', score: blockedBySession ? 0 : 1 }],
  }
}

export function recordPreferenceEvidence(
  ledger: readonly PreferenceEvidence[],
  signals: readonly PreferenceSignal[],
  options: { strength: number; scope: PreferenceScope; observedAtTurn: number },
): PreferenceEvidence[] {
  const strength = Math.max(0, Math.min(1, options.strength))
  return [
    ...ledger,
    ...signals.map((signal) => ({
      field: signal.field,
      value: signal.value,
      strength,
      scope: options.scope,
      evidence: signal.evidence,
      source: signal.source,
      observedAtTurn: options.observedAtTurn,
    })),
  ]
}

export function deriveRecommendationStateFromEvidence(
  base: RecommendationState,
  ledger: readonly PreferenceEvidence[],
  context: PreferenceProjectionContext,
): RecommendationState {
  const selected = new Map<string, { item: PreferenceEvidence; index: number }>()

  ledger.forEach((item, index) => {
    if (!scopeApplies(item.scope, context)) return
    const key = accumulatesValues(item.field)
      ? `${item.field}:${String(item.value)}`
      : item.field
    const current = selected.get(key)
    if (!current || hasHigherPreferencePriority(item, index, current.item, current.index, context)) {
      selected.set(key, { item, index })
    }
  })

  const signals: RecommendationSignal[] = [...selected.values()]
    .sort((a, b) => a.index - b.index)
    .map(({ item }) => ({
      field: item.field,
      value: item.value,
      confidence: item.strength,
      source: item.source === 'question' ? 'question' : 'rule',
      evidence: item.evidence.map(({ text }) => text).join(' | '),
    }))

  return applyRecommendationSignals(base, signals)
}

export function planShadowDialogueMove(
  action: DialogueAction,
  understanding: InputUnderstanding,
): DialogueMove {
  const controls = new Set(understanding.controlIntents.map(({ value }) => value))
  if (controls.has('safety')) {
    return { type: 'safety', action, transitions: [{ type: 'lock-safety' }] }
  }
  if (controls.has('cancel-recommendation')) {
    return {
      type: 'cancel-recommendation',
      action,
      transitions: [{ type: 'set-mode', mode: 'conversation' }],
    }
  }
  if (controls.has('exit')) return { type: 'exit', action, transitions: [] }

  const type: DialogueMoveType = action.type === 'recommend'
    ? 'recommend'
    : action.type === 'order' || action.type === 'loreBasedOrder'
      ? 'serve-order'
      : action.type === 'continueStory'
        ? 'continue-story'
        : action.type === 'discuss'
          ? 'discuss'
          : 'respond'
  return { type, action, transitions: [] }
}

export function dialogueActionKey(action: DialogueAction): string {
  if (action.type === 'recommend') return `${action.type}:${action.mode}`
  if (action.type === 'continueStory') return `${action.type}:${action.topic}:${action.cocktailId ?? 'none'}`
  if ('cocktailId' in action) return `${action.type}:${action.cocktailId}`
  return action.type
}

function scopeApplies(scope: PreferenceScope, context: PreferenceProjectionContext): boolean {
  if (scope.type === 'general') return true
  if (scope.type === 'session') return context.includeSession
  return scope.entityId === context.entityId
}

function hasHigherPreferencePriority(
  candidate: PreferenceEvidence,
  candidateIndex: number,
  current: PreferenceEvidence,
  currentIndex: number,
  context: PreferenceProjectionContext,
): boolean {
  const candidateScope = scopePriority(candidate.scope, context)
  const currentScope = scopePriority(current.scope, context)
  if (candidateScope !== currentScope) return candidateScope > currentScope
  if (candidate.strength !== current.strength) return candidate.strength > current.strength
  if (candidate.observedAtTurn !== current.observedAtTurn) {
    return candidate.observedAtTurn > current.observedAtTurn
  }
  return candidateIndex > currentIndex
}

function scopePriority(scope: PreferenceScope, context: PreferenceProjectionContext): number {
  if (scope.type === 'entity' && scope.entityId === context.entityId) return 3
  return scope.type === 'session' ? 2 : 1
}

function accumulatesValues(field: RecommendationSignal['field']): boolean {
  return field === 'moods'
    || field === 'situations'
    || field === 'preferredIngredients'
    || field === 'excludedIngredients'
}
