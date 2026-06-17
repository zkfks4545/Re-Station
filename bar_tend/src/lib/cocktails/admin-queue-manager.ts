import type {
  AdminReviewQueue,
  QueueCandidate,
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
  return { ...queue, candidates: [...queue.candidates] }
}

export function addUnknownCocktail(
  name: string,
  originalQuery: string,
): UnknownCocktailCandidate {
  const existing = queue.candidates.find(
    (c): c is UnknownCocktailCandidate =>
      c.itemType === 'unknownCocktail' &&
      c.originalQuery.toLowerCase() === originalQuery.toLowerCase(),
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
    status: 'pending',
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
  candidate.status = status
  candidate.reviewedAt = new Date().toISOString()
  if (notes) candidate.reviewNotes = notes
  return true
}

export function getCandidatesByStatus(status: PendingCocktailStatus): QueueCandidate[] {
  return queue.candidates.filter((c) => c.status === status)
}

export function getCandidateById(id: string): QueueCandidate | undefined {
  return queue.candidates.find((c) => c.id === id)
}

export function isUnknownCocktailName(name: string): boolean {
  return queue.candidates.some(
    (c) =>
      c.itemType === 'unknownCocktail' &&
      (c as UnknownCocktailCandidate).originalQuery.toLowerCase() === name.toLowerCase(),
  )
}

export function resetQueue(): void {
  queue = { schema_version: '1.0.0', candidates: [] }
  idCounter = 0
}

export function getQueueStats(): {
  total: number
  pending: number
  approved: number
  rejected: number
} {
  const candidates = queue.candidates
  return {
    total: candidates.length,
    pending: candidates.filter((c) => c.status === 'pending').length,
    approved: candidates.filter((c) => c.status === 'approved').length,
    rejected: candidates.filter((c) => c.status === 'rejected').length,
  }
}
