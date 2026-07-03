import { getInitialRapport, getDecayConfig } from './config.js'
import { RAPPORT_MAX, RAPPORT_MIN } from './types.js'

export function createInitialRapport(): number {
  return getInitialRapport()
}

export function clampRapport(value: number): number {
  return Math.max(RAPPORT_MIN, Math.min(RAPPORT_MAX, Math.round(value)))
}

export function applyDelta(rapport: number, delta: number): number {
  return clampRapport(rapport + delta)
}

export function naturalDecay(rapport: number): number {
  const decay = getDecayConfig()
  return clampRapport(rapport - decay.perTurn)
}
