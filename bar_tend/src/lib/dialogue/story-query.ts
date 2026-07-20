import type { CocktailData, Expression } from '../../types.js'
import { selectCocktailTalkingPoint } from '../recommendation/response.js'

export interface StoryQueryReply {
  text: string
  expression: Expression
  facts: string[]
  factKeys: string[]
}

export type CocktailContentKind = 'story' | 'lore' | 'info'

export const STORY_QUERY_SOURCE_OWNERSHIP = Object.freeze({
  cocktailFacts: 'cocktail-data',
  generalLoreFallback: 'story-query',
  exhaustedFallback: 'story-query',
} as const)

const GENERAL_LORE_REPLIES = [
  'Re:Station은 잠깐 멈춰 서는 사람들을 위한 가상의 바예요.\n메뉴보다 먼저 오늘의 흐름을 보고, 그 다음에 잔을 고릅니다.',
  '여기는 실제 주소가 있는 매장이라기보다, 하루를 정리하는 쪽에 가까운 바예요.\n그래서 이야기도 레시피보다 손님의 상태에서 먼저 시작됩니다.',
  'Re:Station에서는 한 잔을 오래 붙잡기보다, 그 잔이 왜 지금 나왔는지를 조금 남겨둡니다.\n그게 이 바의 배경에 가까워요.',
]

export function formatStoryQueryReply(
  cocktail: CocktailData | null,
  disclosedFactKeys: string[] = [],
  contentKind: CocktailContentKind = 'story',
): StoryQueryReply {
  if (cocktail) {
    const nextFact = selectCocktailContentFact(cocktail, disclosedFactKeys, contentKind)
    if (!nextFact) {
      const text = '이 정도가 이 잔에 얽힌 이야기의 대부분이에요.'
      return { text, expression: 'smirk', facts: [text], factKeys: [] }
    }
    return formatStoryQueryFactReply(nextFact)
  }

  const text = GENERAL_LORE_REPLIES[0]
  return {
    text,
    expression: 'talk',
    facts: [text],
    factKeys: [],
  }
}

export function getSelectedCocktailStoryFactKey(cocktail: CocktailData): string | null {
  const points = cocktail.talkingPoints?.filter((point) => point.trim().length > 0) ?? []
  const selected = selectCocktailTalkingPoint(cocktail)
  const index = points.indexOf(selected)
  return index >= 0 ? `story:${index}` : null
}

export interface CocktailFact {
  key: string
  text: string
}

export function selectCocktailContentFact(
  cocktail: CocktailData,
  disclosedFactKeys: readonly string[] = [],
  contentKind: CocktailContentKind = 'story',
): CocktailFact | null {
  return buildCocktailFacts(cocktail, contentKind)
    .find((fact) => !disclosedFactKeys.includes(fact.key))
    ?? null
}

export function formatStoryQueryFactReply(fact: CocktailFact): StoryQueryReply {
  return {
    text: fact.text,
    expression: 'talk',
    facts: [fact.text],
    factKeys: [fact.key],
  }
}

function buildCocktailFacts(
  cocktail: CocktailData,
  contentKind: CocktailContentKind,
): CocktailFact[] {
  const groups: Record<'story' | 'lore' | 'recipe' | 'ingredients' | 'tasting' | 'description', CocktailFact[]> = {
    story: [],
    lore: [],
    recipe: [],
    ingredients: [],
    tasting: [],
    description: [],
  }
  const seen = new Set<string>()
  const add = (group: keyof typeof groups, key: string, text: string | undefined) => {
    const shortened = shortenToTwoSentences(text)
    const normalized = shortened.toLowerCase().replace(/\s+/g, '')
    if (!shortened || seen.has(normalized)) return
    seen.add(normalized)
    groups[group].push({ key, text: shortened })
  }

  cocktail.talkingPoints?.forEach((point, index) => add('story', `story:${index}`, point))
  cocktail.lore?.references.forEach((reference, index) => {
    add('lore', `trivia:${index}`, reference.details)
  })
  add('recipe', 'recipe', cocktail.recipeText ? `${cocktail.name}의 레시피는 ${cocktail.recipeText}입니다.` : undefined)
  add('ingredients', 'ingredients', cocktail.ingredients?.length > 0
    ? `${cocktail.name}에는 ${cocktail.ingredients.join(', ')}이 들어갑니다.`
    : undefined)
  add('tasting', 'tasting', formatTastingFact(cocktail))
  add('description', 'description', cocktail.description)

  if (contentKind === 'lore') {
    return [...groups.lore, ...groups.story, ...groups.description, ...groups.tasting, ...groups.recipe, ...groups.ingredients]
  }
  if (contentKind === 'info') {
    return [...groups.recipe, ...groups.ingredients, ...groups.tasting, ...groups.description, ...groups.story, ...groups.lore]
  }
  return [...groups.story, ...groups.lore, ...groups.description, ...groups.tasting, ...groups.recipe, ...groups.ingredients]
}

function formatTastingFact(cocktail: CocktailData): string {
  const sweetness = describeLevel(cocktail.features.sweetness, '드라이한', '균형 잡힌 단맛의', '달콤한')
  const sourness = describeLevel(cocktail.features.sourness, '산미가 잔잔하고', '산미가 또렷하고', '산미가 강하고')
  const strength = describeLevel(cocktail.features.alcohol_strength, '도수는 가벼운', '도수는 중간 정도인', '도수가 높은')
  const fizz = cocktail.features.fizz >= 0.6
    ? '탄산감도 선명합니다.'
    : cocktail.features.fizz >= 0.25
      ? '탄산감은 은은합니다.'
      : '탄산 없이 맛이 이어집니다.'
  return `${sweetness} 편이고 ${sourness} ${strength} 잔이에요. ${fizz}`
}

function describeLevel(value: number, low: string, medium: string, high: string): string {
  if (value < 0.35) return low
  if (value > 0.65) return high
  return medium
}

function shortenToTwoSentences(text: string | undefined): string {
  if (!text?.trim()) return ''
  const sentences = text.trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []
  return sentences.slice(0, 2).map((sentence) => sentence.trim()).join(' ')
}
