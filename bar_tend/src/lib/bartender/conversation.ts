import { findCocktailByName, cocktails } from '../cocktails/database.js'
import { pickDialogue } from '../dialogue/dialogue-loader.js'
import { kf } from '../dialogue/pattern-utils.js'
import { formatStoryQueryReply } from '../dialogue/story-query.js'
import { INTENT_RESPONSE_TEMPLATES, COCKTAIL_FALLBACK_TEMPLATES, MOOD_SUB_TEMPLATES, MOOD_DEFAULT, MOOD_KEYWORD_MAP, TASTE_SUB_TEMPLATES, TASTE_DEFAULT, TASTE_KEYWORD_MAP, RUDE_SUB_TEMPLATES, RUDE_DEFAULT, RUDE_KEYWORD_MAP, STORY_FALLBACK, STORY_PERSON_MISSING_TEMPLATE, formatCocktailMentionResponse } from '../dialogue/response-templates.js'
import type { CocktailData, Message, BartenderResponse } from '../../types.js'

const SHAKE_REFERENCE = /젓지\s*말고\s*흔들|젓지말고\s*흔들|본드식|007처럼|shaken\s*,?\s*not\s*stirred|shaken\s+not\s+stirred/i

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
      if (STORY_FALLBACK.dialogueCategory) {
        const picked = pickDialogue(STORY_FALLBACK.dialogueCategory)
        if (picked) return { response: picked.text, expression: picked.expression }
      }
      return { response: STORY_FALLBACK.fallback, expression: STORY_FALLBACK.expression }
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
      if (STORY_FALLBACK.dialogueCategory) {
        const picked = pickDialogue(STORY_FALLBACK.dialogueCategory)
        if (picked) return { response: picked.text, expression: picked.expression }
      }
      return { response: STORY_FALLBACK.fallback, expression: STORY_FALLBACK.expression }
    }

    case 'mood-talk': {
      const mood = detectUserMood(input)
      const mt = mood ? MOOD_SUB_TEMPLATES[mood] : undefined
      if (mt && mt.dialogueCategory) {
        const picked = pickDialogue(mt.dialogueCategory)
        if (picked) return { response: picked.text, expression: picked.expression }
      }
      if (mt) return { response: mt.fallback, expression: mt.expression }
      return { response: MOOD_DEFAULT.fallback, expression: MOOD_DEFAULT.expression }
    }

    case 'taste-query': {
      const tasteKey = (Object.entries(TASTE_KEYWORD_MAP) as [string, string[]][]).find(
        ([, keywords]) => kf(keywords).test(input),
      )?.[0]
      const tt = tasteKey ? TASTE_SUB_TEMPLATES[tasteKey] : undefined
      if (tt && tt.dialogueCategory) {
        const picked = pickDialogue(tt.dialogueCategory)
        if (picked) return { response: picked.text, expression: picked.expression }
      }
      if (tt) return { response: tt.fallback, expression: tt.expression }
      return { response: TASTE_DEFAULT.fallback, expression: TASTE_DEFAULT.expression }
    }

    case 'rude-talk': {
      const rudeKey = (Object.entries(RUDE_KEYWORD_MAP) as [string, string[]][]).find(
        ([, keywords]) => kf(keywords).test(input),
      )?.[0]
      const rt = rudeKey ? RUDE_SUB_TEMPLATES[rudeKey] : undefined
      if (rt && rt.dialogueCategory) {
        const picked = pickDialogue(rt.dialogueCategory)
        if (picked) return { response: picked.text, expression: picked.expression }
      }
      if (rt) return { response: rt.fallback, expression: rt.expression }
      if (RUDE_DEFAULT.dialogueCategory) {
        const picked = pickDialogue(RUDE_DEFAULT.dialogueCategory)
        if (picked) return { response: picked.text, expression: picked.expression }
      }
      return { response: RUDE_DEFAULT.fallback, expression: RUDE_DEFAULT.expression }
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
