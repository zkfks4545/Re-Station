export type {
  RapportRange,
  RangeConfig,
  UpdateRule,
  PersonalityProfile,
  RapportConfig,
  RapportDialogueVariation,
} from './types.js'

export {
  RAPPORT_RANGES,
  RAPPORT_MIN,
  RAPPORT_MAX,
} from './types.js'

export {
  getRapportConfig,
  getInitialRapport,
  getRangeConfig,
  getDecayConfig,
  getUpdateRules,
  getPersonalityProfile,
  getWeight,
} from './config.js'

export {
  createInitialRapport,
  clampRapport,
  applyDelta,
  naturalDecay,
} from './state.js'

export {
  updateRapport,
  createUpdateTracker,
} from './updater.js'
export type { UpdateContext } from './updater.js'

export {
  getRapportRange,
  rangeIndex,
} from './ranges.js'

export {
  selectVariation,
} from './dialogue-selector.js'
export type { VariationEntry, VariationCategory } from './dialogue-selector.js'
