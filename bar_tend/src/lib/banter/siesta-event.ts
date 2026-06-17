import type { Message } from '../../types.js'
import type { InputRoute } from '../dialogue/input-router.js'

export type SiestaBranch =
  | 'recommendation'
  | 'strong'
  | 'tired'
  | 'celebration'
  | 'sweet'
  | 'sad'
  | 'default'

export type DialogueSet = Array<[Message['speaker'], string]>

export interface SiestaEventContext {
  inputText: string
  replyText: string
  inputRoute: InputRoute
  userMessageCount: number
  eventCount: number
  cooldownTurns: number
  recommendationActive: boolean
  recommendedCocktailName?: string
}

export interface SiestaEventResult {
  messages: Message[]
  branch: SiestaBranch
  key: string
}

export const MAX_SIESTA_EVENTS_PER_SESSION = 2
export const SIESTA_EVENT_COOLDOWN_TURNS = 6

export const DIALOGUE_POOLS: Record<SiestaBranch, DialogueSet[]> = {
  recommendation: [
    [
      ['siesta', '잘 골랐네.'],
      ['karua', '제가 골랐는데 손님 칭찬만 하시네요?'],
      ['siesta', '재고 보고 올게.'],
    ],
    [
      ['siesta', '그거 괜찮은 선택이야.'],
      ['karua', '사장님이 괜찮다고 하시니 다행이네요.'],
      ['siesta', '윗집에 시럽 좀 갖다 주고 올게.'],
    ],
    [
      ['siesta', '손님 취향 좋은데?'],
      ['karua', '사장님도 그렇게 말씀하시면 제 고른 게 다 좋은 걸로 들어요.'],
      ['siesta', '얼음 채우러 갔다 올게.'],
    ],
  ],
  strong: [
    [
      ['siesta', '센 건 천천히 줘.'],
      ['karua', '사장님이 천천히 말하면 진짜 천천히란 뜻이에요.'],
      ['siesta', '바닥 마저 닦고 올게.'],
    ],
    [
      ['siesta', '독한 걸로 가시네.'],
      ['karua', '사장님도 그 정도는 거뜬하시죠, 뭐.'],
      ['siesta', '빈 병 정리하고 올게.'],
    ],
    [
      ['siesta', '그건 밥 먹고 마셔.'],
      ['karua', '사장님 말씀 들으셨죠? 빈속은 주의하세요.'],
      ['siesta', '주방 다녀올게.'],
    ],
  ],
  tired: [
    [
      ['siesta', '피곤한 날은 길더라.'],
      ['karua', '그래서 여기 의자가 묘하게 사람을 붙잡나 봐요.'],
      ['siesta', '창고 마저 볼게.'],
    ],
    [
      ['siesta', '오늘은 좀 쉬엄쉬엄해.'],
      ['karua', '사장님이 그러시면 저도 맘 편히 일하고요.'],
      ['siesta', '카운터 닦고 올게.'],
    ],
    [
      ['siesta', '힘들 땐 말이라도 꺼내야 낫더라.'],
      ['karua', '말 안 해도 괜찮으시면 저도 그냥 있을게요.'],
      ['siesta', '음료 준비하러 잠깐 들어갈게.'],
    ],
    [
      ['siesta', '퇴근하고 싶은 날이지.'],
      ['karua', '사장님, 손님 앞에서는 그런 말씀— 아, 벌써 가셨네.'],
      ['siesta', '뒤에 정리할 게 있어서.'],
    ],
  ],
  celebration: [
    [
      ['siesta', '오늘 뭔가 좋은 날인가 보네.'],
      ['karua', '저는 무슨 날인지 몰라도 분위기로는 맞혀야죠.'],
      ['siesta', '축하할 일이 있으면 한잔 더 줄게.'],
    ],
    [
      ['siesta', '기분 좋은 냄새가 나네.'],
      ['karua', '사장님이 냄새까지 맡으시면 저는 할 말이 없네요.'],
      ['siesta', '오늘따라 바가 환하게 보여.'],
    ],
  ],
  sweet: [
    [
      ['siesta', '달콤한 건 기분까지 달아지더라.'],
      ['karua', '사장님이 달콤한 걸 좋아하시는 쪽은 아닌데, 손님은 환영이래요.'],
      ['siesta', '시럽 채우고 올게.'],
    ],
    [
      ['siesta', '단 거 먹고 우울한 사람 없대.'],
      ['karua', '전설은 아니고 사장님 경험담이겠죠?'],
      ['siesta', '냉장고 정리 좀 하고 올게.'],
    ],
    [
      ['siesta', '달다구리는 따로 챙겨둘게.'],
      ['karua', '단 걸 좋아하시는 손님들께 미리 준비하신 거래요.'],
      ['siesta', '윗선 확인하고 올게.'],
    ],
  ],
  sad: [
    [
      ['siesta', '말하지 않아도 아는 날이 있어.'],
      ['karua', '사장님은 제가 말 안 해도 아는 날이 있는데 손님도 그러신가 봐요.'],
      ['siesta', '조용히 있을게, 불 꺼진 쪽 다녀올게.'],
    ],
    [
      ['siesta', '속 얘기 꺼내기엔 내가 아직 모르는 사인데, 한잔은 맞춰줄게.'],
      ['karua', '사장님이 그렇게 말씀하시면 저는 진짜 할 말이 없네요.'],
      ['siesta', '뒤에 설거지하고 올게.'],
    ],
  ],
  default: [
    [
      ['siesta', '말이 길어질 땐 잔도 조용하더라.'],
      ['karua', '잔까지 눈치 보는 바는 저희뿐일걸요.'],
      ['siesta', '잔 정리하고 올게.'],
    ],
    [
      ['siesta', '대화는 짧을수록 여운이 남나 봐.'],
      ['karua', '사장님이 하신 말씀 중에 가장 철학적이에요.'],
      ['siesta', '테이블 닦고 올게.'],
    ],
    [
      ['siesta', '분위기 괜찮네.'],
      ['karua', '저희 바가 그나마 낫죠? 사장님 말고는요.'],
      ['siesta', '음료 준비하러 잠깐.'],
    ],
    [
      ['siesta', '조용한 밤이 좋더라.'],
      ['karua', '조용한 걸 좋아하시면서 왜 바를 하셨는지 저는 아직도 모르겠어요.'],
      ['siesta', '재고 정리하고 올게.'],
    ],
  ],
}

export function createSiestaEvent(
  context: SiestaEventContext,
  recentKeys?: Set<string>,
): SiestaEventResult | null {
  if (!canStartSiestaEvent(context)) return null

  const branch = selectBranch(context)
  const { set, key } = selectDialogueSet(branch, recentKeys ?? new Set())

  return {
    messages: set.map(([speaker, text]) => ({
      role: 'bartender' as const,
      speaker,
      text,
    })),
    branch,
    key,
  }
}

export function selectBranch(context: SiestaEventContext): SiestaBranch {
  if (context.recommendedCocktailName) return 'recommendation'
  if (/도수|독한|강한|세게|쎈/.test(context.inputText)) return 'strong'
  if (/피곤|지쳤|퇴근|힘들/.test(context.inputText)) return 'tired'
  if (/축하|기념|생일|특별한 날/.test(context.inputText)) return 'celebration'
  if (/달콤|달게|디저트|달달|스위트/.test(context.inputText)) return 'sweet'
  if (/슬퍼|슬프|우울|속상|울적|서운/.test(context.inputText)) return 'sad'
  return 'default'
}

export function selectDialogueSet(
  branch: SiestaBranch,
  recentKeys: Set<string>,
): { set: DialogueSet; key: string } {
  const pool = DIALOGUE_POOLS[branch]
  const available = pool
    .map((set, i) => ({ set, key: `${branch}:${i}` }))
    .filter(entry => !recentKeys.has(entry.key))

  const candidates = available.length > 0 ? available : pool.map((set, i) => ({ set, key: `${branch}:${i}` }))
  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  return pick
}

export function canStartSiestaEvent(context: SiestaEventContext): boolean {
  if (context.recommendationActive) return false
  if (context.eventCount >= MAX_SIESTA_EVENTS_PER_SESSION) return false
  if (context.cooldownTurns > 0) return false
  if (['safety', 'exit', 'recommendation-cancel'].includes(context.inputRoute)) return false
  if (context.userMessageCount < 3 && !context.recommendedCocktailName) return false
  if (context.inputRoute === 'recommendation') {
    return context.recommendedCocktailName !== undefined
  }
  return true
}
