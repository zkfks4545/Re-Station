import type {
  AdminReviewQueue,
  ConflictingSearchResult,
  QueueCandidate,
  SignatureCandidate,
  UnknownCocktailCandidate,
  PendingCocktailStatus,
} from '../../types/admin-queue.js'

let queue: AdminReviewQueue = {
  schema_version: '1.0.0',
  candidates: [],
}

let idCounter = 0

function nextId(): string {
  idCounter += 1
  return `queue-candidate-${String(idCounter).padStart(4, '0')}`
}

export function getQueue(): AdminReviewQueue {
  return { ...queue, candidates: queue.candidates.map(cloneCandidate) }
}

export function addUnknownCocktail(
  name: string,
  originalQuery: string,
  failureReason = 'not-found-in-official-db',
): UnknownCocktailCandidate {
  const normalizedName = normalizeName(name)
  const normalizedQuery = normalizeName(originalQuery)
  const existing = queue.candidates.find(
    (c): c is UnknownCocktailCandidate =>
      c.itemType === 'unknownCocktail' &&
      c.status !== 'archived' &&
      (normalizeName(c.name) === normalizedName ||
        normalizeName(c.originalQuery) === normalizedQuery),
  )

  if (existing) {
    existing.searchAttempts += 1
    existing.submittedAt = new Date().toISOString()
    return existing
  }

  const candidate: UnknownCocktailCandidate = {
    id: nextId(),
    itemType: 'unknownCocktail',
    name,
    originalQuery,
    searchAttempts: 1,
    ingredients: [],
    sourceName: 'user-submitted',
    confidence: 0,
    status: 'open',
    requestContext: originalQuery,
    failureReason,
    submittedAt: new Date().toISOString(),
  }

  queue.candidates.push(candidate)
  return candidate
}

export function addSignatureCandidate(args: {
  name: string
  barName: string
  requestContext: string
  barLocation?: string
  ingredients?: string[]
  recipeText?: string
  sourceUrl?: string
  confidence?: number
}): SignatureCandidate {
  const candidate: SignatureCandidate = {
    id: nextId(),
    itemType: 'signatureCandidate',
    name: args.name,
    barName: args.barName,
    barLocation: args.barLocation,
    ingredients: args.ingredients ?? [],
    recipeText: args.recipeText,
    sourceUrl: args.sourceUrl,
    sourceName: 'manual',
    confidence: args.confidence ?? 0,
    status: 'open',
    requestContext: args.requestContext,
    submittedAt: new Date().toISOString(),
  }
  queue.candidates.push(candidate)
  return candidate
}

export function addConflictingSearchResult(args: {
  name: string
  requestContext: string
  searchResults: ConflictingSearchResult['searchResults']
  conflictReason: string
  ingredients?: string[]
  confidence?: number
}): ConflictingSearchResult {
  const candidate: ConflictingSearchResult = {
    id: nextId(),
    itemType: 'conflictingSearchResult',
    name: args.name,
    searchResults: args.searchResults,
    conflictReason: args.conflictReason,
    ingredients: args.ingredients ?? [],
    sourceName: 'thecocktaildb',
    confidence: args.confidence ?? 0,
    status: 'open',
    requestContext: args.requestContext,
    failureReason: args.conflictReason,
    submittedAt: new Date().toISOString(),
  }
  queue.candidates.push(candidate)
  return candidate
}

export function updateCandidateStatus(
  id: string,
  status: PendingCocktailStatus,
  notes?: string,
): boolean {
  const candidate = queue.candidates.find((c) => c.id === id)
  if (!candidate) return false
  if (status === 'approved' && !canApproveCandidate(candidate)) return false
  candidate.status = status
  candidate.reviewedAt = new Date().toISOString()
  if (notes) candidate.reviewNotes = notes
  return true
}

export function getCandidatesByStatus(status: PendingCocktailStatus): QueueCandidate[] {
  return queue.candidates.filter((c) => c.status === status).map(cloneCandidate)
}

export function getCandidateById(id: string): QueueCandidate | undefined {
  const candidate = queue.candidates.find((c) => c.id === id)
  return candidate ? cloneCandidate(candidate) : undefined
}

export function isUnknownCocktailName(name: string): boolean {
  const normalized = normalizeName(name)
  return queue.candidates.some(
    (c) =>
      c.itemType === 'unknownCocktail' &&
      c.status !== 'archived' &&
      (normalizeName(c.name) === normalized ||
        normalizeName((c as UnknownCocktailCandidate).originalQuery) === normalized),
  )
}

export function canApproveCandidate(candidate: QueueCandidate): boolean {
  if (candidate.itemType === 'unknownCocktail') return false
  if (candidate.itemType === 'conflictingSearchResult') return false
  return Boolean(candidate.recipeText && candidate.ingredients.length > 0)
}

export function isCandidateEligibleForRecommendation(candidate: QueueCandidate): boolean {
  return candidate.status === 'approved' && canApproveCandidate(candidate)
}

export function getPromotionReadyCandidates(): QueueCandidate[] {
  return queue.candidates
    .filter(isCandidateEligibleForRecommendation)
    .map(cloneCandidate)
}

export function resetQueue(): void {
  queue = { schema_version: '1.0.0', candidates: [] }
  idCounter = 0
}

export function getQueueStats(): {
  total: number
  open: number
  pending: number
  approved: number
  rejected: number
  archived: number
} {
  const candidates = queue.candidates
  const open = candidates.filter((c) => c.status === 'open').length
  return {
    total: candidates.length,
    open,
    pending: open,
    approved: candidates.filter((c) => c.status === 'approved').length,
    rejected: candidates.filter((c) => c.status === 'rejected').length,
    archived: candidates.filter((c) => c.status === 'archived').length,
  }
}

function cloneCandidate<T extends QueueCandidate>(candidate: T): T {
  return {
    ...candidate,
    ingredients: [...candidate.ingredients],
    ...(candidate.itemType === 'conflictingSearchResult'
      ? { searchResults: candidate.searchResults.map((result) => ({ ...result })) }
      : {}),
  } as T
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}
