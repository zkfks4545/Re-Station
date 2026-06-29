import type { BartenderResponse, CocktailData, Expression } from '../../types.js'

export interface IntentResponseTemplate {
  dialogueCategory?: string
  fallback: string
  expression: Expression
}

export const INTENT_RESPONSE_TEMPLATES: Record<string, IntentResponseTemplate> = {
  'exit-intent': {
    fallback: '들러주셔서 감사합니다. 조심히 가세요.',
    expression: 'idle',
  },
  'bar-setting': {
    dialogueCategory: 'bar-intro',
    fallback: '여기는 Re:Station이에요.',
    expression: 'talk',
  },
  'character-query': {
    dialogueCategory: 'character-query',
    fallback: '저는 이 곳 Re:Station의 바텐더예요. 말 걸어주셔서 감사해요.',
    expression: 'talk',
  },
  'siesta-setting': {
    dialogueCategory: 'siesta-mention',
    fallback: '시에스타 사장님은 뒤쪽에 계세요.',
    expression: 'smirk',
  },
  'bar-atmosphere': {
    dialogueCategory: 'bar-atmosphere',
    fallback: '분위기를 먼저 보셨네요.',
    expression: 'smirk',
  },
  'weather-talk': {
    dialogueCategory: 'small-talk-weather',
    fallback: '밖 날씨가 잔 고르기 좋은 핑계가 되겠네요.',
    expression: 'talk',
  },
  'uncertain-talk': {
    dialogueCategory: 'guest-uncertain',
    fallback: '정해진 게 없으면 싫은 것부터 빼보죠.',
    expression: 'thinking',
  },
  'quiet-talk': {
    dialogueCategory: 'quiet-moment',
    fallback: '오늘은 조용한 쪽으로 가죠.',
    expression: 'talk',
  },
  'water-request': {
    dialogueCategory: 'water-request',
    fallback: '물 먼저 드릴게요.',
    expression: 'talk',
  },
  'overdrunk': {
    dialogueCategory: 'overdrunk',
    fallback: '그럼 여기서는 더 권하지 않을게요.',
    expression: 'sympathy',
  },
  'minor-no-alcohol': {
    dialogueCategory: 'minor-no-alcohol',
    fallback: '알코올은 안내하지 않을게요.',
    expression: 'talk',
  },
  'non-alcoholic': {
    dialogueCategory: 'non-alcoholic',
    fallback: '무알코올 쪽으로 볼게요.',
    expression: 'talk',
  },
  'ingredient-constraint': {
    dialogueCategory: 'ingredient-constraint',
    fallback: '그 재료는 피해서 볼게요.',
    expression: 'thinking',
  },
  'real-world-info': {
    dialogueCategory: 'real-world-info',
    fallback: '여긴 가상의 바예요.',
    expression: 'talk',
  },
  'recipe-query': {
    dialogueCategory: 'recipe-request',
    fallback: '레시피를 알려드릴게요.',
    expression: 'talk',
  },
  'random-request': {
    dialogueCategory: 'random-request',
    fallback: '아무거나 골라드릴게요.',
    expression: 'smirk',
  },
  'unknown-cocktail-request': {
    dialogueCategory: 'unknown-cocktail-request',
    fallback: '죄송해요, 그 칵테일은 저희 메뉴에 없네요.',
    expression: 'talk',
  },
  'recommendation-cancel': {
    dialogueCategory: 'recommendation-cancel',
    fallback: '추천은 여기까지 할게요.',
    expression: 'talk',
  },
  'general-chat': {
    dialogueCategory: 'general-chat',
    fallback: '편하게 말씀해 주세요.',
    expression: 'talk',
  },
}

export const COCKTAIL_FALLBACK_TEMPLATES: Record<string, IntentResponseTemplate> = {
  'cocktail-query': {
    dialogueCategory: 'cocktail-request',
    fallback: '칵테일을 추천해 드릴게요.',
    expression: 'thinking',
  },
  'recommendation-query': {
    dialogueCategory: 'cocktail-request',
    fallback: '칵테일을 추천해 드릴게요.',
    expression: 'thinking',
  },
  'cocktail-info-query': {
    dialogueCategory: 'cocktail-request',
    fallback: '자세한 정보를 알려드릴게요.',
    expression: 'talk',
  },
}

export function formatCocktailMentionResponse(cocktail: CocktailData): BartenderResponse {
  const templates: BartenderResponse[] = [
    { response: `${cocktail.name}을 찾으시는군요. ${cocktail.story}`, expression: 'talk' },
    { response: `${cocktail.name} 말씀이시군요. 주문하시거나 자세한 정보를 보실 수 있어요.`, expression: 'smirk' },
    { response: `${cocktail.name}은 좋은 선택이에요. ${cocktail.vibe}`, expression: 'smirk' },
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}
