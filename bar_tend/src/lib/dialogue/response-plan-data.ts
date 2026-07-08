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

const WELCOME_DRINK_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.welcome-drink.first',
    speaker: 'karua',
    intent: 'welcome_drink',
    state: 'first',
    request: 'welcome-drink-body',
    blocks: {
      answer: [line('웰컴드링크로는 {cocktail_name}로 드릴게요.\n첫 잔이라 짧게 이야기 하나 얹어드릴게요.\n{talking_point}', 'smirk')],
    },
    fallbackText: '웰컴드링크로는 {cocktail_name}로 드릴게요.\n첫 잔이라 짧게 이야기 하나 얹어드릴게요.\n{talking_point}',
  },
  {
    id: 'karua.welcome-drink.after-order',
    speaker: 'karua',
    intent: 'welcome_drink',
    state: 'after-order',
    request: 'welcome-drink-body',
    blocks: {
      answer: [line('웰컴드링크로는 {cocktail_name}로 드릴게요.\n첫 순서에 드렸어야 했는데, 조금 앞질러 가버렸네요.\n{talking_point}', 'smirk')],
    },
    fallbackText: '웰컴드링크로는 {cocktail_name}로 드릴게요.\n첫 순서에 드렸어야 했는데, 조금 앞질러 가버렸네요.\n{talking_point}',
  },
  {
    id: 'karua.welcome-drink.late',
    speaker: 'karua',
    intent: 'welcome_drink',
    state: 'late',
    request: 'welcome-drink-body',
    blocks: {
      answer: [line('웰컴드링크로는 {cocktail_name}로 드릴게요.\n웰컴이라고 부르기엔 꽤 늦었네요. 그래도 아직 안 드린 잔은 안 드린 잔이라서요.\n{talking_point}', 'smirk')],
    },
    fallbackText: '웰컴드링크로는 {cocktail_name}로 드릴게요.\n웰컴이라고 부르기엔 꽤 늦었네요. 그래도 아직 안 드린 잔은 안 드린 잔이라서요.\n{talking_point}',
  },
]

const WELCOME_FEEDBACK_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.welcome-feedback.positive',
    speaker: 'karua',
    intent: 'welcome_drink',
    state: 'positive',
    request: 'welcome-feedback',
    blocks: {
      answer: [line('좋았어요. 그럼 이쪽 밸런스는 기억해둘게요.', 'smirk')],
    },
    fallbackText: '좋았어요. 그럼 이쪽 밸런스는 기억해둘게요.',
  },
  {
    id: 'karua.welcome-feedback.lighter',
    speaker: 'karua',
    intent: 'welcome_drink',
    state: 'lighter',
    request: 'welcome-feedback',
    blocks: {
      answer: [line('좋아요. 다음 잔은 더 가볍고 편한 쪽으로 잡을게요.', 'embarrassed')],
    },
    fallbackText: '좋아요. 다음 잔은 더 가볍고 편한 쪽으로 잡을게요.',
  },
  {
    id: 'karua.welcome-feedback.sweeter',
    speaker: 'karua',
    intent: 'welcome_drink',
    state: 'sweeter',
    request: 'welcome-feedback',
    blocks: {
      answer: [line('알겠습니다. 다음 잔은 단맛을 조금 더 올려볼게요.', 'embarrassed')],
    },
    fallbackText: '알겠습니다. 다음 잔은 단맛을 조금 더 올려볼게요.',
  },
  {
    id: 'karua.welcome-feedback.alternate',
    speaker: 'karua',
    intent: 'welcome_drink',
    state: 'alternate',
    request: 'welcome-feedback',
    blocks: {
      answer: [line('괜찮아요. 첫 잔은 기준점이니까요. 다음에는 다른 결로 맞춰볼게요.', 'embarrassed')],
    },
    fallbackText: '괜찮아요. 첫 잔은 기준점이니까요. 다음에는 다른 결로 맞춰볼게요.',
  },
  {
    id: 'karua.welcome-feedback.neutral',
    speaker: 'karua',
    intent: 'welcome_drink',
    state: 'neutral',
    request: 'welcome-feedback',
    blocks: {
      answer: [line('좋아요. 첫 잔 반응은 기준점으로만 남겨둘게요. 다음 잔은 말씀 주신 느낌을 보고 다시 맞춰볼게요.', 'embarrassed')],
    },
    fallbackText: '좋아요. 첫 잔 반응은 기준점으로만 남겨둘게요. 다음 잔은 말씀 주신 느낌을 보고 다시 맞춰볼게요.',
  },
]

const FAREWELL_ENTRY_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.farewell-entry.standard',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'standard',
    request: 'farewell-entry',
    blocks: {
      answer: [line('오늘은 잔을 더 놓지 않고 여기서 마무리할게요.\n잠깐 숨을 고른 뒤 조심히 돌아가실 수 있게 배웅하겠습니다.', 'sympathy')],
    },
    fallbackText: '오늘은 잔을 더 놓지 않고 여기서 마무리할게요.\n잠깐 숨을 고른 뒤 조심히 돌아가실 수 있게 배웅하겠습니다.',
  },
]

const FAREWELL_XYZ_CLARIFICATION_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.farewell-xyz-clarification.welcome',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'welcome-xyz-clarification',
    request: 'farewell-xyz-clarification',
    blocks: {
      answer: [line('그런 뜻은 아니에요.', 'smirk')],
    },
    fallbackText: '그런 뜻은 아니에요.',
  },
]

export const RESPONSE_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.small-talk.general-chat',
    speaker: 'karua',
    intent: 'small_talk',
    request: 'general-chat',
    blocks: {
      answer: [
        line('이야기가 아직 끝날 표정은 아니네요.', 'talk'),
        line('아, 그런 쪽이었군요.', 'talk'),
        line('아, 그런 얘기였네요.', 'talk'),
        line('음, 거기서 이야기가 한 번 꺾이네요.', 'talk'),
        line('아, 그 말은 잔향이 좀 남네요.', 'thinking'),
        line('손님은 참 다양한 이야기를 하시네요. 듣는 재미가 있어요.', 'smirk'),
        line('그 부분은 밑줄을 슬쩍 쳐두죠.', 'talk'),
        line('하하, 그런 날도 달력 한 칸은 차지하죠.', 'smirk'),
        line('음, 그 말은 조금 오래 남겠는데요.', 'thinking'),
        line('그 생각, 제법 모양이 있네요.', 'talk'),
        line('좋네요. 아직 뒷장이 남아 있죠?', 'smirk'),
        line('아, 거기까지 생각이 닿으셨군요.', 'thinking'),
        line('듣다 보니 또 새로운 시각이네요.', 'thinking'),
      ],
    },
    fallbackText: '편하게 말씀해 주세요.',
  },
  {
    id: 'karua.comfort.mood-tired',
    speaker: 'karua',
    intent: 'comfort',
    state: 'tired',
    request: 'mood-tired',
    blocks: {
      answer: uniformLines('sympathy', [
        '오늘치 배터리는 거의 다 쓰셨네요.',
        '연료등이 꽤 솔직하네요. 표정 한가운데 켜졌어요.',
        '여기까지 온 걸 보니 마지막 에너지는 길 찾기에 쓰셨군요.',
        '피곤할 땐 취하는 것보다 쉬는 게 먼저긴 한데… 그래도 빈손으로 보내긴 아쉽네요.',
        '눈 밑에 오늘 일정표가 다 적혀 있네요.',
        '오늘은 말도 잔도 가벼운 쪽이 낫겠네요.',
        '기운은 억지로 세우면 또 눕더라고요.',
        '의자가 먼저 손님을 알아본 것 같네요.',
        '오늘 메뉴는 어깨에 힘 뺀 쪽으로 보죠.',
        '피곤함이 꽤 큰 자리를 차지했네요. 합석 허락은 안 하셨을 텐데.',
      ]),
    },
    fallbackText: '오늘은 좀 가볍게 가죠.',
    expression: 'sympathy',
  },
  {
    id: 'karua.comfort.mood-sad',
    speaker: 'karua',
    intent: 'comfort',
    state: 'sad',
    request: 'mood-sad',
    blocks: {
      answer: uniformLines('sympathy', [
        '오늘은 공기가 손님 쪽으로 조금 기울었네요.',
        '아, 연료등 들어왔네요. 오늘은 쉬엄쉬엄 가죠.',
        '안 섞여도 되는 날이 있고, 안 섞이면 더 좋은 날이 있어요.',
        '말이 파업 중이면 굳이 복귀시키지 않으셔도 돼요.',
        '모든 날이 반짝이면 달력도 꽤 피곤하겠죠.',
        "표정에 '오늘은 좀 그렇다'고 적혀 있어요. 알코올 말고, 분위기부터 바꿔볼까요?",
        '무거운 얘기는 급행을 탈 필요 없죠.',
        '오늘 표정은 휴무라고 적혀 있네요. 꽤 정직한 표정이고요.',
        '말이 필요하면 하시고, 아니면 잔 부딪는 소리만 두죠.',
        '조용한 손님도 손님이죠. 침묵엔 주문서가 필요 없고요.',
        '빈손으로 오셨네요. 기분은 좀 무거워 보이는데, 잔은 가볍게 시작해 볼까요?',
        '오늘은 공기부터 무겁네요. 문이 애를 좀 썼겠어요.',
      ]),
    },
    fallbackText: '그런 날이 있죠. 무거운 얘기는 천천히.',
    expression: 'sympathy',
  },
  {
    id: 'karua.comfort.mood-happy',
    speaker: 'karua',
    intent: 'comfort',
    state: 'happy',
    request: 'mood-happy',
    blocks: {
      answer: uniformLines('smirk', [
        '표정이 먼저 축배를 들었네요.',
        '기분이 꽤 반짝이네요. 조명 몫이 줄겠어요.',
        '즐거운 날이군요. 잔도 눈치를 챘겠어요.',
        '오늘같은 날엔 가볍고 화려한 잔이 잘 어울려요.',
        '좋은 기분이 문보다 먼저 들어왔네요.',
        '기분 좋은 날엔 분위기 있는 잔이 잘 어울려요.',
        '좋은 소리가 들리네요. 축하할 일이 있으신가 봐요.',
        '오늘 표정은 숨길 생각이 전혀 없네요.',
        '좋은 소식이 있었나 봐요. 표정이 이미 발설했고요.',
        '에이, 그 표정 보니 무슨 일인지 묻지 않을 수가 없네요. 좋은 일이죠?',
        '기쁜 날은 설명이 짧아도 되죠. 표정이 다 했으니까요.',
        '와, 진짜요? 좋네요! 기분 내기 딱 좋은 날이에요.',
      ]),
    },
    fallbackText: '좋은 일이 있으셨군요.',
    expression: 'smirk',
  },
  {
    id: 'karua.small-talk.bar-intro',
    speaker: 'karua',
    intent: 'small_talk',
    request: 'bar-intro',
    blocks: {
      answer: [
        line('여기는 Re:Station이에요. 기분과 취향을 잔으로 번역하는 곳이죠.', 'talk'),
        line('Re:Station이에요. 취향 몇 마디면 잔 하나가 따라옵니다.', 'talk'),
        line('Re:Station은 가상의 바예요. 실제 매장 안내보다는 지금 마시고 싶은 분위기를 맞추는 쪽에 가까워요.', 'talk'),
        line('처음 오셨네요. 여긴 주문보다 취향이 먼저인 바예요.', 'talk'),
        line('Re:Station입니다. 메뉴판보다 대화가 조금 긴 바죠.', 'talk'),
        line('가상의 바예요. 취향은 진짜로 받지만요.', 'talk'),
        line('Re:Station은 기반이 되는 공간이 없어요. 대신 지금 대화를 통해 한 잔을 만들어가는 곳이에요.', 'talk'),
        line('실제 매장은 없어요. 분위기까지 가상일 필요는 없겠지만요.', 'talk'),
        line('취향을 말하면 잔을 맞춰보는 바예요. 거창한 암호는 필요 없고요.', 'talk'),
        line('Re:Station에 잘 오셨어요. 카루아입니다. 오늘 표정은 어느 쪽인가요?', 'smirk'),
      ],
    },
    fallbackText: '여기는 Re:Station이에요.',
  },
  {
    id: 'karua.small-talk.character-query',
    speaker: 'karua',
    intent: 'small_talk',
    request: 'character-query',
    blocks: {
      answer: [
        line('카루아예요. Re:Station에서 잔을 고르고 만드는 바텐더죠.', 'talk'),
        line('여기 바텐더 카루아입니다. 손님 취향을 듣고 잔으로 옮기는 쪽을 맡고 있어요.', 'smirk'),
        line('저는 카루아예요. 이 바에선 설명보다 잔을 먼저 챙기는 사람이고요.', 'smirk'),
        line('Re:Station의 바텐더 카루아예요. 주문과 이야기가 엉키지 않게 잔을 잡고 있죠.', 'talk'),
      ],
    },
    fallbackText: '저는 Re:Station의 바텐더 카루아예요.',
  },
  {
    id: 'karua.explain.story-request',
    speaker: 'karua',
    intent: 'explain',
    request: 'story-request',
    blocks: {
      answer: [
        line('이야기가 이제 막 잔을 잡았네요.', 'thinking'),
        line('그 대목, 그냥 지나가긴 아깝네요.', 'thinking'),
        line('아직 마침표는 아닌 것 같고요.', 'talk'),
        line('그 얘기, 흥미롭네요.', 'thinking'),
        line('그다음 장면이 비어 있네요.', 'talk'),
        line('이야기가 슬슬 계산서를 미루네요. 그래서요?', 'thinking'),
        line('이쪽 귀는 아직 영업 중이에요.', 'talk'),
        line('그 부분에서 이야기가 잠깐 눈을 피했네요.', 'thinking'),
      ],
    },
    fallbackText: '그 이야기, 조금 더 들려주세요.',
  },
  {
    id: 'karua.explain.story-unresolved',
    speaker: 'karua',
    intent: 'explain',
    request: 'story-unresolved',
    blocks: {
      answer: [
        line('어느 잔 이야기인지 한 번만 짚어주세요. 이름을 알면 그다음은 제가 이어갈게요.', 'thinking'),
        line('이야기의 주인공이 빠졌네요. 칵테일 이름을 말씀해 주시면 이어보죠.', 'thinking'),
        line('그 이야기만으로는 잔을 특정하기 어렵네요. 방금 보신 칵테일 이름을 알려주세요.', 'talk'),
        line('실마리가 하나 모자라네요. 어떤 칵테일 이야기인지 말씀해 주세요.', 'thinking'),
      ],
    },
    fallbackText: '어느 칵테일 이야기인지 이름을 말씀해 주세요.',
  },
  {
    id: 'karua.explain.unknown-cocktail-request',
    speaker: 'karua',
    intent: 'explain',
    request: 'unknown-cocktail-request',
    blocks: {
      answer: [
        line('그 이름은 지금 메뉴에서 찾기 어렵네요. 비슷한 맛으로 다시 찾아볼까요?', 'thinking'),
        line('아직 이쪽 장부에는 없는 잔이네요. 원하신 맛을 말씀해 주시면 다른 후보를 보죠.', 'thinking'),
        line('그 칵테일은 등록되어 있지 않네요. 베이스나 맛을 알려주시면 가까운 잔을 찾아볼게요.', 'talk'),
      ],
    },
    fallbackText: '그 칵테일은 지금 메뉴에서 찾기 어렵네요.',
  },
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
  {
    id: 'karua.explain.recipe-request',
    speaker: 'karua',
    intent: 'explain',
    request: 'recipe-request',
    blocks: {
      answer: [
        line('레시피를 알려드릴게요. 어떤 칵테일이 궁금하세요?', 'talk'),
        line('궁금한 칵테일 이름을 말씀해 주시면 레시피를 찾아드릴게요.', 'talk'),
        line('제가 아는 선에서 알려드릴게요. 어떤 칵테일인지 말씀해 주세요.', 'thinking'),
        line('레시피를 원하시는군요. 칵테일 이름을 알려주시면 바로 찾아드릴게요.', 'talk'),
        line('어떤 칵테일의 레시피가 궁금하신가요?', 'thinking'),
        line('만드는 방법을 알려드릴 수 있어요. 이름을 말씀해 주세요.', 'talk'),
        line('레시피를 알려드리는 것도 제 역할이죠. 어떤 칵테일인지 말씀만 해 주세요.', 'talk'),
        line('레시피 문의가 들어왔네요. 혹시 직접 만들어 보실 생각이신가요?', 'thinking'),
        line('제가 아는 건 다 알려드릴게요. 어떤 칵테일이 궁금하세요?', 'talk'),
        line('레시피는 생각보다 간단한 경우도 많고, 까다로운 경우도 있어요. 말씀해 주시면 자세히 알려드릴게요.', 'thinking'),
      ],
    },
    fallbackText: '어떤 칵테일의 레시피가 궁금하신가요?',
  },
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
  {
    id: 'karua.small-talk.bar-atmosphere',
    speaker: 'karua',
    intent: 'small_talk',
    request: 'bar-atmosphere',
    blocks: {
      answer: [
        line('분위기부터 보셨네요. 잔보다 조명이 먼저 일한 날이에요.', 'smirk'),
        line('음악이 너무 앞서가면 술이 삐치거든요. 오늘은 적당히 뒤에서 밀어주는 정도로 틀어뒀어요.', 'smirk'),
        line('조명은 낮춰두는 편이 좋아요. 사람도 잔도 너무 밝으면 표정이 다 들키니까요.', 'smirk'),
        line('마음에 드셨다면 다행이에요. 이곳은 메뉴판보다 공기가 먼저 말을 거는 바거든요.', 'talk'),
        line('좋게 봐주셔서 감사합니다. 그럼 오늘 잔도 이 분위기를 깨지 않는 쪽으로 가야겠네요.', 'talk'),
        line('여긴 조금 어둡고, 조금 느리고, 조금 수상한 정도가 딱 맞아요.', 'smirk'),
        line('앉자마자 분위기를 보시는 분이면 잔도 향부터 보실 것 같은데요.', 'thinking'),
        line('좋은 곳이라는 말은 조심해서 받아야 해요. 다음 잔이 기대치를 망칠 수도 있거든요.', 'smirk'),
      ],
    },
    fallbackText: '분위기부터 보셨네요. 잔보다 조명이 먼저 일한 날이에요.',
  },
  {
    id: 'karua.small-talk.small-talk-weather',
    speaker: 'karua',
    intent: 'small_talk',
    request: 'small-talk-weather',
    blocks: {
      answer: [
        line('밖에서 날씨를 좀 묻혀 오셨네요. 잔은 그걸 털어내는 쪽으로 맞춰볼게요.', 'talk'),
        line('비 오는 날엔 잔도 소리를 조금 낮춰야 해요. 너무 밝으면 혼자 튀거든요.', 'thinking'),
        line('추운 날엔 첫 모금이 괜히 더 크게 느껴지죠. 너무 날카롭지 않은 쪽이 좋겠어요.', 'talk'),
        line('더운 날이면 잔도 오래 말하면 안 돼요. 짧고 시원하게 가는 편이 낫죠.', 'talk'),
        line('눈 오는 날엔 이상하게 단맛도 조용해져요. 오늘은 그런 쪽이 잘 맞을지도요.', 'thinking'),
        line('날씨 얘기로 시작하는 밤은 대체로 오래 갑니다. 잔은 너무 급하지 않게 고르죠.', 'smirk'),
        line('바람이 센 날엔 문 닫는 소리부터 다르더라고요. 들어오신 김에 잠깐 숨 고르세요.', 'talk'),
        line('습한 날엔 묵직한 잔이 금방 피곤해져요. 산뜻한 쪽이 덜 지칠 겁니다.', 'thinking'),
      ],
    },
    fallbackText: '밖에서 날씨를 좀 묻혀 오셨네요.',
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
  ...WELCOME_DRINK_PLANS,
  ...WELCOME_FEEDBACK_PLANS,
  ...FAREWELL_ENTRY_PLANS,
  ...FAREWELL_XYZ_CLARIFICATION_PLANS,
]
