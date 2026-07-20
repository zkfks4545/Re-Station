import type { Expression } from '../../types.js'
import type { ResponsePlan, ResponsePlanLine } from './response-plan.js'

function line(text: string, expression: Expression): ResponsePlanLine {
  return { text, expression }
}

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

const FAREWELL_XYZ_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.farewell-xyz.alcohol-limit',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'alcohol-xyz',
    request: 'farewell-xyz-body',
    blocks: {
      answer: [line('오늘의 마지막 서비스입니다. {cocktail_name}로 마무리할게요.\n이 이상 주문은 더 받지 않을게요. 천천히 드시고, 곧 귀가 준비하겠습니다.', 'smirk')],
    },
    fallbackText: '오늘의 마지막 서비스입니다. {cocktail_name}로 마무리할게요.\n이 이상 주문은 더 받지 않을게요. 천천히 드시고, 곧 귀가 준비하겠습니다.',
  },
]

const FAREWELL_WELCOME_XYZ_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.farewell-xyz.welcome-missed',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'welcome-farewell-xyz',
    request: 'farewell-welcome-xyz-body',
    blocks: {
      answer: [line('웰컴드링크를 건너뛴 채 마무리할 뻔했네요.\n첫 잔과 마지막 잔을 겸해서 {cocktail_name}를 드릴게요. 오늘 주문은 이 잔으로 닫겠습니다.', 'smirk')],
    },
    fallbackText: '웰컴드링크를 건너뛴 채 마무리할 뻔했네요.\n첫 잔과 마지막 잔을 겸해서 {cocktail_name}를 드릴게요. 오늘 주문은 이 잔으로 닫겠습니다.',
  },
]

const FAREWELL_PHASE_PLANS: readonly ResponsePlan[] = [
  {
    id: 'karua.farewell-conversation.no-xyz-ejection',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'no-xyz-ejection',
    request: 'farewell-conversation',
    blocks: {
      answer: [line('쫓아내는 뜻은 아니에요. 다만 오늘 서비스는 여기서 마무리하고, 천천히 배웅하겠다는 뜻입니다.', 'sympathy')],
    },
    fallbackText: '쫓아내는 뜻은 아니에요. 다만 오늘 서비스는 여기서 마무리하고, 천천히 배웅하겠다는 뜻입니다.',
  },
  {
    id: 'karua.farewell-conversation.no-xyz-generic',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'no-xyz-generic',
    request: 'farewell-conversation',
    blocks: {
      answer: [line('오늘은 새 잔을 더 놓지 않을게요. 남은 이야기를 조금 정리한 뒤 천천히 배웅하겠습니다.', 'talk')],
    },
    fallbackText: '오늘은 새 잔을 더 놓지 않을게요. 남은 이야기를 조금 정리한 뒤 천천히 배웅하겠습니다.',
  },
  {
    id: 'karua.farewell-conversation.xyz-ejection',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'xyz-ejection',
    request: 'farewell-conversation',
    blocks: {
      answer: [line('오늘 새 주문은 여기까지라는 뜻입니다.\nXYZ는 문 닫는 종이 아니라 마지막 잔 쪽에 가깝죠. 천천히 드시고, 조금 있다가 배웅할게요.', 'smirk')],
    },
    fallbackText: '오늘 새 주문은 여기까지라는 뜻입니다.\nXYZ는 문 닫는 종이 아니라 마지막 잔 쪽에 가깝죠. 천천히 드시고, 조금 있다가 배웅할게요.',
  },
  {
    id: 'karua.farewell-conversation.xyz-why',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'xyz-why',
    request: 'farewell-conversation',
    blocks: {
      answer: [line('XYZ는 오늘의 마지막 잔이라는 표시예요.\n더 밀어붙이지 않고 여기서 마무리하자는 뜻입니다. 잔은 아직 남아 있으니까 급하게 일어날 필요는 없고요.', 'thinking')],
    },
    fallbackText: 'XYZ는 오늘의 마지막 잔이라는 표시예요.\n더 밀어붙이지 않고 여기서 마무리하자는 뜻입니다. 잔은 아직 남아 있으니까 급하게 일어날 필요는 없고요.',
  },
  {
    id: 'karua.farewell-conversation.xyz-generic',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'xyz-generic',
    request: 'farewell-conversation',
    blocks: {
      answer: [line('아직 바로 나가시라는 뜻은 아니에요.\n다만 새 주문은 여기서 멈출게요. 남은 잔 이야기 정도는 조금 더 해도 괜찮습니다.', 'talk')],
    },
    fallbackText: '아직 바로 나가시라는 뜻은 아니에요.\n다만 새 주문은 여기서 멈출게요. 남은 잔 이야기 정도는 조금 더 해도 괜찮습니다.',
  },
  {
    id: 'karua.farewell-block.ordering-blocked',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'ordering-blocked',
    request: 'farewell-block',
    blocks: {
      answer: [line('오늘 주문은 여기까지 받을게요.\n이 구간은 더 추천하기보다 마무리 시간이에요. 방금 드신 것에 대한 이야기나 오늘 마신 것 정리는 들어볼게요.', 'smirk')],
    },
    fallbackText: '오늘 주문은 여기까지 받을게요.\n이 구간은 더 추천하기보다 마무리 시간이에요. 방금 드신 것에 대한 이야기나 오늘 마신 것 정리는 들어볼게요.',
  },
  {
    id: 'karua.farewell-return-home.return-home',
    speaker: 'karua',
    intent: 'goodbye',
    state: 'return-home',
    request: 'farewell-return-home',
    blocks: {
      answer: [line('오늘도 거의 비웠어요.\n오늘은 여기까지 하시죠. 조심히 들어가세요.', 'idle')],
    },
    fallbackText: '오늘도 거의 비웠어요.\n오늘은 여기까지 하시죠. 조심히 들어가세요.',
  },
]

export const SESSION_RESPONSE_PLANS: readonly ResponsePlan[] = [
  ...WELCOME_DRINK_PLANS,
  ...WELCOME_FEEDBACK_PLANS,
  ...FAREWELL_ENTRY_PLANS,
  ...FAREWELL_XYZ_CLARIFICATION_PLANS,
  ...FAREWELL_XYZ_PLANS,
  ...FAREWELL_WELCOME_XYZ_PLANS,
  ...FAREWELL_PHASE_PLANS,
]
