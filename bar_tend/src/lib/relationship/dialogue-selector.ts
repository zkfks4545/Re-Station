import type { RapportRange } from './types.js'
import { getRapportRange, rangeIndex } from './ranges.js'

export interface VariationEntry {
  rangeMin: RapportRange
  rangeMax: RapportRange
  text: string
  expression?: string
}

export interface VariationCategory {
  category: string
  variations: VariationEntry[]
}

function matchesRange(
  currentRange: RapportRange,
  entry: VariationEntry,
): boolean {
  const current = rangeIndex(currentRange)
  const min = rangeIndex(entry.rangeMin)
  const max = rangeIndex(entry.rangeMax)
  return current >= min && current <= max
}

export function selectVariation(
  categories: VariationCategory[],
  categoryId: string,
  rapport: number,
  seed?: string,
): VariationEntry | null {
  const currentRange = getRapportRange(rapport)
  const category = categories.find((c) => c.category === categoryId)
  if (!category) return null

  const candidates = category.variations.filter((v) =>
    matchesRange(currentRange, v),
  )
  if (candidates.length === 0) return null

  const index = seed
    ? hashIndex(seed + categoryId + currentRange, candidates.length)
    : Math.floor(Math.random() * candidates.length)
  return candidates[index]
}

function hashIndex(seed: string, length: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash % length
}
