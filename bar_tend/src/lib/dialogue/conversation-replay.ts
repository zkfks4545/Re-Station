export type ReplayDifferenceSeverity = 'critical' | 'major' | 'review' | 'allowed'

export interface ConversationReplaySnapshot {
  input: string
  intent: string
  route: string
  action: string
  primaryTopic: string
  speechAct: string
  entityId: string | null
  controlIntent: string | null
  preferenceProjection: string
  preferenceProjectionCompatible: boolean
  move: string
  transitionPlan: string
  blockedBySession: boolean
  phase: string
  mode: string
  topic: string
  pendingQuestion: string | null
  suspendedQuestion: string | null
  safetyLocked: boolean
  selectedCocktailId: string | null
  responsePlanId: string | null
  expression: string | null
  reply: string | null
}

export type ConversationReplayField = Exclude<keyof ConversationReplaySnapshot, 'input'>
export type ConversationReplayExpected = Partial<Omit<ConversationReplaySnapshot, 'input'>>

export interface ConversationReplayTurn {
  input: string
  expected: ConversationReplayExpected
}

export interface ConversationReplayScenario {
  id: string
  turns: readonly ConversationReplayTurn[]
}

export interface ReplayDifference {
  scenarioId: string
  turn: number
  input: string
  field: ConversationReplayField
  severity: ReplayDifferenceSeverity
  expected: ConversationReplaySnapshot[ConversationReplayField]
  actual: ConversationReplaySnapshot[ConversationReplayField]
}

export interface ConversationReplayResult {
  snapshots: ConversationReplaySnapshot[]
  differences: ReplayDifference[]
  blockingDifferences: ReplayDifference[]
}

export type ConversationReplayPlayer = (
  input: string,
  turn: number,
) => ConversationReplaySnapshot

export const REPLAY_FIELD_SEVERITY: Record<ConversationReplayField, ReplayDifferenceSeverity> = {
  intent: 'major',
  route: 'major',
  action: 'major',
  primaryTopic: 'major',
  speechAct: 'major',
  entityId: 'critical',
  controlIntent: 'critical',
  preferenceProjection: 'major',
  preferenceProjectionCompatible: 'critical',
  move: 'critical',
  transitionPlan: 'critical',
  blockedBySession: 'critical',
  phase: 'critical',
  mode: 'critical',
  topic: 'review',
  pendingQuestion: 'critical',
  suspendedQuestion: 'critical',
  safetyLocked: 'critical',
  selectedCocktailId: 'critical',
  responsePlanId: 'major',
  expression: 'review',
  reply: 'allowed',
}

export function runConversationReplay(
  scenario: ConversationReplayScenario,
  play: ConversationReplayPlayer,
): ConversationReplayResult {
  const snapshots = scenario.turns.map((turn, index) => play(turn.input, index + 1))
  const differences = scenario.turns.flatMap((turn, index) => (
    Object.entries(turn.expected).flatMap(([field, expected]) => {
      const replayField = field as ConversationReplayField
      const actual = snapshots[index][replayField]
      return Object.is(actual, expected)
        ? []
        : [{
            scenarioId: scenario.id,
            turn: index + 1,
            input: turn.input,
            field: replayField,
            severity: REPLAY_FIELD_SEVERITY[replayField],
            expected,
            actual,
          }]
    })
  ))

  return {
    snapshots,
    differences,
    blockingDifferences: differences.filter(({ severity }) => (
      severity === 'critical' || severity === 'major'
    )),
  }
}
