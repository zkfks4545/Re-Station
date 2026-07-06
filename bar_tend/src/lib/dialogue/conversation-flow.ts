import type { InputRoute } from './input-router.js'

type ContentRoute = Extract<InputRoute, 'story-query' | 'lore-query' | 'cocktail-info-query'>

const FIRST_REACTIONS: Record<ContentRoute, string> = {
  'story-query': '그 이야기는 꽤 유명하죠.',
  'lore-query': '이름보다 이야기가 먼저 남은 잔이죠.',
  'cocktail-info-query': '잔을 고르기 전에 성격부터 보죠.',
}

export function getContentLeadReaction(
  route: InputRoute,
  options: { hasCocktail: boolean; isFollowup: boolean },
): string {
  if (options.isFollowup) return '조금 더 이어가보죠.'
  if (!options.hasCocktail) return '그 배경부터 짚어보죠.'
  return FIRST_REACTIONS[route as ContentRoute] ?? '그 얘기부터 짚어보죠.'
}
