import type { Expression } from '../../types.js'
import type { ResponsePlan, ResponsePlanLine } from './response-plan.js'

function line(text: string, expression: Expression): ResponsePlanLine {
  return { text, expression }
}

function uniformLines(expression: Expression, texts: readonly string[]): ResponsePlanLine[] {
  return texts.map((text) => line(text, expression))
}

const EXACT_DEFAULT_BLOCKS = {
  reaction: [
    '그럼 지금 흐름에 맞춰볼게요.',
    '좋아요, 조건은 대충 잡혔어요.',
    '이쪽이면 크게 빗나가진 않을 것 같네요.',
  ],
  recommend: [
    '{cocktail_name} 괜찮겠네요.',
    '{cocktail_name} 쪽으로 가볼게요.',
    '오늘은 {cocktail_name_subject} 어울릴 것 같아요.',
  ],
  explanation: ['{reason}', '{reason}', '{reason}', '{reason}'],
} as const

const EXACT_TIRED_BLOCKS = {
  reaction: [
    '그럼 너무 무거운 건 말고요.',
    '오늘은 좀 가볍게 가죠.',
    '연료 부족 경고등이 켜진 것 같은데요.',
    '피곤할 땐 취하는 것보다 쉬는 게 먼저긴 한데...',
    '그래도 빈손으로 보내긴 아쉽고요.',
  ],
  recommend: [
    '{cocktail_name} 괜찮겠네요.',
    '{cocktail_name} 쪽으로 드릴까요?',
    '오늘은 {cocktail_name_subject} 어울릴 것 같아요.',
  ],
  explanation: ['{reason}', '{reason}', '{reason}', '{reason}'],
} as const

function exactRecommendationPlan(
  affectState: string,
  expression: Expression,
): ResponsePlan {
  const blocks = affectState === 'tired' ? EXACT_TIRED_BLOCKS : EXACT_DEFAULT_BLOCKS
  return {
    id: `karua.recommend.exact-${affectState}`,
    speaker: 'karua',
    intent: 'recommend',
    state: affectState,
    request: 'exact-recommendation-body',
    blocks: {
      reaction: uniformLines(expression, blocks.reaction),
      recommend: uniformLines(expression, blocks.recommend),
      explanation: uniformLines(expression, blocks.explanation),
      answer: [line('{talking_point}', expression)],
    },
    fallbackText: '{cocktail_name}\n{reason}\n{talking_point}',
  }
}

const EXACT_RECOMMENDATION_PLANS: readonly ResponsePlan[] = [
  exactRecommendationPlan('neutral', 'smirk'),
  exactRecommendationPlan('warm', 'smirk'),
  exactRecommendationPlan('curious', 'thinking'),
  exactRecommendationPlan('confident', 'smirk'),
  exactRecommendationPlan('playful', 'smirk'),
  exactRecommendationPlan('concerned', 'sympathy'),
  exactRecommendationPlan('awkward', 'thinking'),
  exactRecommendationPlan('tired', 'sympathy'),
]

function nearestRecommendationPlan(
  affectState: string,
  expression: Expression,
): ResponsePlan {
  const text = '완전히 맞는 칵테일은 없어서 가장 가까운 「{cocktail_name}」을 골랐어요.\n{talking_point}\n{fallback_reason}'
  return {
    id: `karua.recommend.nearest-${affectState}`,
    speaker: 'karua',
    intent: 'recommend',
    state: affectState,
    request: 'nearest-recommendation-body',
    blocks: { answer: [line(text, expression)] },
    fallbackText: text,
  }
}

const NEAREST_RECOMMENDATION_PLANS: readonly ResponsePlan[] = [
  nearestRecommendationPlan('neutral', 'smirk'),
  nearestRecommendationPlan('warm', 'smirk'),
  nearestRecommendationPlan('curious', 'thinking'),
  nearestRecommendationPlan('confident', 'smirk'),
  nearestRecommendationPlan('playful', 'smirk'),
  nearestRecommendationPlan('concerned', 'sympathy'),
  nearestRecommendationPlan('awkward', 'thinking'),
  nearestRecommendationPlan('tired', 'sympathy'),
]

const RECOMMENDATION_QUESTION_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.ask-preference.recommendation-question-lead-in',
    speaker: 'karua',
    intent: 'ask_preference',
    state: 'lead-in',
    request: 'recommendation-question',
    blocks: {
      answer: [line('{lead_in}\n{question_label}', 'thinking')],
    },
    fallbackText: '{lead_in}\n{question_label}',
  },
  {
    id: 'karua.ask-preference.recommendation-question-continuation',
    speaker: 'karua',
    intent: 'ask_preference',
    state: 'continuation',
    request: 'recommendation-question',
    blocks: {
      answer: [line('{acknowledgement}\n{continuation}\n{question_label}', 'thinking')],
    },
    fallbackText: '{acknowledgement}\n{continuation}\n{question_label}',
  },
]

export const RECOMMENDATION_RANDOM_REQUEST_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.recommend.random-request',
    speaker: 'karua',
    intent: 'recommend',
    request: 'random-request',
    blocks: {
      answer: [
        line('좋아요. 조건은 제가 잡고 한 잔 골라볼게요.', 'smirk'),
        line('아무거나가 제일 어려운 주문이죠. 그래도 한 잔 골라보겠습니다.', 'smirk'),
        line('선택은 이쪽에 맡기신 거죠. 잔 하나 꺼내볼게요.', 'thinking'),
      ],
    },
    fallbackText: '좋아요. 한 잔 골라볼게요.',
  },
]

export const RECOMMENDATION_CANCEL_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.refusal.recommendation-cancel',
    speaker: 'karua',
    intent: 'refusal',
    request: 'recommendation-cancel',
    blocks: {
      answer: [
        line('추천 질문은 여기서 접을게요. 필요할 때 다시 말씀해 주세요.', 'talk'),
        line('좋아요, 고르는 건 잠깐 멈추죠. 다른 얘기로 넘어가도 됩니다.', 'talk'),
        line('추천은 여기까지 해둘게요. 잔보다 숨 돌리는 게 먼저일 때도 있으니까요.', 'smirk'),
      ],
    },
    fallbackText: '추천은 여기까지 해둘게요.',
  },
]

export const RECOMMENDATION_TAIL_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.recommend.cocktail-request',
    speaker: 'karua',
    intent: 'recommend',
    request: 'cocktail-request',
    blocks: {
      answer: [
        line('칵테일을 추천해 드릴게요. 어떤 맛을 좋아하세요?', 'thinking'),
        line('취향에 맞는 걸 찾으려면 몇 가지만 여쭤볼게요.', 'talk'),
        line('좋아요. 어떤 느낌의 칵테일을 찾고 계신가요?', 'talk'),
        line('오늘 기분에 맞는 걸로 찾아볼게요. 힌트를 주시겠어요?', 'thinking'),
        line('네, 지금부터 취향을 맞춰볼게요.', 'talk'),
        line('어떤 베이스나 맛을 선호하시는지 말씀해 주세요.', 'thinking'),
        line('알겠어요. 취향에 맞는 칵테일을 찾아볼게요.', 'talk'),
        line('추천해 드릴게요. 몇 가지 질문 드려도 될까요?', 'thinking'),
        line('좋아요, 지금부터 취향 탐색을 시작해 볼게요. 먼저 어떤 베이스가 좋으신지부터 여쭤볼게요.', 'thinking'),
        line('칵테일을 찾으시는군요. 기분 좋은 질문을 몇 가지 드려도 될까요?', 'smirk'),
        line('좋아요, 한 잔 골라보죠. 취향을 조금 더 구체적으로 말씀해 주시면 금방 좁힐 수 있어요.', 'talk'),
        line('벌써 기대되네요. 손님 취향에 맞는 칵테일을 찾는 게 재미있거든요.', 'smirk'),
      ],
    },
    fallbackText: '칵테일을 추천해 드릴게요. 어떤 맛을 좋아하세요?',
  },
  {
    id: 'karua.recommend.taste-sweet',
    speaker: 'karua',
    intent: 'recommend',
    request: 'taste-sweet',
    blocks: {
      answer: [
        line('달콤한 쪽을 좋아하시는군요. 그쪽으로 찾아볼게요.', 'talk'),
        line('달콤한 풍미를 중심으로 볼게요.', 'talk'),
        line('단맛 위주로 골라볼게요. 기대하셔도 좋아요.', 'smirk'),
        line('달콤한 걸 원하시는군요. 디저트 느낌으로 가볼까요?', 'talk'),
        line('달짝지근한 쪽으로 찾아볼게요. 몇 가지 괜찮은 후보가 있어요.', 'smirk'),
        line('달콤하게 기분을 올리고 싶으신가 봐요. 좋은 선택이에요.', 'talk'),
        line('달달한 쪽으로 알아볼게요. 마시기 편한 걸로 골라볼게요.', 'talk'),
        line('달콤한 걸 좋아하시는 분들은 대부분 마시는 걸 즐기시는 분들이에요. 어떤 과일 향을 좋아하세요?', 'smirk'),
        line('단맛은 언제나 옳죠. 달콤하면서도 너무 부담스럽지 않은 걸로 골라볼게요.', 'smirk'),
        line('오늘은 단맛 쪽이군요. 그 방향이라면 몇 가지 좋은 잔이 있어요.', 'talk'),
      ],
    },
    fallbackText: '달콤한 쪽을 좋아하시는군요. 그쪽으로 찾아볼게요.',
  },
  {
    id: 'karua.recommend.taste-strong',
    speaker: 'karua',
    intent: 'recommend',
    request: 'taste-strong',
    blocks: {
      answer: [
        line('도수가 높은 칵테일을 찾으시는군요. 천천히 드실 만한 쪽으로 볼게요.', 'talk'),
        line('강한 걸 원하시지만 속도는 조절하시는 게 좋아요. 무리하지 않는 선에서 골라볼게요.', 'talk'),
        line('도수 높은 쪽으로 알아볼게요. 천천히 즐기실 수 있는 걸로요.', 'talk'),
        line('센 걸 찾으시는데, 빈속은 피해 주세요. 적당한 걸로 골라볼게요.', 'talk'),
        line('강한 도수, 조심스럽게 골라볼게요. 향이 눌리지 않는 쪽으로요.', 'thinking'),
        line('확실하게 가시네요. 무리하지 않게 천천히 드시는 걸로 맞춰볼게요.', 'talk'),
        line('도수 높은 건 조심스럽게 접근해야 하는 영역이에요. 천천히 음미할 수 있는 걸로 찾아볼게요.', 'thinking'),
        line('강한 걸 좋아하시는군요. 그만큼 맛의 밸런스도 중요한 법이죠.', 'talk'),
        line('도수가 높은 쪽으로 갈수록 마시는 속도가 중요해져요. 천천히 즐기실 수 있는 걸로 골라볼게요.', 'talk'),
        line('확실히 강한 걸 원하시는군요. 기본에 충실하면서도 깊이 있는 걸로 골라볼게요.', 'thinking'),
      ],
    },
    fallbackText: '도수가 높은 칵테일을 찾으시는군요. 천천히 드실 만한 쪽으로 볼게요.',
  },
  {
    id: 'karua.recommend.random-pick-body',
    speaker: 'karua',
    intent: 'recommend',
    request: 'random-pick-body',
    blocks: {
      answer: [
        line('「{cocktail_name}」은 어떠세요?\n{talking_point}', 'smirk'),
      ],
    },
    fallbackText: '「{cocktail_name}」은 어떠세요?\n{talking_point}',
  },
  ...EXACT_RECOMMENDATION_PLANS,
  ...NEAREST_RECOMMENDATION_PLANS,
  ...RECOMMENDATION_QUESTION_PLANS,
]
