import type { CocktailData, Expression } from '../../types.js'

export interface StoryQueryReply {
  text: string
  expression: Expression
  facts: string[]
}

const GENERAL_LORE_REPLIES = [
  'Re:Station은 잠깐 멈춰 서는 사람들을 위한 가상의 바예요.\n메뉴보다 먼저 오늘의 흐름을 보고, 그 다음에 잔을 고릅니다.',
  '여기는 실제 주소가 있는 매장이라기보다, 하루를 정리하는 쪽에 가까운 바예요.\n그래서 이야기도 레시피보다 손님의 상태에서 먼저 시작됩니다.',
  'Re:Station에서는 한 잔을 오래 붙잡기보다, 그 잔이 왜 지금 나왔는지를 조금 남겨둡니다.\n그게 이 바의 배경에 가까워요.',
]

export function formatStoryQueryReply(cocktail: CocktailData | null): StoryQueryReply {
  const points = cocktail?.talkingPoints?.filter((point) => point.trim().length > 0) ?? []
  if (cocktail && points.length > 0) {
    return {
      text: `${cocktail.name}에 얽힌 이야기라면 이쪽이 먼저 떠오르네요.\n${points.join('\n')}`,
      expression: 'talk',
      facts: points,
    }
  }

  const text = GENERAL_LORE_REPLIES[0]
  return {
    text,
    expression: 'talk',
    facts: [text],
  }
}
