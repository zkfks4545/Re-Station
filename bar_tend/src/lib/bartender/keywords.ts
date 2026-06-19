import type { KeywordRule } from '../../types.js'

function koreanFriendly(patterns: string[]): string {
  return patterns.map((p) => {
    if (/^[a-zA-Z]/.test(p)) return `\\b${p}\\b`
    return p
  }).join('|')
}

export const keywordRules: KeywordRule[] = [
  {
    pattern: new RegExp(koreanFriendly(['여기 뭐', '뭐하는 곳', 'Re:Station', '리스테이션', '처음 왔', '처음이야'])),
    expression: 'talk',
    response: '여기는 Re:Station이에요. 길게 설명하는 곳은 아니고, 지금 기분이랑 취향에 맞는 한 잔을 같이 고르는 바예요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['시에스타', '사장님', '사장'])),
    expression: 'smirk',
    response: '시에스타 사장님은 보통 뒤쪽에서 재고나 잔을 보고 계세요. 가끔 한마디만 두고 다시 일하러 가시고요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['물 좀', '물 주세요', '물 줘', '물 한잔', '물 한 잔'])),
    expression: 'talk',
    response: '물 먼저 드릴게요. 한 잔 고르는 건 그 다음에 천천히 해도 괜찮아요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['취했', '너무 취', '많이 마셨', '그만 마셔', '술 그만'])),
    expression: 'sympathy',
    response: '그럼 여기서는 더 권하지 않을게요. 물부터 드시고, 조금 쉬었다가 움직이세요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['미성년', '고등학생', '중학생', '학생인데', '술 못 마셔'])),
    expression: 'talk',
    response: '알코올은 안내하지 않을게요. 대신 무알코올이나 맛 방향 이야기 정도는 도와드릴 수 있어요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['무알코올', '논알콜', '논알코올', '알코올 없이', '술 없이'])),
    expression: 'talk',
    response: '무알코올 쪽으로 볼게요. 지금 메뉴에서 가능 범위가 좁으면 억지로 술 있는 잔을 권하진 않을게요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['알레르기', '못 먹', '빼고', '제외', '먹으면 안'])),
    expression: 'thinking',
    response: '그 재료는 피해서 볼게요. 정확히 어떤 재료를 제외할지 말씀해 주세요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['예약', '영업시간', '주소', '위치', '전화', '결제', '카드 돼', '화장실'])),
    expression: 'talk',
    response: '여긴 실제 매장 안내보다는 가상의 바 대화와 칵테일 추천을 위한 공간이에요. 메뉴나 취향 쪽은 바로 도와드릴게요.',
  },
  {
    pattern: new RegExp(koreanFriendly(['시끄러', '닥쳐', '꺼져', '짜증나', '열받아', '화나', '개같', '지랄', '엿'])),
    expression: 'annoyed',
    response: '그런 말씀은 듣기 좋지 않네요. 기분이 안 좋으시다면 천천히 말씀해 주세요.',
    dialogueCategory: 'rude-annoyed',
  },
  {
    pattern: new RegExp(koreanFriendly(['당장', '빨리 해', '가져와', '내놔', '말 들어', '듣거라', '니가 뭔데', '처리해'])),
    expression: 'stern',
    response: '여기는 편하게 대화하는 곳이에요. 조금만 부드럽게 말씀해 주시겠어요?',
    dialogueCategory: 'rude-boundary',
  },
  {
    pattern: new RegExp(koreanFriendly(['안녕', '하이', '처음', '방가', '반가워'])),
    expression: 'talk',
    response: '어서 오세요. 오늘은 어떤 걸 찾으세요?',
    dialogueCategory: 'greeting',
  },
  {
    pattern: new RegExp(koreanFriendly(['힘들', '우울', '슬퍼', '지쳤', '피곤', '외롭', '괴롭', '스트레스'])),
    expression: 'sympathy',
    response: '오늘 많이 힘드셨나 봐요. 괜찮으시면 천천히 말씀해 주세요.',
    dialogueCategory: 'mood-sad',
  },
  {
    pattern: new RegExp(koreanFriendly(['좋아', '행복', '신나', '기분', '축하', '최고', '기쁘', '즐거'])),
    expression: 'smirk',
    response: '좋은 일이 있으셨군요. 축하하기 좋은 칵테일을 골라볼게요.',
    dialogueCategory: 'mood-happy',
  },
  {
    pattern: new RegExp(koreanFriendly(['추천', '뭐가 좋아', '칵테일', '마실', '취하', '주문'])),
    expression: 'talk',
    response: '알겠어요. 취향에 맞는 칵테일을 찾아볼게요.',
    dialogueCategory: 'cocktail-request',
  },
  {
    pattern: new RegExp(koreanFriendly(['놀라', '대박', '어떻게', '미친', '신기'])),
    expression: 'surprised',
    response: '조금만 더 자세히 말씀해 주시겠어요?',
    dialogueCategory: 'mood-surprised',
  },
  {
    pattern: new RegExp(koreanFriendly(['이야기', '사연', '비밀', '옛날', '추억'])),
    expression: 'thinking',
    response: '네, 듣고 있어요. 편하게 이어서 말씀해 주세요.',
    dialogueCategory: 'story-request',
  },
  {
    pattern: new RegExp(koreanFriendly(['달콤', '달아', '시럽', '달게', '달짝'])),
    expression: 'talk',
    response: '달콤한 쪽을 좋아하시는군요. 그쪽으로 찾아볼게요.',
    dialogueCategory: 'taste-sweet',
  },
  {
    pattern: new RegExp(koreanFriendly(['씁쓸', '쓰다', '비터', '쓴맛', 'bitter'])),
    expression: 'smirk',
    response: '쌉쌀한 맛을 좋아하시는군요. 그쪽으로 찾아볼게요.',
    dialogueCategory: 'taste-bitter',
  },
  {
    pattern: new RegExp(koreanFriendly(['상쾌', '시원', '청량', 'fresh'])),
    expression: 'talk',
    response: '청량한 맛을 좋아하시는군요. 시원한 쪽으로 찾아볼게요.',
    dialogueCategory: 'taste-refresh',
  },
  {
    pattern: new RegExp(koreanFriendly(['탄산', '톡쏘', '톡 쏘', '스파클', 'fizz', '기포'])),
    expression: 'talk',
    response: '탄산이 있는 칵테일을 좋아하시는군요. 그 조건으로 찾아볼게요.',
    dialogueCategory: 'taste-carbonated',
  },
  {
    pattern: new RegExp(koreanFriendly(['신맛', '상큼', '새콤', 'sour', '시트러스'])),
    expression: 'talk',
    response: '상큼한 맛을 좋아하시는군요. 그쪽으로 찾아볼게요.',
    dialogueCategory: 'taste-sour',
  },
  {
    pattern: new RegExp(koreanFriendly(['강하', '독하', '진하', '세게', '도수'])),
    expression: 'talk',
    response: '도수가 높은 칵테일을 찾으시는군요. 천천히 드실 만한 쪽으로 볼게요.',
    dialogueCategory: 'taste-strong',
  },
  {
    pattern: new RegExp(koreanFriendly(['카운터', '혼자', '바텐더', '여기 계시', '관리', '운영'])),
    expression: 'talk',
    response: '네, 오늘은 제가 보고 있어요. 시에스타 사장님은 뒤쪽에서 일하시고 계시고요. 편하게 말씀해 주세요.',
    dialogueCategory: 'counter-bartender',
  },
]
