import { findCocktailByName } from '../cocktails/database.js'
import { pickDialogue } from '../dialogue/dialogue-loader.js'
import type { Cocktail, Message, BartenderResponse, Expression } from '../../types.js'

const kf = (patterns: string[]) => new RegExp(patterns.map(
  (p) => (/^[a-z]/i.test(p) ? `\\b${p}\\b` : p)
).join('|'))

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

export function generateResponse(input: string, _history: Message[], intent: string): BartenderResponse {
  const currentCocktail = findCocktailByName(input)
  if (currentCocktail && (intent === 'general-chat' || intent === 'order-cocktail' || intent === 'order-cocktail-mixed')) {
    return getCocktailMentionResponse(currentCocktail)
  }

  switch (intent) {
    case 'exit-intent':
      return { response: '들러주셔서 감사합니다. 조심히 가세요.', expression: 'idle' }

    case 'bar-setting':
      return dialogue('bar-intro', '여기는 Re:Station이에요.', 'talk')

    case 'siesta-setting':
      return dialogue('siesta-mention', '시에스타 사장님은 뒤쪽에 계세요.', 'smirk')

    case 'bar-atmosphere':
      return dialogue('bar-atmosphere', '분위기를 먼저 보셨네요.', 'smirk')

    case 'weather-talk':
      return dialogue('small-talk-weather', '밖 날씨가 잔 고르기 좋은 핑계가 되겠네요.', 'talk')

    case 'uncertain-talk':
      return dialogue('guest-uncertain', '정해진 게 없으면 싫은 것부터 빼보죠.', 'thinking')

    case 'quiet-talk':
      return dialogue('quiet-moment', '오늘은 조용한 쪽으로 가죠.', 'talk')

    case 'water-request':
      return dialogue('water-request', '물 먼저 드릴게요.', 'talk')

    case 'overdrunk':
      return dialogue('overdrunk', '그럼 여기서는 더 권하지 않을게요.', 'sympathy')

    case 'minor-no-alcohol':
      return dialogue('minor-no-alcohol', '알코올은 안내하지 않을게요.', 'talk')

    case 'non-alcoholic':
      return dialogue('non-alcoholic', '무알코올 쪽으로 볼게요.', 'talk')

    case 'ingredient-constraint':
      return dialogue('ingredient-constraint', '그 재료는 피해서 볼게요.', 'thinking')

    case 'real-world-info':
      return dialogue('real-world-info', '여긴 가상의 바예요.', 'talk')

    case 'cocktail-query':
    case 'recommendation-query':
      if (currentCocktail) return getCocktailMentionResponse(currentCocktail)
      return dialogue('cocktail-request', '칵테일을 추천해 드릴게요.', 'thinking')

    case 'story-query':
    case 'story-query-followup':
    case 'story-query-cocktail-specific':
      return dialogue('story-request', '듣고 있어요.', 'talk')

    case 'mood-talk': {
      const mood = detectUserMood(input)
      if (mood === 'tired') return dialogue('mood-tired', '오늘은 좀 가볍게 가죠.', 'sympathy')
      if (mood === 'sad') return dialogue('mood-sad', '그런 날이 있죠. 무거운 얘기는 천천히.', 'sympathy')
      if (mood === 'happy') return dialogue('mood-happy', '좋은 일이 있으셨군요.', 'smirk')
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

    case 'random-request':
      return dialogue('random-request', '아무거나 골라드릴게요.', 'smirk')

    case 'unknown-cocktail-request':
      return dialogue('unknown-cocktail-request', '죄송해요, 그 칵테일은 저희 메뉴에 없네요.', 'talk')

    case 'recommendation-cancel':
      return dialogue('recommendation-cancel', '추천은 여기까지 할게요.', 'talk')

    case 'rude-talk': {
      if (kf(['시끄러', '닥쳐', '꺼져', '짜증나', '열받아', '화나']).test(input)) return dialogue('rude-annoyed', '그런 말씀은 듣기 좋지 않네요.', 'annoyed')
      if (kf(['당장', '빨리 해', '가져와', '내놔', '말 들어', '듣거라', '니가 뭔데']).test(input)) return dialogue('rude-boundary', '여기는 편하게 대화하는 곳이에요.', 'stern')
      return dialogue('rude-disappointed', '그렇게 생각하시는군요. 조금 아쉽네요.', 'disappointed')
    }

    default:
      return dialogue('general-chat', '편하게 말씀해 주세요.', 'talk')
  }
}

function detectUserMood(input: string): 'tired' | 'sad' | 'happy' | null {
  const t = input.toLowerCase()
  if (kf(['피곤', '지쳤', '지침', '퇴근', '졸려', '녹초']).test(t)) return 'tired'
  if (kf(['힘들', '우울', '슬퍼', '외롭', '스트레스', '괴롭', '속상', '답답']).test(t)) return 'sad'
  if (kf(['좋아', '행복', '신나', '축하', '기쁘', '즐거', '최고', '재밌', '웃기']).test(t)) return 'happy'
  return null
}
