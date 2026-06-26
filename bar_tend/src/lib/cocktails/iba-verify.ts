import type { CocktailRecord } from '../../types/cocktail-db.js'
import { IBA_CATEGORIES, IBA_COCKTAIL_PREFIX } from '../../types/admin-queue.js'

export interface IVerificationResult {
  isIbaOfficial: boolean
  hasValidUrl: boolean
  hasValidCategory: boolean
  confidence: number
  reasons: string[]
}

const KNOWN_BASE_SPIRITS = ['진', '보드카', '럼', '데킬라', '위스키', '브랜디', '리큐르']

export function verifyIbaProvenance(record: CocktailRecord): IVerificationResult {
  const reasons: string[] = []

  const hasValidUrl =
    record.recipe_source_url?.startsWith(IBA_COCKTAIL_PREFIX) ?? false
  if (hasValidUrl) {
    reasons.push('IBA 공식 URL 소스 확인')
  } else if (record.recipe_source_url) {
    reasons.push('비공식 레시피 소스')
  } else {
    reasons.push('레시피 소스 URL 없음')
  }

  const hasValidCategory =
    record.official_category != null &&
    IBA_CATEGORIES.includes(record.official_category as never)
  if (hasValidCategory) {
    reasons.push(`IBA 분류: ${record.official_category}`)
  } else if (record.official_category) {
    reasons.push(`알 수 없는 분류: ${record.official_category}`)
  } else {
    reasons.push('IBA 분류 정보 없음')
  }

  const baseSpiritValid =
    record.base_spirit != null &&
    KNOWN_BASE_SPIRITS.includes(record.base_spirit)
  if (!baseSpiritValid && record.base_spirit) {
    reasons.push(`알 수 없는 베이스: ${record.base_spirit}`)
  }

  let confidence = 0
  if (hasValidUrl) confidence += 0.5
  if (hasValidCategory) confidence += 0.3
  if (baseSpiritValid && record.base_spirit) confidence += 0.2

  const isIbaOfficial = hasValidUrl && hasValidCategory

  return { isIbaOfficial, hasValidUrl, hasValidCategory, confidence, reasons }
}

export function filterIbaOfficial(records: CocktailRecord[]): CocktailRecord[] {
  return records.filter((c) => verifyIbaProvenance(c).isIbaOfficial)
}

export function filterPendingVerification(records: CocktailRecord[]): CocktailRecord[] {
  return records.filter((c) => {
    const result = verifyIbaProvenance(c)
    return !result.isIbaOfficial && result.confidence < 0.5
  })
}
