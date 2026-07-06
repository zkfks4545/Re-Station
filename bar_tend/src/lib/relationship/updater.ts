import { getUpdateRules, getWeight, getWeightScaleFactor } from './config.js'
import { clampRapport } from './state.js'

export interface UpdateContext {
  intent: string
  sessionTurnCount: number
}

interface RuleUseTracker {
  ruleId: string
  count: number
  lastTurn: number
}

export function createUpdateTracker(): { trackers: RuleUseTracker[] } {
  return { trackers: [] }
}

export function updateRapport(
  rapport: number,
  context: UpdateContext,
  tracker: { trackers: RuleUseTracker[] },
): { rapport: number; delta: number } {
  const weight = getWeight(context.intent)
  const scaleFactor = getWeightScaleFactor()
  const weightDelta = weight !== null ? weight * scaleFactor : 0

  const rules = getUpdateRules()
  let ruleDelta = 0

  for (const rule of rules) {
    if (!rule.context.includes(context.intent)) continue

    const existing = tracker.trackers.find((t) => t.ruleId === rule.id)
    const currentCount = existing?.count ?? 0
    const lastTurn = existing?.lastTurn

    if (rule.maxPerSession !== undefined && currentCount >= rule.maxPerSession) continue
    if (lastTurn !== undefined && rule.cooldown !== undefined && context.sessionTurnCount - lastTurn < rule.cooldown) continue

    ruleDelta += rule.delta

    if (existing) {
      existing.count += 1
      existing.lastTurn = context.sessionTurnCount
    } else {
      tracker.trackers.push({ ruleId: rule.id, count: 1, lastTurn: context.sessionTurnCount })
    }
  }

  const totalDelta = Math.round((weightDelta + ruleDelta) * 10) / 10
  const next = clampRapport(rapport + totalDelta)
  return { rapport: next, delta: totalDelta }
}
