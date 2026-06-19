import { cocktails } from '../cocktails/database.js'
import { detectExitIntent } from '../dialogue/input-router.js'
import type { Cocktail, Message, BartenderResponse, ConversationContext } from '../../types.js'

const kf = (patterns: string[]) => new RegExp(patterns.map(
  (p) => (/^[a-z]/i.test(p) ? `\\b${p}\\b` : p)
).join('|'))

function detectIntent(input: string): string {
  const lower = input.toLowerCase()
  if (detectExitIntent(lower)) return 'exit-intent'
  if (kf(['여기 뭐', '뭐하는 곳', 'Re:Station', '리스테이션', '처음 왔']).test(lower)) return 'bar-setting'
  if (kf(['시에스타', '사장님', '사장']).test(lower)) return 'siesta-setting'
  if (kf(['물 좀', '물 주세요', '물 줘', '물 한잔', '물 한 잔']).test(lower)) return 'water-request'
  if (kf(['취했', '너무 취', '많이 마셨', '그만 마셔', '술 그만']).test(lower)) return 'overdrunk'
  if (kf(['미성년', '고등학생', '중학생', '학생인데', '술 못 마셔']).test(lower)) return 'minor-or-no-alcohol'
  if (kf(['무알코올', '논알콜', '논알코올', '알코올 없이', '술 없이']).test(lower)) return 'non-alcoholic'
  if (kf(['알레르기', '못 먹', '빼고', '제외', '먹으면 안']).test(lower)) return 'ingredient-constraint'
  if (kf(['예약', '영업시간', '주소', '위치', '전화', '결제', '카드 돼', '화장실']).test(lower)) return 'real-world-info'
  if (kf(['추천', '뭐가 좋아', '칵테일', '마실', '취하', '주문']).test(lower)) return 'cocktail-query'
  if (kf(['달콤', '쓰다', '신맛', '짠맛', '향', '맛', '상큼', '청량', '순하', '강하', '진하']).test(lower)) return 'taste-query'
  if (kf(['어떻게', '재료', '만들', '레시피', '뭐가 들']).test(lower)) return 'recipe-query'
  if (kf(['힘들', '우울', '슬퍼', '행복', '기분', '외롭', '지쳤', '스트레스']).test(lower)) return 'mood-talk'
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

      if (kf(['안녕', '하이', '방가', '처음', '반가워']).test(t)) ctx.greeted = true
      if (kf(['힘들', '우울', '슬퍼', '외롭', '스트레스', '피곤', '괴롭', '지쳤']).test(t)) ctx.userMood = 'sad'
      if (kf(['좋아', '행복', '신나', '축하', '기쁘', '즐거', '최고']).test(t)) ctx.userMood = 'happy'
      if (kf(['추천', '뭐가 좋아', '칵테일', '마실', '취하', '주문']).test(t)) ctx.lastTopic = 'cocktail-request'
      if (kf(['달콤', '달아', '시럽', '달게', '달짝']).test(t)) ctx.lastTopic = 'taste-sweet'
      if (kf(['씁쓸', '쓰다', '비터', '쓴맛']).test(t)) ctx.lastTopic = 'taste-bitter'
      if (kf(['상쾌', '시원', '청량', 'fresh', '탄산', '기포']).test(t)) ctx.lastTopic = 'taste-refresh'
      if (kf(['이야기', '사연', '비밀', '옛날', '추억', '유래']).test(t)) ctx.lastTopic = 'story'
      if (kf(['어떻게', '재료', '만들', '레시피', '뭐가 들']).test(t)) ctx.lastTopic = 'recipe'

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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface ResponseTemplate {
  response: string
  expression: BartenderResponse['expression']
}

const SAD_RESPONSES: ResponseTemplate[] = [
  { response: '오늘 많이 힘드셨나 봐요. 괜찮으시면 천천히 말씀해 주세요.', expression: 'sympathy' },
  { response: '지금 기분에 맞는 한 잔을 찾으시면 원하는 맛을 말씀해 주세요.', expression: 'sympathy' },
  { response: '괜찮으신 만큼만 편하게 말씀해 주세요.', expression: 'sympathy' },
]

const HAPPY_RESPONSES: ResponseTemplate[] = [
  { response: '좋은 일이 있으셨군요. 축하하기 좋은 칵테일을 골라볼게요.', expression: 'smirk' },
  { response: '축하할 자리에 어울리는 칵테일을 찾아볼게요.', expression: 'smirk' },
]

const COCKTAIL_REQUEST: ResponseTemplate[] = [
  { response: '칵테일을 추천해 드릴게요. 어떤 맛을 좋아하세요?', expression: 'thinking' },
  { response: '취향에 맞는 걸 찾으려면 몇 가지만 여쭤볼게요.', expression: 'talk' },
]

const TASTE_SWEET: ResponseTemplate[] = [
  { response: '달콤한 쪽을 좋아하시는군요. 그쪽으로 찾아볼게요.', expression: 'talk' },
  { response: '달콤한 풍미를 중심으로 볼게요.', expression: 'talk' },
  { response: '단맛 위주로 골라볼게요. 기대하셔도 좋아요.', expression: 'smirk' },
]

const TASTE_BITTER: ResponseTemplate[] = [
  { response: '쌉쌀한 맛을 좋아하시는군요. 그쪽으로 찾아볼게요.', expression: 'smirk' },
  { response: '쌉쌀한 풍미를 중심으로 볼게요.', expression: 'smirk' },
  { response: '쓴맛도 입맛이네요. 잘 어울리는 걸로 찾아볼게요.', expression: 'smirk' },
]

const TASTE_REFRESH: ResponseTemplate[] = [
  { response: '청량한 맛을 좋아하시는군요. 시원한 쪽으로 찾아볼게요.', expression: 'talk' },
  { response: '상쾌한 풍미를 중심으로 볼게요.', expression: 'talk' },
  { response: '시원하고 가볍게 마실 수 있는 쪽으로 찾아볼게요.', expression: 'talk' },
]

const RECIPE_REQUEST: ResponseTemplate[] = [
  { response: '레시피를 알려드릴게요. 어떤 칵테일이 궁금하세요?', expression: 'talk' },
  { response: '궁금한 칵테일 이름을 말씀해 주시면 레시피를 찾아드릴게요.', expression: 'talk' },
]

const BAR_SETTING: ResponseTemplate[] = [
  { response: '여기는 Re:Station이에요. 지금 기분이나 취향을 말해 주시면 어울리는 한 잔을 같이 골라드릴게요.', expression: 'talk' },
  { response: 'Re:Station은 가상의 바예요. 실제 매장 안내보다는 지금 마시고 싶은 분위기를 맞추는 쪽에 가까워요.', expression: 'talk' },
]

const SIESTA_SETTING: ResponseTemplate[] = [
  { response: '시에스타 사장님은 보통 뒤쪽 일을 보고 계세요. 가끔 대화에 끼어들어도 금방 다시 일하러 가실 거예요.', expression: 'smirk' },
  { response: '사장님은 시에스타예요. 말은 짧은데, 이상하게 필요한 말만 하고 지나가세요.', expression: 'smirk' },
]

const WATER_REQUEST: ResponseTemplate[] = [
  { response: '물 먼저 드릴게요. 한 잔 고르는 건 그 다음에 천천히 해도 괜찮아요.', expression: 'talk' },
  { response: '좋아요, 물부터 드릴게요. 잠깐 쉬고 나서 취향을 맞춰봐도 늦지 않아요.', expression: 'talk' },
]

const OVERDRUNK: ResponseTemplate[] = [
  { response: '그럼 여기서는 더 권하지 않을게요. 물부터 드시고, 조금 쉬었다가 움직이세요.', expression: 'sympathy' },
  { response: '이미 많이 드셨다면 새 잔은 멈출게요. 지금은 물이랑 쉬는 쪽이 먼저예요.', expression: 'sympathy' },
]

const MINOR_OR_NO_ALCOHOL: ResponseTemplate[] = [
  { response: '알코올은 안내하지 않을게요. 대신 무알코올이나 맛 방향 이야기 정도는 도와드릴 수 있어요.', expression: 'talk' },
  { response: '술은 제외하고 볼게요. 무알코올 느낌이나 좋아하는 맛을 말해 주세요.', expression: 'talk' },
]

const NON_ALCOHOLIC: ResponseTemplate[] = [
  { response: '무알코올 쪽으로 볼게요. 지금 메뉴에서 가능 범위가 좁으면 억지로 술 있는 잔을 권하진 않을게요.', expression: 'talk' },
  { response: '알코올 없이 가는 걸로 잡을게요. 달콤한 쪽인지, 상큼한 쪽인지부터 보면 좋아요.', expression: 'talk' },
]

const INGREDIENT_CONSTRAINT: ResponseTemplate[] = [
  { response: '그 재료는 피해서 볼게요. 정확히 어떤 재료를 제외할지 말씀해 주세요.', expression: 'thinking' },
  { response: '못 드시는 재료가 있으면 먼저 빼고 볼게요. 이름을 알려주시면 후보에서 제외하겠습니다.', expression: 'thinking' },
]

const REAL_WORLD_INFO: ResponseTemplate[] = [
  { response: '여긴 실제 매장 안내보다는 가상의 바 대화와 칵테일 추천을 위한 공간이에요. 메뉴나 취향 쪽은 바로 도와드릴게요.', expression: 'talk' },
  { response: '실제 예약이나 결제 안내는 제공하지 않아요. 대신 지금 고르고 싶은 잔은 같이 찾아볼 수 있어요.', expression: 'talk' },
]

function getCocktailMentionResponses(cocktail: Cocktail): ResponseTemplate[] {
  return [
    { response: `${cocktail.name}을 찾으시는군요. ${cocktail.story}`, expression: 'talk' },
    { response: `${cocktail.name} 말씀이시군요. 주문하시거나 자세한 정보를 보실 수 있어요.`, expression: 'smirk' },
  ]
}

const GENERAL_CHAT: ResponseTemplate[] = [
  { response: '칵테일을 추천받거나 메뉴에 대해 물어보셔도 돼요.', expression: 'idle' },
  { response: '필요한 게 있으면 말씀해 주세요.', expression: 'talk' },
  { response: '어떤 걸 원하시는지 조금만 더 말씀해 주시겠어요?', expression: 'talk' },
  { response: '칵테일 추천이나 메뉴 안내를 도와드릴게요.', expression: 'talk' },
]

const AFTER_RECOMMENDATION: ResponseTemplate[] = [
  { response: '다른 칵테일도 찾아드릴까요?', expression: 'talk' },
  { response: '다른 추천이 필요하면 말씀해 주세요.', expression: 'smirk' },
]

export function generateResponse(input: string, history: Message[]): BartenderResponse {
  const ctx = buildConversationContext(history)

  if (ctx.mentionedCocktail) {
    return pick(getCocktailMentionResponses(ctx.mentionedCocktail))
  }

  const intent = detectIntent(input)

  switch (intent) {
    case 'exit-intent':
      return { response: '들러주셔서 감사합니다. 조심히 가세요.', expression: 'idle' }

    case 'bar-setting':
      return pick(BAR_SETTING)

    case 'siesta-setting':
      return pick(SIESTA_SETTING)

    case 'water-request':
      return pick(WATER_REQUEST)

    case 'overdrunk':
      return pick(OVERDRUNK)

    case 'minor-or-no-alcohol':
      return pick(MINOR_OR_NO_ALCOHOL)

    case 'non-alcoholic':
      return pick(NON_ALCOHOLIC)

    case 'ingredient-constraint':
      return pick(INGREDIENT_CONSTRAINT)

    case 'real-world-info':
      return pick(REAL_WORLD_INFO)

    case 'cocktail-query':
      return pick(COCKTAIL_REQUEST)

    case 'mood-talk': {
      if (ctx.userMood === 'sad') return pick(SAD_RESPONSES)
      if (ctx.userMood === 'happy') return pick(HAPPY_RESPONSES)
      return {
        response: '지금 기분에 맞는 한 잔을 찾으시면 말씀해 주세요.',
        expression: 'talk',
      }
    }

    case 'taste-query': {
      if (kf(['달콤', '달아', '시럽', '달게', '단']).test(input)) return pick(TASTE_SWEET)
      if (kf(['씁쓸', '쓰다', '비터', '쓴맛']).test(input)) return pick(TASTE_BITTER)
      if (kf(['상쾌', '시원', '청량', 'fresh', '탄산', '순하', '강하', '진하']).test(input)) return pick(TASTE_REFRESH)
      return {
        response: '어떤 맛을 좋아하시는지 말씀해 주세요.',
        expression: 'talk',
      }
    }

    case 'recipe-query':
      return pick(RECIPE_REQUEST)

    default: {
      if (ctx.recommendedCocktail && ctx.lastTopic === 'cocktail-request') {
        return pick(AFTER_RECOMMENDATION)
      }
      if (ctx.userMood === 'sad') return pick(SAD_RESPONSES)
      return pick(GENERAL_CHAT)
    }
  }
}
