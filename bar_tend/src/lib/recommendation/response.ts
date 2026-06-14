import type { CocktailData } from '../../types.js'
import type { RecommendationDecision } from '../../types/recommendation.js'

export function formatExplicitCocktailReply(cocktail: CocktailData): string {
  return `「${cocktail.name}」을 찾으시는군요.\n자세한 정보도 함께 보여드릴게요.`
}

export function formatRandomRecommendationReply(cocktail: CocktailData): string {
  return `그럼 제가 하나 골라볼게요.\n「${cocktail.name}」은 어떠세요?`
}

export function formatRecommendationReply(
  decision: RecommendationDecision,
  acknowledgement?: string | null,
  matchType: 'exact' | 'nearest' = 'exact',
): string {
  const reason = decision.reasons.find((item) => item.code !== 'context')
  const opening = acknowledgement ?? '말씀해 주신 취향을 기준으로 골라봤어요.'
  if (matchType === 'nearest') {
    return `${opening}\n완전히 맞는 칵테일은 없어서 가장 가까운 「${decision.cocktail.name}」을 골랐어요.\n말씀하신 조건과 조금 다른 부분이 있을 수 있습니다.`
  }
  const reasonLine = reason
    ? reason.detail
    : '말씀해 주신 취향을 기준으로 골랐어요.'

  return `${opening}\n「${decision.cocktail.name}」은 어떠세요?\n${reasonLine}`
}
