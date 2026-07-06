export type RapportRange = 'distant' | 'normal' | 'warm' | 'close'

export const RAPPORT_RANGES: readonly RapportRange[] = [
  'distant',
  'normal',
  'warm',
  'close',
]

export const RAPPORT_MIN = 0
export const RAPPORT_MAX = 10

export interface RangeDefinition {
  min: number
  max: number
}

export interface RangeConfig {
  distant: RangeDefinition
  normal: RangeDefinition
  warm: RangeDefinition
  close: RangeDefinition
}

export interface UpdateRule {
  id: string
  context: string[]
  delta: number
  cooldown?: number
  maxPerSession?: number
}

export interface PersonalityProfile {
  id: string
  label: string
  description: string
  likes: string[]
  dislikes: string[]
  neutral: string[]
  weights: Record<string, number>
}

export interface DecayConfig {
  perTurn: number
}

export interface RapportConfig {
  version: string
  description: string
  initial: number
  min: number
  max: number
  weightScaleFactor: number
  ranges: RangeConfig
  decay: DecayConfig
  personality: PersonalityProfile
  updateRules: UpdateRule[]
}

export interface RapportDialogueVariation {
  category: string
  variations: {
    rangeMin: RapportRange
    rangeMax: RapportRange
    text: string
    expression?: string
  }[]
}
