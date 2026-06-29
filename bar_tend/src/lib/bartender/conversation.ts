import { findCocktailByName, cocktails } from '../cocktails/database.js'
import { pickDialogue } from '../dialogue/dialogue-loader.js'
import { kf, SHAKE_REFERENCE } from '../dialogue/pattern-utils.js'
import { formatStoryQueryReply } from '../dialogue/story-query.js'
import { INTENT_RESPONSE_TEMPLATES, COCKTAIL_FALLBACK_TEMPLATES, MOOD_SUB_TEMPLATES, MOOD_DEFAULT, MOOD_KEYWORD_MAP, TASTE_SUB_TEMPLATES, TASTE_DEFAULT, TASTE_KEYWORD_MAP, RUDE_SUB_TEMPLATES, RUDE_DEFAULT, RUDE_KEYWORD_MAP, STORY_FALLBACK, STORY_PERSON_MISSING_TEMPLATE, formatCocktailMentionResponse, type IntentResponseTemplate } from '../dialogue/response-templates.js'
import type { CocktailData, Message, BartenderResponse } from '../../types.js'

function pickStoryFallback(): BartenderResponse {
  if (STORY_FALLBACK.dialogueCategory) {
    const picked = pickDialogue(STORY_FALLBACK.dialogueCategory)
    if (picked) return { response: picked.text, expression: picked.expression }
  }
  return { response: STORY_FALLBACK.fallback, expression: STORY_FALLBACK.expression }
}

function resolveFromSubTemplate(
  tmpl: IntentResponseTemplate | undefined,
  defaultTmpl: IntentResponseTemplate,
  extraDefaultCheck?: () => BartenderResponse | undefined,
): BartenderResponse {
  if (tmpl && tmpl.dialogueCategory) {
    const picked = pickDialogue(tmpl.dialogueCategory)
    if (picked) return { response: picked.text, expression: picked.expression }
  }
  if (tmpl) return { response: tmpl.fallback, expression: tmpl.expression }
  if (extraDefaultCheck) {
    const result = extraDefaultCheck()
    if (result) return result
  }
  return { response: defaultTmpl.fallback, expression: defaultTmpl.expression }
}

export function generateResponse(
  input: string,
  _history: Message[],
  intent: string,
  referencedCocktail?: CocktailData | null,
): BartenderResponse {
  const currentCocktail = referencedCocktail ?? findCocktailByName(input)
  if (currentCocktail && intent === 'order-cocktail' && SHAKE_REFERENCE.test(input)) {
    return {
      response: `${currentCocktail.name} 한 잔, 본드식으로요. 젓지 말고 흔들어서 준비할게요.`,
      expression: 'smirk',
    }
  }
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
    case 'lore-followup': {
      if (referencedCocktail && isMartiniWith007Lore(referencedCocktail)) {
        return {
          response: '그쪽으로 가면 본드식 주문이죠. 마티니는 보통 젓는 쪽이 정석에 가깝지만, 007 덕분에 \'흔들어서\'라는 말이 거의 주문 대사처럼 남았어요.',
          expression: 'smirk',
        }
      }
      return pickStoryFallback()
    }

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
        return STORY_PERSON_MISSING_TEMPLATE(person)
      }
      return pickStoryFallback()
    }

    case 'mood-talk': {
      const mood = detectUserMood(input)
      return resolveFromSubTemplate(mood ? MOOD_SUB_TEMPLATES[mood] : undefined, MOOD_DEFAULT)
    }

    case 'taste-query': {
      const tasteKey = (Object.entries(TASTE_KEYWORD_MAP) as [string, string[]][]).find(
        ([, keywords]) => kf(keywords).test(input),
      )?.[0]
      return resolveFromSubTemplate(tasteKey ? TASTE_SUB_TEMPLATES[tasteKey] : undefined, TASTE_DEFAULT)
    }

    case 'rude-talk': {
      const rudeKey = (Object.entries(RUDE_KEYWORD_MAP) as [string, string[]][]).find(
        ([, keywords]) => kf(keywords).test(input),
      )?.[0]
      return resolveFromSubTemplate(rudeKey ? RUDE_SUB_TEMPLATES[rudeKey] : undefined, RUDE_DEFAULT, () => {
        if (RUDE_DEFAULT.dialogueCategory) {
          const picked = pickDialogue(RUDE_DEFAULT.dialogueCategory)
          if (picked) return { response: picked.text, expression: picked.expression }
        }
      })
    }

  }

  const gc = INTENT_RESPONSE_TEMPLATES['general-chat']
  return { response: gc.fallback, expression: gc.expression }
}

function isMartiniWith007Lore(cocktail: CocktailData): boolean {
  const isMartini = cocktail.name === '마티니' || cocktail.nameEn === 'Martini'
  if (!isMartini) return false
  const has007Lore = cocktail.talkingPoints?.some(p => /007|제임스 본드|James Bond/i.test(p))
    ?? false
  const hasLoreKeyword = cocktail.lore?.keywords?.some(k => /007|제임스 본드|James Bond/i.test(k))
    ?? false
  return has007Lore || hasLoreKeyword
}

function detectUserMood(input: string): 'tired' | 'sad' | 'happy' | null {
  const t = input.toLowerCase()
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORD_MAP)) {
    if (kf(keywords).test(t)) return mood as 'tired' | 'sad' | 'happy'
  }
  return null
}
