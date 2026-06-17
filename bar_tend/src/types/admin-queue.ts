export type PendingCocktailStatus = 'pending' | 'approved' | 'rejected'

export type QueueItemType = 'unknownCocktail' | 'signatureCandidate' | 'conflictingSearchResult'

export interface PendingCocktailCandidate {
  id: string
  name: string
  nameEn?: string
  nameKo?: string
  baseSpirit?: string
  ingredients: string[]
  recipeText?: string
  sourceUrl?: string
  sourceName: 'thecocktaildb' | 'user-submitted' | 'manual'
  confidence: number
  status: PendingCocktailStatus
  submittedAt: string
  reviewedAt?: string
  reviewNotes?: string
}

export interface UnknownCocktailCandidate extends PendingCocktailCandidate {
  itemType: 'unknownCocktail'
  originalQuery: string
  searchAttempts: number
}

export interface SignatureCandidate extends PendingCocktailCandidate {
  itemType: 'signatureCandidate'
  barName: string
  barLocation?: string
}

export interface ConflictingSearchResult extends PendingCocktailCandidate {
  itemType: 'conflictingSearchResult'
  searchResults: Array<{ name: string; source: string; url?: string }>
  conflictReason: string
}

export type QueueCandidate = UnknownCocktailCandidate | SignatureCandidate | ConflictingSearchResult

export interface AdminReviewQueue {
  schema_version: string
  candidates: QueueCandidate[]
}

export type IBAOfficialCategory =
  | 'The Unforgettables'
  | 'Contemporary Classics'
  | 'New Era'
  | 'New Era Drinks'

export const IBA_CATEGORIES: IBAOfficialCategory[] = [
  'The Unforgettables',
  'Contemporary Classics',
  'New Era',
  'New Era Drinks',
]

export const IBA_DOMAIN = 'https://iba-world.com'

export const IBA_COCKTAIL_PREFIX = `${IBA_DOMAIN}/iba-cocktail/`
