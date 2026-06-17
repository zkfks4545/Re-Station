import type { Message } from '../../types.js'
import type { InputRoute } from '../dialogue/input-router.js'

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

export const MAX_SIESTA_EVENTS_PER_SESSION = 2
export const SIESTA_EVENT_COOLDOWN_TURNS = 6

export function createSiestaEvent(context: SiestaEventContext): Message[] | null {
  if (!canStartSiestaEvent(context)) return null

  if (context.recommendedCocktailName) {
    return toMessages([
      ['siesta', '잘 골랐네.'],
      ['karua', '제가 골랐는데 손님 칭찬만 하시네요?'],
      ['siesta', '재고 보고 올게.'],
    ])
  }

  if (/도수|독한|강한|세게|쎈/.test(context.inputText)) {
    return toMessages([
      ['siesta', '센 건 천천히 줘.'],
      ['karua', '사장님이 천천히 말하면 진짜 천천히란 뜻이에요.'],
      ['siesta', '바닥 마저 닦고 올게.'],
    ])
  }

  if (/피곤|지쳤|퇴근|힘들/.test(context.inputText)) {
    return toMessages([
      ['siesta', '피곤한 날은 길더라.'],
      ['karua', '그래서 여기 의자가 묘하게 사람을 붙잡나 봐요.'],
      ['siesta', '창고 마저 볼게.'],
    ])
  }

  return toMessages([
    ['siesta', '말이 길어질 땐 잔도 조용하더라.'],
    ['karua', '잔까지 눈치 보는 바는 저희뿐일걸요.'],
    ['siesta', '잔 정리하고 올게.'],
  ])
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

function toMessages(lines: Array<[Message['speaker'], string]>): Message[] {
  return lines.map(([speaker, text]) => ({
    role: 'bartender',
    speaker,
    text,
  }))
}
