import type { RapportRange, RangeConfig } from './types.js'
import { RAPPORT_RANGES } from './types.js'
import { getRangeConfig } from './config.js'

function loadRanges(): RangeConfig {
  return getRangeConfig()
}

function rangeForValue(value: number, ranges: RangeConfig): RapportRange {
  if (value >= ranges.veryHigh.min) return 'very-high'
  if (value >= ranges.high.min) return 'high'
  if (value >= ranges.normal.min) return 'normal'
  return 'low'
}

export function getRapportRange(value: number): RapportRange {
  return rangeForValue(value, loadRanges())
}

export function rangeIndex(range: RapportRange): number {
  return RAPPORT_RANGES.indexOf(range)
}
