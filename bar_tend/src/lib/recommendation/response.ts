import type { CocktailData } from '../../types.js'
import type { RecommendationDecision } from '../../types/recommendation.js'

export function formatExplicitCocktailReply(cocktail: CocktailData): string {
  return `「${cocktail.name}」 찾으셨네요. 메뉴판보다 손님이 빠르시네.\n카드에는 설명만 얌전히 올려둘게요.`
}

export function formatRandomRecommendationReply(cocktail: CocktailData): string {
  return `아무거나라니, 제일 과감한 주문을 하시네요.\n그럼 오늘은 「${cocktail.name}」로 가죠.\n선택권은 방금 제게 넘기셨어요.`
}

export function formatRecommendationReply(
  decision: RecommendationDecision,
  acknowledgement?: string | null,
  matchType: 'exact' | 'nearest' = 'exact',
): string {
  const reason = decision.reasons.find((item) => item.code !== 'context')
  const opening = acknowledgement ?? '취향이 슬슬 자백하네요.'
  if (matchType === 'nearest') {
    return `${opening}\n완전히 같은 잔은 없어서 가장 가까운 「${decision.cocktail.name}」로 골랐어요.\n몇 조건은 살짝 양보했지만, 없는 술을 발명하는 것보단 낫죠.`
  }
  const reasonLine = reason
    ? `${reason.detail} 잔이 제법 눈치가 빠르죠.`
    : '지금까지 들은 걸로 제가 골라봤어요. 틀리면 잔 탓을 하죠.'

  return `${opening}\n오늘은 「${decision.cocktail.name}」로 가죠.\n${reasonLine}`
}
