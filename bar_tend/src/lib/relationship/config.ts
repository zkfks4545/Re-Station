import configData from '../../data/relationship-config.json'
import type { RapportConfig, RangeConfig, DecayConfig, UpdateRule, PersonalityProfile } from './types.js'

const typedConfig = validateConfig(configData as unknown as Record<string, unknown>)

function validateConfig(data: Record<string, unknown>): RapportConfig {
  if (typeof data.initial !== 'number' || data.min !== 0 || data.max !== 10) {
    throw new Error('RapportConfig: invalid initial/min/max values')
  }
  if (data.initial < data.min || data.initial > data.max) {
    throw new Error('RapportConfig: initial must be between min and max')
  }
  if (typeof data.weightScaleFactor !== 'number' || data.weightScaleFactor < 0 || data.weightScaleFactor > 10) {
    throw new Error('RapportConfig: weightScaleFactor must be between 0 and 10')
  }
  if (!data.ranges || typeof data.ranges !== 'object') {
    throw new Error('RapportConfig: missing ranges')
  }
  const ranges = data.ranges as Record<string, Record<string, unknown>>
  const order = ['distant', 'normal', 'warm', 'close'] as const
  for (const key of order) {
    if (typeof ranges[key]?.min !== 'number' || typeof ranges[key]?.max !== 'number') {
      throw new Error(`RapportConfig: range ${key} missing min/max`)
    }
    if (ranges[key].min > ranges[key].max) {
      throw new Error(`RapportConfig: range ${key} min exceeds max`)
    }
  }
  if (ranges.distant.min !== 0) {
    throw new Error('RapportConfig: distant.min must be 0')
  }
  if (ranges.close.max !== 10) {
    throw new Error('RapportConfig: close.max must be 10')
  }
  for (let i = 1; i < order.length; i++) {
    const prev = ranges[order[i - 1]]
    const curr = ranges[order[i]]
    if ((prev.max as number) >= (curr.min as number)) {
      throw new Error(`RapportConfig: range ${order[i - 1]}.max (${prev.max}) must be less than ${order[i]}.min (${curr.min})`)
    }
  }
  return data as unknown as RapportConfig
}

export function getRapportConfig(): RapportConfig {
  return typedConfig
}

export function getInitialRapport(): number {
  return typedConfig.initial
}

export function getRangeConfig(): RangeConfig {
  return typedConfig.ranges
}

export function getDecayConfig(): DecayConfig {
  return typedConfig.decay
}

export function getWeightScaleFactor(): number {
  return typedConfig.weightScaleFactor
}

export function getUpdateRules(): UpdateRule[] {
  return typedConfig.updateRules
}

export function getPersonalityProfile(): PersonalityProfile {
  return typedConfig.personality
}

export function getWeight(context: string): number | null {
  const profile = typedConfig.personality
  const entry = profile.weights[context]
  return entry ?? null
}
