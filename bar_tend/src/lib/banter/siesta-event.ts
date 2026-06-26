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
      ['siesta', '그 잔이면 방금 말한 기분하고는 맞겠네.'],
      ['karua', '제가 고른 건데 사장님이 자연스럽게 검수하시네요?'],
      ['siesta', '틀린 말은 아니니까. 재고 보고 올게.'],
      ['karua', '검수 통과래요. 그럼 이걸로 이어가 볼게요.'],
    ],
    [
      ['siesta', '방금 고른 건 향이 먼저 오고, 뒤가 조용한 쪽이지.'],
      ['karua', '사장님, 제가 하려던 멋있는 말을 가져가시면 어떡해요.'],
      ['siesta', '아껴 써. 윗집에 시럽 좀 갖다 주고 올게.'],
      ['karua', '네, 멋있는 말은 반납됐고요. 손님 잔은 그대로 준비할게요.'],
    ],
    [
      ['siesta', '손님 취향이 아예 빈손은 아니네.'],
      ['karua', '그 말, 칭찬 맞죠? 저희 바에서는 꽤 높은 점수예요.'],
      ['siesta', '맞아. 얼음 채우러 갔다 올게.'],
      ['karua', '높은 점수 받은 김에, 이 잔으로 가보죠.'],
    ],
  ],
  strong: [
    [
      ['siesta', '센 걸 찾는 날이어도 속도는 낮춰.'],
      ['karua', '사장님이 속도를 말하면 보통 잔보다 사람이 먼저예요.'],
      ['siesta', '그게 맞아. 바닥 마저 닦고 올게.'],
      ['karua', '그러니까 맛은 세게 가도, 마시는 건 천천히요.'],
    ],
    [
      ['siesta', '독한 쪽이면 향이 눌리지 않는 걸로 줘.'],
      ['karua', '주문이 아니라 감독이 들어왔네요. 네, 참고할게요.'],
      ['siesta', '감독은 아니고. 빈 병 정리하고 올게.'],
      ['karua', '그럼 향은 살리고 도수는 또렷한 쪽으로 볼게요.'],
    ],
    [
      ['siesta', '빈속이면 센 잔은 뒤로 미뤄.'],
      ['karua', '이건 농담처럼 들려도 진짜 주의사항이에요.'],
      ['siesta', '주방 다녀올게.'],
      ['karua', '일단 무리 없는 선에서 맞춰볼게요. 잔이 사람을 이기면 곤란하니까요.'],
    ],
  ],
  tired: [
    [
      ['siesta', '피곤한 날은 말보다 잔이 먼저 쉬어야 하더라.'],
      ['karua', '잔이 쉬면 손님도 조금 쉬는 걸로 칠까요?'],
      ['siesta', '그 정도면 돼. 창고 마저 볼게.'],
      ['karua', '그럼 오늘은 부담 없는 쪽으로 이어갈게요.'],
    ],
    [
      ['siesta', '오늘은 좀 쉬엄쉬엄해. 손님도, 너도.'],
      ['karua', '저까지 포함된 지시였어요? 갑자기 복지가 생겼네요.'],
      ['siesta', '착각하지 말고. 카운터 닦고 올게.'],
      ['karua', '복지는 취소됐고요. 손님 쪽은 쉬엄쉬엄 맞춰드릴게요.'],
    ],
    [
      ['siesta', '힘든 말은 길게 안 꺼내도 티가 나.'],
      ['karua', '그래서 제가 긴 질문은 줄이고 있었죠. 아마도요.'],
      ['siesta', '아마도면 됐다. 음료 준비하러 잠깐 들어갈게.'],
      ['karua', '짧게 갈게요. 지금은 편한 맛부터 잡아보죠.'],
    ],
    [
      ['siesta', '퇴근하고 싶은 날엔 너무 복잡한 잔은 피하는 게 낫지.'],
      ['karua', '사장님이 퇴근 얘기를 하시면 묘하게 설득력이 있어요.'],
      ['siesta', '뒤에 정리할 게 있어서.'],
      ['karua', '네, 저희는 아직 근무 중이니까 가볍게 이어가겠습니다.'],
    ],
  ],
  celebration: [
    [
      ['siesta', '오늘 뭔가 좋은 날인가 보네. 잔이 들뜬다.'],
      ['karua', '잔이 들뜬다는 표현은 처음 듣는데, 이상하게 맞네요.'],
      ['siesta', '축하할 일이면 얼음 아끼지 마. 뒤쪽 보고 올게.'],
      ['karua', '그럼 밝고 산뜻한 쪽으로 분위기 맞춰볼게요.'],
    ],
    [
      ['siesta', '좋은 일 있는 손님은 들어올 때 공기가 조금 달라.'],
      ['karua', '사장님이 이렇게 말하면 제가 농담할 틈이 없잖아요.'],
      ['siesta', '틈은 네가 알아서 찾아. 잔 정리하고 올게.'],
      ['karua', '틈을 찾아서, 축하 쪽으로 어울리는 잔을 볼게요.'],
    ],
  ],
  sweet: [
    [
      ['siesta', '단맛 찾는 날은 끝맛이 너무 무겁지 않게 봐.'],
      ['karua', '사장님 취향 아닌 척하시면서 기준은 제일 정확하시다니까요.'],
      ['siesta', '시럽 채우고 올게.'],
      ['karua', '달게 가되 물리지 않는 쪽으로 잡아볼게요.'],
    ],
    [
      ['siesta', '단 건 잠깐 기분을 옆으로 돌려주긴 해.'],
      ['karua', '해결은 아니고 방향 전환. 이 바의 몇 안 되는 멀쩡한 표현이네요.'],
      ['siesta', '냉장고 정리 좀 하고 올게.'],
      ['karua', '그럼 기분 전환용으로 달콤한 쪽을 보겠습니다.'],
    ],
    [
      ['siesta', '달달한 쪽이면 향이 먼저 웃어야지.'],
      ['karua', '향이 웃는다니, 오늘 사장님 표현이 부지런하네요.'],
      ['siesta', '부지런한 김에 배달 확인하고 올게.'],
      ['karua', '향부터 부드러운 걸로 이어가 볼게요.'],
    ],
  ],
  sad: [
    [
      ['siesta', '말을 다 안 해도 무거운 날은 있지.'],
      ['karua', '그래서 오늘은 제가 너무 캐묻지 않는 쪽으로 갈게요.'],
      ['siesta', '그게 낫다. 불 꺼진 쪽 보고 올게.'],
      ['karua', '편하게 마실 수 있는 쪽으로 천천히 맞춰볼게요.'],
    ],
    [
      ['siesta', '속 얘기는 굳이 여기서 다 꺼낼 필요 없어.'],
      ['karua', '맞아요. 잔은 맞춰도 사연까지 주문받진 않을게요.'],
      ['siesta', '뒤에 설거지하고 올게.'],
      ['karua', '그럼 말 적게, 맛은 너무 날카롭지 않게 가보죠.'],
    ],
  ],
  default: [
    [
      ['siesta', '손님 말 듣고 있으면 대충 잔 방향은 보이네.'],
      ['karua', '그걸 대충이라고 하시면 제 일은 뭐가 되나요.'],
      ['siesta', '일은 계속해. 잔 정리하고 올게.'],
      ['karua', '네, 계속하겠습니다. 방금 흐름 그대로 받을게요.'],
    ],
    [
      ['siesta', '너무 설명하려고 들면 맛이 늦게 와.'],
      ['karua', '제가 설명을 길게 하는 편은 아니거든요. 보통은요.'],
      ['siesta', '보통만 해. 테이블 닦고 올게.'],
      ['karua', '좋아요, 보통보다 조금 짧게 이어갈게요.'],
    ],
    [
      ['siesta', '분위기 괜찮네. 손님이 너무 서두르진 않아서.'],
      ['karua', '그럼 저도 서두르는 척만 하고 천천히 하겠습니다.'],
      ['siesta', '척은 빼고. 음료 준비하러 잠깐.'],
      ['karua', '네, 척은 빼고 차분하게 이어갈게요.'],
    ],
    [
      ['siesta', '조용한 밤엔 작은 말도 잘 들려.'],
      ['karua', '그러면 제가 더 작게 말해야 하나요, 아니면 덜 이상하게 말해야 하나요.'],
      ['siesta', '둘 다. 재고 정리하고 올게.'],
      ['karua', '둘 다는 어렵고, 일단 덜 이상하게 이어가 볼게요.'],
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
