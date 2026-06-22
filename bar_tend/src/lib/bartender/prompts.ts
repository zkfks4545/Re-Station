import { bartenderPersona } from './persona.js'
import type { Message } from '../../types.js'

export function buildChatPrompt(input: string, history: Message[]): string {
  const recentHistory = history.slice(-6)
  const context = recentHistory
    .map((m) => `${m.role === 'user' ? '손님' : '바텐더'}: ${m.text}`)
    .join('\n')

  return `${bartenderPersona}

## 대화 기록:
${context || '아직 대화 기록이 없습니다.'}

## 손님의 메시지:
손님: ${input}

## 바텐더의 응답:
`
}
