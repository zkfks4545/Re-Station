import type { CocktailFeatures, CocktailRecord } from '../../types/cocktail-db.js'
import type { QueueCandidate } from '../../types/admin-queue.js'
import {
  addConflictingSearchResult,
  addSignatureCandidate,
  addUnknownCocktail,
} from './admin-queue-manager.js'
import { generateNeutralDescription } from './description-gen.js'
import { verifyIbaProvenance } from './iba-verify.js'

export interface RecipeCandidateInput {
  name: string
  requestContext: string
  recipe?: string
  ingredients?: string[]
  baseSpirit?: string
  features: CocktailFeatures
  recipeSourceUrl?: string
  officialCategory?: string
  barName?: string
  barLocation?: string
  sourceUrl?: string
  searchResults?: Array<{ name: string; source: string; url?: string }>
  conflictReason?: string
}

export type IngestionPipelineResult =
  | {
      outcome: 'official-record'
      record: CocktailRecord
      reasons: string[]
    }
  | {
      outcome: 'queued-for-review'
      candidate: QueueCandidate
      reasons: string[]
    }

export function processRecipeCandidate(input: RecipeCandidateInput): IngestionPipelineResult {
  if (input.conflictReason || (input.searchResults && input.searchResults.length > 1)) {
    const candidate = addConflictingSearchResult({
      name: input.name,
      requestContext: input.requestContext,
      searchResults: input.searchResults ?? [],
      conflictReason: input.conflictReason ?? 'multiple-search-results',
      ingredients: input.ingredients,
      confidence: 0,
    })
    return {
      outcome: 'queued-for-review',
      candidate,
      reasons: ['출처 또는 검색 결과 충돌로 관리자 검증 큐에 보냄'],
    }
  }

  if (!hasUsableRecipe(input)) {
    const candidate = addUnknownCocktail(
      input.name,
      input.requestContext,
      'recipe-or-ingredient-missing',
    )
    return {
      outcome: 'queued-for-review',
      candidate,
      reasons: ['레시피 또는 재료 정보가 부족해 정식 DB에 추가하지 않음'],
    }
  }

  const provisionalRecord = createClassicRecord(input)
  const ibaResult = verifyIbaProvenance(provisionalRecord)
  if (ibaResult.isIbaOfficial) {
    return {
      outcome: 'official-record',
      record: provisionalRecord,
      reasons: ibaResult.reasons,
    }
  }

  if (input.barName) {
    const candidate = addSignatureCandidate({
      name: input.name,
      barName: input.barName,
      barLocation: input.barLocation,
      requestContext: input.requestContext,
      ingredients: input.ingredients,
      recipeText: input.recipe,
      sourceUrl: input.sourceUrl ?? input.recipeSourceUrl,
      confidence: ibaResult.confidence,
    })
    return {
      outcome: 'queued-for-review',
      candidate,
      reasons: [
        ...ibaResult.reasons,
        'IBA 공식 항목이 아니므로 시그니처 후보로 관리자 검증 큐에 보냄',
      ],
    }
  }

  const candidate = addUnknownCocktail(
    input.name,
    input.requestContext,
    'not-iba-official',
  )
  return {
    outcome: 'queued-for-review',
    candidate,
    reasons: [...ibaResult.reasons, 'IBA 공식 항목이 아니므로 정식 DB에 추가하지 않음'],
  }
}

function hasUsableRecipe(input: RecipeCandidateInput): input is RecipeCandidateInput & {
  recipe: string
  ingredients: string[]
} {
  return Boolean(input.recipe?.trim()) && Boolean(input.ingredients && input.ingredients.length > 0)
}

function createClassicRecord(input: RecipeCandidateInput & {
  recipe: string
  ingredients: string[]
}): CocktailRecord {
  return {
    id: slugify(input.name),
    name: input.name,
    name_en: input.name,
    type: 'CLASSIC',
    recipe: input.recipe,
    description: generateNeutralDescription(input.recipe, {
      baseSpirit: input.baseSpirit,
      ingredients: input.ingredients,
      features: input.features,
    }),
    features: input.features,
    base_spirit: input.baseSpirit,
    recipe_source_url: input.recipeSourceUrl,
    official_category: input.officialCategory,
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
