import { cocktails } from '../cocktails/database.js'
import { detectExitIntent } from '../dialogue/input-router.js'
import { pickDialogue } from '../dialogue/dialogue-loader.js'
import type { Cocktail, Message, BartenderResponse, ConversationContext } from '../../types.js'

const kf = (patterns: string[]) => new RegExp(patterns.map(
  (p) => (/^[a-z]/i.test(p) ? `\\b${p}\\b` : p)
).join('|'))

function detectIntent(input: string): string {
  const lower = input.toLowerCase()
  if (detectExitIntent(lower)) return 'exit-intent'
  if (kf(['여기 뭐', '뭐하는 곳', 'Re:Station', '리스테이션', '처음 왔']).test(lower)) return 'bar-setting'
  if (kf(['시에스타', '사장님', '사장']).test(lower)) return 'siesta-setting'
  if (kf(['물 좀', '물 주세요', '물 줘', '물 한잔', '물 한 잔', '시원한 물']).test(lower)) return 'water-request'
  if (kf(['취했', '너무 취', '많이 마셨', '그만 마셔', '술 그만', '더 못 마시']).test(lower)) return 'overdrunk'
  if (kf(['미성년', '고등학생', '중학생', '학생인데', '술 못 마셔', '청소년']).test(lower)) return 'minor-or-no-alcohol'
  if (kf(['무알코올', '논알콜', '논알코올', '알코올 없이', '술 없이', '논알콜릭']).test(lower)) return 'non-alcoholic'
  if (kf(['알레르기', '못 먹', '빼고', '제외', '먹으면 안', '알러지']).test(lower)) return 'ingredient-constraint'
  if (kf(['예약', '영업시간', '주소', '위치', '전화', '결제', '카드 돼', '화장실', '와이파이']).test(lower)) return 'real-world-info'
  if (kf(['추천', '뭐가 좋아', '칵테일', '마실', '취하', '주문', '한 잔', '한잔']).test(lower)) return 'cocktail-query'
  if (kf(['달콤', '쓰다', '신맛', '짠맛', '향', '맛', '상큼', '청량', '순하', '강하', '진하', '산미']).test(lower)) return 'taste-query'
  if (kf(['어떻게', '재료', '만들', '레시피', '뭐가 들', '조리법', '방법']).test(lower)) return 'recipe-query'
  if (kf(['힘들', '우울', '슬퍼', '행복', '기분', '외롭', '지쳤', '스트레스', '속상', '답답']).test(lower)) return 'mood-talk'
  if (kf(['이야기', '사연', '비밀', '옛날', '추억', '유래', '뒷이야기']).test(lower)) return 'story-talk'
  if (kf(['시끄러', '닥쳐', '꺼져', '짜증나', '열받아', '화나']).test(lower)) return 'rude-talk'
  if (kf(['당장', '빨리 해', '가져와', '내놔', '말 들어', '듣거라', '니가 뭔데']).test(lower)) return 'rude-talk'
  return 'general-chat'
}

export function buildConversationContext(history: Message[]): ConversationContext {
  const ctx: ConversationContext = {
    greeted: false,
    userMood: null,
    lastTopic: null,
    mentionedCocktail: null,
    recommendedCocktail: null,
    exchangeCount: 0,
    lastBartenderWasQuestion: false,
    totalUserMessages: 0,
  }

  for (const msg of history) {
    const t = (msg.text || '').toLowerCase()

    if (msg.role === 'user') {
      ctx.totalUserMessages++

      if (kf(['안녕', '하이', '방가', '처음', '반가워', '안녕하세']).test(t)) ctx.greeted = true
      if (kf(['힘들', '우울', '슬퍼', '외롭', '스트레스', '피곤', '괴롭', '지쳤', '속상', '답답']).test(t)) ctx.userMood = 'sad'
      if (kf(['좋아', '행복', '신나', '축하', '기쁘', '즐거', '최고', '재밌', '웃기']).test(t)) ctx.userMood = 'happy'
      if (kf(['추천', '뭐가 좋아', '칵테일', '마실', '취하', '주문', '한 잔', '한잔']).test(t)) ctx.lastTopic = 'cocktail-request'
      if (kf(['달콤', '달아', '시럽', '달게', '달짝', '달달']).test(t)) ctx.lastTopic = 'taste-sweet'
      if (kf(['씁쓸', '쓰다', '비터', '쓴맛', '쌉쌀']).test(t)) ctx.lastTopic = 'taste-bitter'
      if (kf(['상쾌', '시원', '청량', 'fresh', '탄산', '기포', '톡쏘']).test(t)) ctx.lastTopic = 'taste-refresh'
      if (kf(['이야기', '사연', '비밀', '옛날', '추억', '유래', '뒷이야기']).test(t)) ctx.lastTopic = 'story'
      if (kf(['어떻게', '재료', '만들', '레시피', '뭐가 들', '조리법', '방법']).test(t)) ctx.lastTopic = 'recipe'

      for (const c of cocktails) {
        if (t.includes(c.name.toLowerCase())) {
          ctx.mentionedCocktail = c
          break
        }
      }
    } else {
      const b = msg.text.toLowerCase()
      if (/\?$/.test(msg.text.trim())) ctx.lastBartenderWasQuestion = true
      for (const c of cocktails) {
        if (b.includes(c.name.toLowerCase())) {
          ctx.recommendedCocktail = c
          break
        }
      }
    }
  }

  ctx.exchangeCount = Math.floor(history.length / 2)
  return ctx
}

function getCocktailMentionResponse(cocktail: Cocktail): BartenderResponse {
  const templates = [
    { response: `${cocktail.name}을 찾으시는군요. ${cocktail.story}`, expression: 'talk' as const },
    { response: `${cocktail.name} 말씀이시군요. 주문하시거나 자세한 정보를 보실 수 있어요.`, expression: 'smirk' as const },
    { response: `${cocktail.name}은 좋은 선택이에요. ${cocktail.vibe}`, expression: 'smirk' as const },
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

function dialogue(category: string, fallback: string, expression: Expression): BartenderResponse {
  const picked = pickDialogue(category)
  return picked ? { response: picked.text, expression: picked.expression } : { response: fallback, expression }
}

export function generateResponse(input: string, history: Message[]): BartenderResponse {
  const ctx = buildConversationContext(history)

  if (ctx.mentionedCocktail) {
    return getCocktailMentionResponse(ctx.mentionedCocktail)
  }

  const intent = detectIntent(input)

  switch (intent) {
    case 'exit-intent':
      return { response: '들러주셔서 감사합니다. 조심히 가세요.', expression: 'idle' }

    case 'bar-setting':
      return dialogue('bar-intro', '여기는 Re:Station이에요.', 'talk')

    case 'siesta-setting':
      return dialogue('siesta-mention', '시에스타 사장님은 뒤쪽에 계세요.', 'smirk')

    case 'water-request':
      return dialogue('water-request', '물 먼저 드릴게요.', 'talk')

    case 'overdrunk':
      return dialogue('overdrunk', '그럼 여기서는 더 권하지 않을게요.', 'sympathy')

    case 'minor-or-no-alcohol':
      return dialogue('minor-no-alcohol', '알코올은 안내하지 않을게요.', 'talk')

    case 'non-alcoholic':
      return dialogue('non-alcoholic', '무알코올 쪽으로 볼게요.', 'talk')

    case 'ingredient-constraint':
      return dialogue('ingredient-constraint', '그 재료는 피해서 볼게요.', 'thinking')

    case 'real-world-info':
      return dialogue('real-world-info', '여긴 가상의 바예요.', 'talk')

    case 'cocktail-query':
      return dialogue('cocktail-request', '칵테일을 추천해 드릴게요.', 'thinking')

    case 'story-talk':
      return dialogue('story-request', '듣고 있어요.', 'talk')

    case 'mood-talk': {
      if (ctx.userMood === 'sad') return dialogue('mood-sad', '오늘 많이 힘드셨나 봐요.', 'sympathy')
      if (ctx.userMood === 'happy') return dialogue('mood-happy', '좋은 일이 있으셨군요.', 'smirk')
      return {
        response: '지금 기분에 맞는 한 잔을 찾으시면 말씀해 주세요.',
        expression: 'talk',
      }
    }

    case 'taste-query': {
      if (kf(['달콤', '달아', '시럽', '달게', '단']).test(input)) return dialogue('taste-sweet', '달콤한 쪽으로 찾아볼게요.', 'talk')
      if (kf(['씁쓸', '쓰다', '비터', '쓴맛']).test(input)) return dialogue('taste-bitter', '쌉쌀한 쪽으로 찾아볼게요.', 'smirk')
      if (kf(['상쾌', '시원', '청량', 'fresh', '탄산', '순하', '강하', '진하']).test(input)) return dialogue('taste-refresh', '청량한 쪽으로 찾아볼게요.', 'talk')
      return {
        response: '어떤 맛을 좋아하시는지 말씀해 주세요.',
        expression: 'talk',
      }
    }

    case 'recipe-query':
      return dialogue('recipe-request', '레시피를 알려드릴게요.', 'talk')

    case 'rude-talk': {
      if (kf(['시끄러', '닥쳐', '꺼져', '짜증나', '열받아', '화나']).test(input)) return dialogue('rude-annoyed', '그런 말씀은 듣기 좋지 않네요.', 'annoyed')
      if (kf(['당장', '빨리 해', '가져와', '내놔', '말 들어', '듣거라', '니가 뭔데']).test(input)) return dialogue('rude-boundary', '여기는 편하게 대화하는 곳이에요.', 'stern')
      return dialogue('rude-disappointed', '그렇게 생각하시는군요. 조금 아쉽네요.', 'disappointed')
    }

    default: {
      if (ctx.totalUserMessages >= 4 && ctx.lastTopic === null) {
        return dialogue('long-conversation-prompt', '혹시 칵테일 추천을 원하시면 편하게 말씀해 주세요.', 'talk')
      }
      if (ctx.recommendedCocktail && ctx.lastTopic === 'cocktail-request') {
        return dialogue('after-recommendation', '다른 칵테일도 찾아드릴까요?', 'talk')
      }
      if (ctx.userMood === 'sad') return dialogue('mood-sad', '오늘 많이 힘드셨나 봐요.', 'sympathy')
      return dialogue('general-chat', '편하게 말씀해 주세요.', 'talk')
    }
  }
}
