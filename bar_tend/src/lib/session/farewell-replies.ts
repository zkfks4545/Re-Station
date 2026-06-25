import type { Expression } from '../../types.js'

export function isEjectionConcern(input: string): boolean {
  return /나가라는|나가란|쫓|퇴장|가라는|가란/.test(input)
}

export function formatWelcomeXyzClarificationReply(): { text: string; expression: Expression } {
  return {
    text: '그런 뜻은 아니에요.',
    expression: 'smirk',
  }
}

export function formatFarewellConversationReply(input: string): { text: string; expression: Expression } {
  if (isEjectionConcern(input)) {
    return {
      text: '오늘 새 주문은 여기까지라는 뜻입니다.\nXYZ는 문 닫는 종이 아니라 마지막 잔 쪽에 가깝죠. 천천히 드시고, 조금 있다가 배웅할게요.',
      expression: 'smirk',
    }
  }

  if (/왜|마지막|끝|XYZ|엑스와이즈|엑스\s*와이\s*지/i.test(input)) {
    return {
      text: 'XYZ는 오늘의 마지막 잔이라는 표시예요.\n더 밀어붙이지 않고 여기서 마무리하자는 뜻입니다. 잔은 아직 남아 있으니까 급하게 일어날 필요는 없고요.',
      expression: 'thinking',
    }
  }

  return {
    text: '아직 바로 나가시라는 뜻은 아니에요.\n다만 새 주문은 여기서 멈출게요. 남은 잔 이야기 정도는 조금 더 해도 괜찮습니다.',
    expression: 'talk',
  }
}
