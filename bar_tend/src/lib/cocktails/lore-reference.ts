import type { CocktailData } from '../../types.js'

const LORE_STOP_WORDS = new Set([
  'and', 'the', '칵테일', '이름', '그거', '그걸로', '주세요', '주문', '마시던',
  '마셨다는', '즐겨', '좋아하던', '나온', '등장한', '같다는', '이야기', '설명',
  '맞아요', '같은', '이름의', '이름이', '칵테일로', '부탁해요', '한잔', '한', '잔', '그', '걸로',
])

export interface LoreReferenceMatch {
  cocktail: CocktailData
  evidence: string[]
  score: number
}

export function findCocktailByLoreReference(
  input: string,
  cocktails: CocktailData[],
): LoreReferenceMatch | null {
  const normalizedInput = normalize(input)
  const inputTokens = tokenize(input)
  const explicitLoreReference = hasExplicitLoreReference(input)
  if (!normalizedInput || inputTokens.length === 0) return null

  const ranked = cocktails
    .map((cocktail) => scoreLoreReference(cocktail, normalizedInput, inputTokens, explicitLoreReference))
    .filter((match): match is LoreReferenceMatch => match !== null)
    .sort((a, b) => b.score - a.score || a.cocktail.id.localeCompare(b.cocktail.id))

  const best = ranked[0]
  if (!best || best.score < 4) return null
  if (ranked[1]?.score === best.score) return null
  return best
}

export function hasExplicitLoreReference(input: string): boolean {
  const normalized = input.trim().toLowerCase()
  return /[가-힣a-z0-9& ]{2,}(?:이|가)\s*(?:즐겨\s*)?(?:마시|마셨|좋아하|좋아했)/i.test(normalized)
    || /[가-힣a-z0-9& ]{2,}(?:에|에서)\s*(?:나온|나오|등장)/i.test(normalized)
    || /(?:영화|드라마|소설|시리즈|밴드|노래|작품).{0,20}(?:나오|등장|마시)/i.test(normalized)
    || /이름(?:이|은|가)?.{0,20}(?:같|뜻|붙)/i.test(normalized)
    || /(?:같은|같다는).{0,12}이름/i.test(normalized)
    || /(?:유래|기원|탄생|누가\s*(?:만들|고안|발명))/i.test(normalized)
}

function scoreLoreReference(
  cocktail: CocktailData,
  normalizedInput: string,
  inputTokens: string[],
  explicitLoreReference: boolean,
): LoreReferenceMatch | null {
  const excluded = new Set([
    cocktail.name,
    cocktail.nameEn,
    cocktail.name_en,
    cocktail.name_ko,
    cocktail.base,
    cocktail.base_spirit,
    ...(cocktail.aliases ?? []),
    ...cocktail.ingredients,
    ...cocktail.aroma,
  ].filter((value): value is string => Boolean(value)).map(normalize))
  const evidence = new Set<string>()
  let score = 0

  for (const phrase of [
    ...(cocktail.lore?.keywords ?? []),
    ...(cocktail.lore?.references.map((reference) => reference.target) ?? []),
  ]) {
    const normalizedPhrase = normalize(phrase)
    if (!isUsefulTerm(normalizedPhrase, excluded)) continue
    if (normalizedInput.includes(normalizedPhrase)) {
      score += 20 + Math.min(normalizedPhrase.length, 10)
      evidence.add(phrase)
      continue
    }
    for (const token of tokenize(phrase)) {
      const normalizedToken = normalize(token)
      if (normalizedToken.length < 3 || !isUsefulTerm(normalizedToken, excluded)) continue
      if (normalizedInput.includes(normalizedToken)) {
        score += 8
        evidence.add(token)
      }
    }
  }

  if (!explicitLoreReference) {
    return score > 0 ? { cocktail, evidence: [...evidence], score } : null
  }

  const descriptiveText = [
    ...(cocktail.talkingPoints ?? []),
    ...(cocktail.lore?.references.map((reference) => reference.details) ?? []),
    cocktail.story,
    cocktail.popCulture,
  ].filter((value): value is string => Boolean(value))

  const descriptiveTokens = new Set(descriptiveText.flatMap(tokenize).map(normalize))
  for (const inputToken of inputTokens) {
    const normalizedToken = normalize(inputToken)
    if (!isUsefulTerm(normalizedToken, excluded)) continue
    if (descriptiveTokens.has(normalizedToken)) {
      score += 4
      evidence.add(inputToken)
    }
  }

  return score > 0 ? { cocktail, evidence: [...evidence], score } : null
}

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9&]+|[가-힣]{2,}/g) ?? []
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '')
}

function isUsefulTerm(term: string, excluded: Set<string>): boolean {
  if (term.length < 2 || excluded.has(term) || LORE_STOP_WORDS.has(term)) return false
  return ![...LORE_STOP_WORDS].some((stopWord) => term === normalize(stopWord))
}
