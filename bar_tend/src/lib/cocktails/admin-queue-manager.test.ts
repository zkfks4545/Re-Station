import { describe, expect, it, beforeEach } from 'vitest'
import {
  addUnknownCocktail,
  getQueue,
  getQueueStats,
  resetQueue,
  updateCandidateStatus,
  getCandidatesByStatus,
  getCandidateById,
} from './admin-queue-manager.js'

describe('admin queue manager', () => {
  beforeEach(() => {
    resetQueue()
  })

  it('adds an unknown cocktail candidate', () => {
    const candidate = addUnknownCocktail('Blue Lagoon', '블루 라군 주문')
    expect(candidate.itemType).toBe('unknownCocktail')
    expect(candidate.name).toBe('Blue Lagoon')
    expect(candidate.originalQuery).toBe('블루 라군 주문')
    expect(candidate.status).toBe('pending')
    expect(candidate.searchAttempts).toBe(1)
  })

  it('increments search attempts for duplicate queries', () => {
    addUnknownCocktail('Blue Lagoon', '블루 라군 주문')
    const duplicate = addUnknownCocktail('Blue Lagoon', '블루 라군 주문')
    expect(duplicate.searchAttempts).toBe(2)
  })

  it('returns queue stats', () => {
    addUnknownCocktail('Cocktail A', '칵테일 A 주문')
    addUnknownCocktail('Cocktail B', '칵테일 B 추천')
    addUnknownCocktail('Cocktail C', '칵테일 C 알려줘')

    const stats = getQueueStats()
    expect(stats.total).toBe(3)
    expect(stats.pending).toBe(3)
  })

  it('updates candidate status', () => {
    const candidate = addUnknownCocktail('Test', '테스트')
    const updated = updateCandidateStatus(candidate.id, 'approved', 'Verified recipe')
    expect(updated).toBe(true)

    const found = getCandidateById(candidate.id)
    expect(found?.status).toBe('approved')
    expect(found?.reviewNotes).toBe('Verified recipe')
  })

  it('filters candidates by status', () => {
    const c1 = addUnknownCocktail('A', 'A 주문')
    const c2 = addUnknownCocktail('B', 'B 주문')
    updateCandidateStatus(c2.id, 'rejected')

    const pending = getCandidatesByStatus('pending')
    expect(pending).toHaveLength(1)
    expect(pending[0].id).toBe(c1.id)

    const rejected = getCandidatesByStatus('rejected')
    expect(rejected).toHaveLength(1)
    expect(rejected[0].id).toBe(c2.id)
  })

  it('returns a copy of the queue', () => {
    addUnknownCocktail('X', 'X 주문')
    const q1 = getQueue()
    const q2 = getQueue()
    expect(q1.candidates).toHaveLength(1)
    expect(q1).not.toBe(q2)
    expect(q1.candidates).not.toBe(q2.candidates)
  })
})
