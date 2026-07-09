import type { CocktailData } from '../../types.js'
import type { ResponseDraft, ResponseTone } from './response-pipeline.js'

export interface IntentResponseTemplate {
  dialogueCategory?: string
  fallback: string
  tone: ResponseTone
}

export type TemplateFallbackSource = 'dialogue-source-fallback' | 'response-template'
export type TemplateDraftSource = 'response-template' | 'cocktail-data-and-template'

export const RESPONSE_TEMPLATE_DRAFT_SOURCES = Object.freeze({
  storyPersonMissing: 'response-template',
  cocktailMention: 'cocktail-data-and-template',
  cocktailInfo: 'cocktail-data-and-template',
  shakeOrder: 'cocktail-data-and-template',
  martiniLoreFollowup: 'response-template',
} satisfies Record<string, TemplateDraftSource>)

export function getTemplateFallbackSource(template: IntentResponseTemplate): TemplateFallbackSource {
  return template.dialogueCategory ? 'dialogue-source-fallback' : 'response-template'
}

export const INTENT_RESPONSE_TEMPLATES: Record<string, IntentResponseTemplate> = {
  'exit-intent': {
    fallback: '들러주셔서 감사합니다. 조심히 가세요.',
    tone: 'idle',
  },
  'bar-setting': {
    dialogueCategory: 'bar-intro',
    fallback: '여기는 Re:Station이에요.',
    tone: 'talk',
  },
  'character-query': {
    dialogueCategory: 'character-query',
    fallback: '저는 이 곳 Re:Station의 바텐더예요. 말 걸어주셔서 감사해요.',
    tone: 'talk',
  },
  'siesta-setting': {
    dialogueCategory: 'siesta-mention',
    fallback: '시에스타 사장님은 뒤쪽에 계세요.',
    tone: 'smirk',
  },
  'bar-atmosphere': {
    dialogueCategory: 'bar-atmosphere',
    fallback: '분위기를 먼저 보셨네요.',
    tone: 'smirk',
  },
  'weather-talk': {
    dialogueCategory: 'small-talk-weather',
    fallback: '밖 날씨가 잔 고르기 좋은 핑계가 되겠네요.',
    tone: 'talk',
  },
  'uncertain-talk': {
    dialogueCategory: 'guest-uncertain',
    fallback: '정해진 게 없으면 싫은 것부터 빼보죠.',
    tone: 'thinking',
  },
  'quiet-talk': {
    dialogueCategory: 'quiet-moment',
    fallback: '오늘은 조용한 쪽으로 가죠.',
    tone: 'talk',
  },
  'water-request': {
    dialogueCategory: 'water-request',
    fallback: '물 먼저 드릴게요.',
    tone: 'talk',
  },
  'overdrunk': {
    dialogueCategory: 'overdrunk',
    fallback: '그럼 여기서는 더 권하지 않을게요.',
    tone: 'sympathy',
  },
  'ingredient-constraint': {
    dialogueCategory: 'ingredient-constraint',
    fallback: '그 재료는 피해서 볼게요.',
    tone: 'thinking',
  },
  'real-world-info': {
    dialogueCategory: 'real-world-info',
    fallback: '여긴 가상의 바예요.',
    tone: 'talk',
  },
  'recipe-query': {
    dialogueCategory: 'recipe-request',
    fallback: '레시피를 알려드릴게요.',
    tone: 'talk',
  },
  'random-request': {
    dialogueCategory: 'random-request',
    fallback: '아무거나 골라드릴게요.',
    tone: 'smirk',
  },
  'unknown-cocktail-request': {
    dialogueCategory: 'unknown-cocktail-request',
    fallback: '죄송해요, 그 칵테일은 저희 메뉴에 없네요.',
    tone: 'talk',
  },
  'recommendation-cancel': {
    dialogueCategory: 'recommendation-cancel',
    fallback: '추천은 여기까지 할게요.',
    tone: 'talk',
  },
  'general-chat': {
    dialogueCategory: 'general-chat',
    fallback: '편하게 말씀해 주세요.',
    tone: 'talk',
  },
}

export const COCKTAIL_FALLBACK_TEMPLATES: Record<string, IntentResponseTemplate> = {
  'cocktail-query': {
    dialogueCategory: 'cocktail-request',
    fallback: '칵테일을 추천해 드릴게요.',
    tone: 'thinking',
  },
  'recommendation-query': {
    dialogueCategory: 'cocktail-request',
    fallback: '칵테일을 추천해 드릴게요.',
    tone: 'thinking',
  },
  'cocktail-info-query': {
    dialogueCategory: 'cocktail-request',
    fallback: '자세한 정보를 알려드릴게요.',
    tone: 'talk',
  },
}

export const MOOD_SUB_TEMPLATES: Record<string, IntentResponseTemplate> = {
  tired: {
    dialogueCategory: 'mood-tired',
    fallback: '오늘은 좀 가볍게 가죠.',
    tone: 'sympathy',
  },
  sad: {
    dialogueCategory: 'mood-sad',
    fallback: '그런 날이 있죠. 무거운 얘기는 천천히.',
    tone: 'sympathy',
  },
  happy: {
    dialogueCategory: 'mood-happy',
    fallback: '좋은 일이 있으셨군요.',
    tone: 'smirk',
  },
}

export const MOOD_DEFAULT: IntentResponseTemplate = {
  fallback: '지금 기분에 맞는 한 잔을 찾으시면 말씀해 주세요.',
  tone: 'talk',
}

export const MOOD_KEYWORD_MAP: Record<string, string[]> = {
  tired: ['피곤', '지쳤', '지침', '퇴근', '졸려', '녹초'],
  sad: ['힘들', '우울', '슬퍼', '외롭', '스트레스', '괴롭', '속상', '답답'],
  happy: ['좋아', '행복', '신나', '축하', '기쁘', '즐거', '최고', '재밌', '웃기'],
}

export const TASTE_SUB_TEMPLATES: Record<string, IntentResponseTemplate> = {
  sweet: {
    dialogueCategory: 'taste-sweet',
    fallback: '달콤한 쪽으로 찾아볼게요.',
    tone: 'talk',
  },
  bitter: {
    dialogueCategory: 'taste-bitter',
    fallback: '쌉쌀한 쪽으로 찾아볼게요.',
    tone: 'smirk',
  },
  refresh: {
    dialogueCategory: 'taste-refresh',
    fallback: '청량한 쪽으로 찾아볼게요.',
    tone: 'talk',
  },
}

export const TASTE_DEFAULT: IntentResponseTemplate = {
  fallback: '어떤 맛을 좋아하시는지 말씀해 주세요.',
  tone: 'talk',
}

export const TASTE_KEYWORD_MAP: Record<string, string[]> = {
  sweet: ['달콤', '달아', '시럽', '달게', '단'],
  bitter: ['씁쓸', '쓰다', '비터', '쓴맛'],
  refresh: ['상쾌', '시원', '청량', 'fresh', '탄산', '순하', '강하', '진하'],
}

export const RUDE_SUB_TEMPLATES: Record<string, IntentResponseTemplate> = {
  annoyed: {
    dialogueCategory: 'rude-annoyed',
    fallback: '그런 말씀은 듣기 좋지 않네요.',
    tone: 'annoyed',
  },
  boundary: {
    dialogueCategory: 'rude-boundary',
    fallback: '여기는 편하게 대화하는 곳이에요.',
    tone: 'stern',
  },
}

export const RUDE_DEFAULT: IntentResponseTemplate = {
  dialogueCategory: 'rude-disappointed',
  fallback: '그렇게 생각하시는군요. 조금 아쉽네요.',
  tone: 'disappointed',
}

export const RUDE_KEYWORD_MAP: Record<string, string[]> = {
  annoyed: ['시끄러', '닥쳐', '꺼져', '짜증나', '열받아', '화나'],
  boundary: ['당장', '빨리 해', '가져와', '내놔', '말 들어', '듣거라', '니가 뭔데'],
}

export const STORY_FALLBACK: IntentResponseTemplate = {
  dialogueCategory: 'story-unresolved',
  fallback: '어느 칵테일 이야기인지 이름을 말씀해 주세요.',
  tone: 'thinking',
}

export const STORY_PERSON_MISSING_TEMPLATE = (person: string): ResponseDraft => ({
  text: `${person}에 대한 이야기는 아직 모아지지 않았네요. 다른 이야기를 들려드릴까요?`,
  tone: 'talk',
})

export function formatCocktailMentionDraft(cocktail: CocktailData): ResponseDraft {
  const templates: ResponseDraft[] = [
    { text: `${cocktail.name}을 찾으시는군요. ${cocktail.story}`, tone: 'talk' },
    { text: `${cocktail.name} 말씀이시군요. 주문하시거나 자세한 정보를 보실 수 있어요.`, tone: 'smirk' },
    { text: `${cocktail.name}은 좋은 선택이에요. ${cocktail.vibe}`, tone: 'smirk' },
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

export function formatCocktailInfoDraft(cocktail: CocktailData): ResponseDraft {
  return { text: `${cocktail.name}은 ${cocktail.description}`, tone: 'talk' }
}

export function formatShakeOrderDraft(cocktail: CocktailData): ResponseDraft {
  return {
    text: `${cocktail.name} 한 잔, 본드식으로요. 젓지 말고 흔들어서 준비할게요.`,
    tone: 'smirk',
  }
}

export function formatMartiniLoreFollowupDraft(): ResponseDraft {
  return {
    text: '그쪽으로 가면 본드식 주문이죠. 마티니는 보통 젓는 쪽이 정석에 가깝지만, 007 덕분에 \'흔들어서\'라는 말이 거의 주문 대사처럼 남았어요.',
    tone: 'smirk',
  }
}
