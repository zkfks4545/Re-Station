import { describe, expect, it, beforeEach } from 'vitest'
import {
  addUnknownCocktail,
  addConflictingSearchResult,
  addSignatureCandidate,
  canApproveCandidate,
  getQueue,
  getQueueStats,
  getPromotionReadyCandidates,
  resetQueue,
  updateCandidateStatus,
  getCandidatesByStatus,
  getCandidateById,
  isCandidateEligibleForRecommendation,
  isUnknownCocktailName,
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
    expect(candidate.status).toBe('open')
    expect(candidate.requestContext).toBe('블루 라군 주문')
    expect(candidate.failureReason).toBe('not-found-in-official-db')
    expect(candidate.searchAttempts).toBe(1)
  })

  it('increments search attempts for duplicate queries', () => {
    addUnknownCocktail('Blue Lagoon', '블루 라군 주문')
    const duplicate = addUnknownCocktail('Blue Lagoon', '블루 라군 주문')
    expect(duplicate.searchAttempts).toBe(2)
  })

  it('deduplicates unknown cocktails by normalized name', () => {
    addUnknownCocktail('Blue Lagoon', '블루 라군 주문')
    const duplicate = addUnknownCocktail(' blue   lagoon ', '다른 질의')
    expect(duplicate.searchAttempts).toBe(2)
    expect(getQueueStats().total).toBe(1)
  })

  it('returns queue stats', () => {
    addUnknownCocktail('Cocktail A', '칵테일 A 주문')
    addUnknownCocktail('Cocktail B', '칵테일 B 추천')
    addUnknownCocktail('Cocktail C', '칵테일 C 알려줘')

    const stats = getQueueStats()
    expect(stats.total).toBe(3)
    expect(stats.open).toBe(3)
    expect(stats.pending).toBe(3)
    expect(stats.archived).toBe(0)
  })

  it('rejects approval for unverified unknown cocktails', () => {
    const candidate = addUnknownCocktail('Test', '테스트')
    const updated = updateCandidateStatus(candidate.id, 'approved', 'Verified recipe')
    expect(updated).toBe(false)

    const found = getCandidateById(candidate.id)
    expect(found?.status).toBe('open')
  })

  it('updates candidate status after approval criteria are satisfied', () => {
    const candidate = addSignatureCandidate({
      name: 'House Highball',
      barName: 'Re:Station',
      requestContext: '하우스 하이볼 등록',
      ingredients: ['위스키', '탄산수'],
      recipeText: '잔에 얼음을 넣고 위스키와 탄산수를 따른다.',
      confidence: 0.8,
    })
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

    const pending = getCandidatesByStatus('open')
    expect(pending).toHaveLength(1)
    expect(pending[0].id).toBe(c1.id)

    const rejected = getCandidatesByStatus('rejected')
    expect(rejected).toHaveLength(1)
    expect(rejected[0].id).toBe(c2.id)
  })

  it('supports signature candidates and conflicting search results', () => {
    const signature = addSignatureCandidate({
      name: 'Station Sour',
      barName: 'Re:Station',
      requestContext: '스테이션 사워',
    })
    const conflict = addConflictingSearchResult({
      name: 'Blue Moon',
      requestContext: '블루문 알려줘',
      conflictReason: 'multiple incompatible recipes',
      searchResults: [
        { name: 'Blue Moon', source: 'source-a', url: 'https://example.test/a' },
        { name: 'Blue Moon', source: 'source-b' },
      ],
    })

    expect(signature.itemType).toBe('signatureCandidate')
    expect(conflict.itemType).toBe('conflictingSearchResult')
    expect(conflict.searchResults).toHaveLength(2)
    expect(canApproveCandidate(conflict)).toBe(false)
  })

  it('keeps queue candidates out of recommendations until approved and promotable', () => {
    const unknown = addUnknownCocktail('Mystery Drink', '미스터리 드링크')
    const signature = addSignatureCandidate({
      name: 'Station Sour',
      barName: 'Re:Station',
      requestContext: '스테이션 사워',
      ingredients: ['진', '레몬 주스'],
      recipeText: '진과 레몬 주스를 흔든다.',
    })

    expect(isCandidateEligibleForRecommendation(unknown)).toBe(false)
    expect(isCandidateEligibleForRecommendation(signature)).toBe(false)

    updateCandidateStatus(signature.id, 'approved')
    expect(getPromotionReadyCandidates()).toHaveLength(1)
    expect(getPromotionReadyCandidates()[0].id).toBe(signature.id)
  })

  it('archives candidates and excludes archived unknown names from duplicate checks', () => {
    const candidate = addUnknownCocktail('Old Drink', '올드 드링크')
    expect(isUnknownCocktailName('Old Drink')).toBe(true)
    updateCandidateStatus(candidate.id, 'archived')
    expect(isUnknownCocktailName('Old Drink')).toBe(false)
    expect(getCandidatesByStatus('archived')).toHaveLength(1)
  })

  it('returns a copy of the queue', () => {
    addUnknownCocktail('X', 'X 주문')
    const q1 = getQueue()
    const q2 = getQueue()
    expect(q1.candidates).toHaveLength(1)
    expect(q1).not.toBe(q2)
    expect(q1.candidates).not.toBe(q2.candidates)
    q1.candidates[0].ingredients.push('mutated')
    expect(getQueue().candidates[0].ingredients).not.toContain('mutated')
  })
})
