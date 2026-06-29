import type { Expression } from '../../types.js'
import type { CocktailData } from '../../types.js'

export function isEjectionConcern(input: string): boolean {
  return /나가라는|나가란|쫓|퇴장|가라는|가란/.test(input)
}

export function formatWelcomeXyzClarificationReply(): { text: string; expression: Expression } {
  return {
    text: '그런 뜻은 아니에요.',
    expression: 'smirk',
  }
}

export function formatFarewellConversationReply(
  input: string,
  options: { hasXyz?: boolean } = {},
): { text: string; expression: Expression } {
  if (options.hasXyz === false) {
    if (isEjectionConcern(input)) {
      return {
        text: '쫓아내는 뜻은 아니에요. 다만 오늘 서비스는 여기서 마무리하고, 천천히 배웅하겠다는 뜻입니다.',
        expression: 'sympathy',
      }
    }
    return {
      text: '오늘은 새 잔을 더 놓지 않을게요. 남은 이야기를 조금 정리한 뒤 천천히 배웅하겠습니다.',
      expression: 'talk',
    }
  }

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

export function formatXyzReply(cocktail: CocktailData): string {
  const name = cocktail.name_ko ?? cocktail.name
  return `오늘의 마지막 서비스입니다. ${name}로 마무리할게요.\n이 이상 주문은 더 받지 않을게요. 천천히 드시고, 곧 귀가 준비하겠습니다.`
}

export function formatWelcomeFarewellXyzReply(cocktail: CocktailData): string {
  const name = cocktail.name_ko ?? cocktail.name
  return `웰컴드링크를 건너뛴 채 마무리할 뻔했네요.\n첫 잔과 마지막 잔을 겸해서 ${name}를 드릴게요. 오늘 주문은 이 잔으로 닫겠습니다.`
}

export function formatStandardFarewellEntryReply(): string {
  return '오늘은 잔을 더 놓지 않고 여기서 마무리할게요.\n잠깐 숨을 고른 뒤 조심히 돌아가실 수 있게 배웅하겠습니다.'
}

export function formatFarewellBlockReply(): string {
  return '오늘 주문은 여기까지 받을게요.\n이 구간은 더 추천하기보다 마무리 시간이에요. 방금 드신 것에 대한 이야기나 오늘 마신 것 정리는 들어볼게요.'
}

export function formatReturnHomeReply(): string {
  return '오늘도 거의 비웠어요.\n오늘은 여기까지 하시죠. 조심히 들어가세요.'
}
