import type { KeywordRule } from '../../types.js'

function koreanFriendly(patterns: string[]): string {
  return patterns.map((p) => {
    if (/^[a-zA-Z]/.test(p)) return `\\b${p}\\b`
    return p
  }).join('|')
}

export const keywordRules: KeywordRule[] = [
  {
    pattern: new RegExp(koreanFriendly(['안녕', '하이', '처음', '방가', '반가워'])),
    expression: 'talk',
    response: '어서 오세요. 오늘은 어떤 걸 찾으세요?',
  },
  {
    pattern: new RegExp(koreanFriendly(['힘들', '우울', '슬퍼', '지쳤', '피곤', '외롭', '괴롭', '스트레스'])),
    expression: 'sympathy',
    response: '오늘 많이 힘드셨나 봐요. 괜찮으시면 천천히 말씀해 주세요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['좋아', '행복', '신나', '기분', '축하', '최고', '기쁘', '즐거'])),
    expression: 'smirk',
    response: '좋은 일이 있으셨군요. 축하하기 좋은 칵테일을 골라볼게요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['추천', '뭐가 좋아', '칵테일', '마실', '취하', '주문'])),
    expression: 'talk',
    response: '알겠어요. 취향에 맞는 칵테일을 찾아볼게요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['놀라', '대박', '어떻게', '미친', '신기'])),
    expression: 'surprised',
    response: '조금만 더 자세히 말씀해 주시겠어요?',
  },
  {
    pattern: new RegExp(koreanFriendly(['이야기', '사연', '비밀', '옛날', '추억'])),
    expression: 'thinking',
    response: '네, 듣고 있어요. 편하게 이어서 말씀해 주세요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['달콤', '달아', '시럽', '달게', '달짝'])),
    expression: 'talk',
    response: '달콤한 쪽을 좋아하시는군요. 그쪽으로 찾아볼게요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['씁쓸', '쓰다', '비터', '쓴맛', 'bitter'])),
    expression: 'smirk',
    response: '쌉쌀한 맛을 좋아하시는군요. 그쪽으로 찾아볼게요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['상쾌', '시원', '청량', 'fresh'])),
    expression: 'talk',
    response: '청량한 맛을 좋아하시는군요. 시원한 쪽으로 찾아볼게요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['탄산', '톡쏘', '톡 쏘', '스파클', 'fizz', '기포'])),
    expression: 'talk',
    response: '탄산이 있는 칵테일을 좋아하시는군요. 그 조건으로 찾아볼게요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['신맛', '상큼', '새콤', 'sour', '시트러스'])),
    expression: 'talk',
    response: '상큼한 맛을 좋아하시는군요. 그쪽으로 찾아볼게요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['강하', '독하', '진하', '세게', '도수'])),
    expression: 'talk',
    response: '도수가 높은 칵테일을 찾으시는군요. 천천히 드실 만한 쪽으로 볼게요.',
  },
]
