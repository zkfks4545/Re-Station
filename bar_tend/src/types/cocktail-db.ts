/** Normalized taste axes for weight-based (Akinator) filtering. All values in [0, 1]. */
export interface CocktailFeatures {
  sweetness: number
  alcohol_strength: number
  fizz: number
  sourness: number
}

export type CocktailType = 'CLASSIC' | 'SIGNATURE'

export interface CocktailRecordBase {
  id: string
  name: string
  type: CocktailType
  recipe: string
  description: string
  features: CocktailFeatures
  /** Optional display / legacy bridge fields */
  image?: string
  name_en?: string
  name_ko?: string
  /** Base spirit keyword for spirit-based filtering */
  base_spirit?: string
  /** Provenance for an official standardized recipe */
  recipe_source_url?: string
  official_category?: string
  /** Short non-authoritative prompts Karua can use as bar conversation material */
  talking_points?: string[]
}

export interface ClassicCocktailRecord extends CocktailRecordBase {
  type: 'CLASSIC'
}

export interface SignatureCocktailRecord extends CocktailRecordBase {
  type: 'SIGNATURE'
  /** Links to `partner_bars[].id` for O2O onboarding */
  bar_id: string
  bar_name: string
  bar_location_link: string
}

export type CocktailRecord = ClassicCocktailRecord | SignatureCocktailRecord

/** Offline-to-offline partner bar — add rows here to onboard new venues */
export interface PartnerBar {
  id: string
  name: string
  location_link: string
  description?: string
  signature_cocktail_ids: string[]
  active: boolean
  onboarded_at?: string
}

export interface CocktailDatabase {
  schema_version: string
  partner_bars: PartnerBar[]
  cocktails: CocktailRecord[]
}

export type FeatureKey = keyof CocktailFeatures

export interface TastePreference {
  sweetness?: number
  alcohol_strength?: number
  fizz?: number
  sourness?: number
}

export function isSignatureCocktail(
  record: CocktailRecord,
): record is SignatureCocktailRecord {
  return record.type === 'SIGNATURE'
}

export function isClassicCocktail(record: CocktailRecord): record is ClassicCocktailRecord {
  return record.type === 'CLASSIC'
}
