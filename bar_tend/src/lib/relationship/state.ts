import { getInitialRapport, getDecayConfig } from './config.js'

export function createInitialRapport(): number {
  return getInitialRapport()
}

export function clampRapport(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function applyDelta(rapport: number, delta: number): number {
  return clampRapport(rapport + delta)
}

export function naturalDecay(rapport: number): number {
  const decay = getDecayConfig()
  return clampRapport(Math.round((rapport - decay.perTurn) * 10) / 10)
}
