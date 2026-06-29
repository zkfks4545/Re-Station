import { findCocktailByName, cocktails } from '../cocktails/database.js'
import { pickDialogue } from '../dialogue/dialogue-loader.js'
import { formatStoryQueryReply } from '../dialogue/story-query.js'
import { INTENT_RESPONSE_TEMPLATES, COCKTAIL_FALLBACK_TEMPLATES, formatCocktailMentionResponse } from '../dialogue/response-templates.js'
import type { CocktailData, Message, BartenderResponse, Expression } from '../../types.js'

const kf = (patterns: string[]) => new RegExp(patterns.map(
  (p) => (/^[a-z]/i.test(p) ? `\\b${p}\\b` : p)
).join('|'))

function dialogue(category: string, fallback: string, expression: Expression): BartenderResponse {
  const picked = pickDialogue(category)
  return picked ? { response: picked.text, expression: picked.expression } : { response: fallback, expression }
}

export function generateResponse(
  input: string,
  _history: Message[],
  intent: string,
  referencedCocktail?: CocktailData | null,
): BartenderResponse {
  const currentCocktail = referencedCocktail ?? findCocktailByName(input)
  if (currentCocktail && (intent === 'general-chat' || intent === 'order-cocktail' || intent === 'order-cocktail-mixed')) {
    return formatCocktailMentionResponse(currentCocktail)
  }

  const tmpl = INTENT_RESPONSE_TEMPLATES[intent]
  if (tmpl) {
    if (tmpl.dialogueCategory) {
      const picked = pickDialogue(tmpl.dialogueCategory)
      if (picked) return { response: picked.text, expression: picked.expression }
    }
    return { response: tmpl.fallback, expression: tmpl.expression }
  }

  const cocktailFallback = COCKTAIL_FALLBACK_TEMPLATES[intent]
  if (cocktailFallback) {
    if (currentCocktail) {
      if (intent === 'cocktail-info-query') {
        return { response: `「${currentCocktail.name}」은 ${currentCocktail.description}`, expression: 'talk' }
      }
      return formatCocktailMentionResponse(currentCocktail)
    }
    if (cocktailFallback.dialogueCategory) {
      const picked = pickDialogue(cocktailFallback.dialogueCategory)
      if (picked) return { response: picked.text, expression: picked.expression }
    }
    return { response: cocktailFallback.fallback, expression: cocktailFallback.expression }
  }

  switch (intent) {
    case 'story-query':
    case 'story-query-followup':
    case 'story-query-cocktail-specific':
    case 'lore-query': {
      const storyCocktail = referencedCocktail ?? findCocktailByName(input)
      if (storyCocktail) {
        const reply = formatStoryQueryReply(storyCocktail)
        return { response: reply.text, expression: reply.expression }
      }
      const personMatch = input.match(/([가-힣]{2,})[이가]\s*(?:마시|좋아하)/)
      if (personMatch) {
        const person = personMatch[1]
        const found = cocktails.find(c =>
          c.talkingPoints?.some(p => p.includes(person))
        )
        if (found) {
          const reply = formatStoryQueryReply(found)
          return { response: reply.text, expression: reply.expression }
        }
        return {
          response: `${person}에 대한 이야기는 아직 모아지지 않았네요. 다른 이야기를 들려드릴까요?`,
          expression: 'talk',
        }
      }
      return dialogue('story-request', '듣고 있어요.', 'talk')
    }

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

    case 'rude-talk': {
      if (kf(['시끄러', '닥쳐', '꺼져', '짜증나', '열받아', '화나']).test(input)) return dialogue('rude-annoyed', '그런 말씀은 듣기 좋지 않네요.', 'annoyed')
      if (kf(['당장', '빨리 해', '가져와', '내놔', '말 들어', '듣거라', '니가 뭔데']).test(input)) return dialogue('rude-boundary', '여기는 편하게 대화하는 곳이에요.', 'stern')
      return dialogue('rude-disappointed', '그렇게 생각하시는군요. 조금 아쉽네요.', 'disappointed')
    }

  }

  return dialogue('general-chat', '편하게 말씀해 주세요.', 'talk')
}

function detectUserMood(input: string): 'tired' | 'sad' | 'happy' | null {
  const t = input.toLowerCase()
  if (kf(['피곤', '지쳤', '지침', '퇴근', '졸려', '녹초']).test(t)) return 'tired'
  if (kf(['힘들', '우울', '슬퍼', '외롭', '스트레스', '괴롭', '속상', '답답']).test(t)) return 'sad'
  if (kf(['좋아', '행복', '신나', '축하', '기쁘', '즐거', '최고', '재밌', '웃기']).test(t)) return 'happy'
  return null
}
