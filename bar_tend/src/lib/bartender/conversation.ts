import { findCocktailByName, cocktails } from '../cocktails/database.js'
import { pickDialogue } from '../dialogue/dialogue-loader.js'
import { kf, SHAKE_REFERENCE } from '../dialogue/pattern-utils.js'
import { assembleResponse } from '../dialogue/response-pipeline.js'
import { formatStoryQueryReply } from '../dialogue/story-query.js'
import { INTENT_RESPONSE_TEMPLATES, COCKTAIL_FALLBACK_TEMPLATES, MOOD_SUB_TEMPLATES, MOOD_DEFAULT, MOOD_KEYWORD_MAP, TASTE_SUB_TEMPLATES, TASTE_DEFAULT, TASTE_KEYWORD_MAP, RUDE_SUB_TEMPLATES, RUDE_DEFAULT, RUDE_KEYWORD_MAP, STORY_FALLBACK, STORY_PERSON_MISSING_TEMPLATE, formatCocktailInfoDraft, formatCocktailMentionDraft, formatMartiniLoreFollowupDraft, formatShakeOrderDraft, type IntentResponseTemplate } from '../dialogue/response-templates.js'
import type { CocktailData, Message, BartenderResponse } from '../../types.js'

function pickStoryFallback(): BartenderResponse {
  if (STORY_FALLBACK.dialogueCategory) {
    const picked = pickDialogue(STORY_FALLBACK.dialogueCategory)
    if (picked) return assembleResponse({ text: picked.text, preferredExpression: picked.expression })
  }
  return assembleResponse({ text: STORY_FALLBACK.fallback, tone: STORY_FALLBACK.tone })
}

function resolveFromSubTemplate(
  tmpl: IntentResponseTemplate | undefined,
  defaultTmpl: IntentResponseTemplate,
  extraDefaultCheck?: () => BartenderResponse | undefined,
): BartenderResponse {
  if (tmpl && tmpl.dialogueCategory) {
    const picked = pickDialogue(tmpl.dialogueCategory)
    if (picked) return assembleResponse({ text: picked.text, preferredExpression: picked.expression })
  }
  if (tmpl) return assembleResponse({ text: tmpl.fallback, tone: tmpl.tone })
  if (extraDefaultCheck) {
    const result = extraDefaultCheck()
    if (result) return result
  }
  return assembleResponse({ text: defaultTmpl.fallback, tone: defaultTmpl.tone })
}

export function generateResponse(
  input: string,
  _history: Message[],
  intent: string,
  referencedCocktail?: CocktailData | null,
): BartenderResponse {
  const currentCocktail = referencedCocktail ?? findCocktailByName(input)
  if (currentCocktail && intent === 'order-cocktail' && SHAKE_REFERENCE.test(input)) {
    return assembleResponse(formatShakeOrderDraft(currentCocktail))
  }
  if (currentCocktail && (intent === 'general-chat' || intent === 'order-cocktail' || intent === 'order-cocktail-mixed')) {
    return assembleResponse(formatCocktailMentionDraft(currentCocktail))
  }

  const tmpl = INTENT_RESPONSE_TEMPLATES[intent]
  if (tmpl) {
    if (tmpl.dialogueCategory) {
      const picked = pickDialogue(tmpl.dialogueCategory)
      if (picked) return assembleResponse({ text: picked.text, preferredExpression: picked.expression })
    }
    return assembleResponse({ text: tmpl.fallback, tone: tmpl.tone })
  }

  const cocktailFallback = COCKTAIL_FALLBACK_TEMPLATES[intent]
  if (cocktailFallback) {
    if (currentCocktail) {
      if (intent === 'cocktail-info-query') {
        return assembleResponse(formatCocktailInfoDraft(currentCocktail))
      }
      return assembleResponse(formatCocktailMentionDraft(currentCocktail))
    }
    if (cocktailFallback.dialogueCategory) {
      const picked = pickDialogue(cocktailFallback.dialogueCategory)
      if (picked) return assembleResponse({ text: picked.text, preferredExpression: picked.expression })
    }
    return assembleResponse({ text: cocktailFallback.fallback, tone: cocktailFallback.tone })
  }

  switch (intent) {
    case 'lore-followup': {
      if (referencedCocktail && isMartiniWith007Lore(referencedCocktail)) {
        return assembleResponse(formatMartiniLoreFollowupDraft())
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
        return assembleResponse({ text: reply.text, preferredExpression: reply.expression })
      }
      const personMatch = input.match(/([가-힣]{2,})[이가]\s*(?:마시|좋아하)/)
      if (personMatch) {
        const person = personMatch[1]
        const found = cocktails.find(c =>
          c.talkingPoints?.some(p => p.includes(person))
        )
        if (found) {
          const reply = formatStoryQueryReply(found)
          return assembleResponse({ text: reply.text, preferredExpression: reply.expression })
        }
        return assembleResponse(STORY_PERSON_MISSING_TEMPLATE(person))
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
          if (picked) return assembleResponse({ text: picked.text, preferredExpression: picked.expression })
        }
      })
    }

  }

  const gc = INTENT_RESPONSE_TEMPLATES['general-chat']
  return assembleResponse({ text: gc.fallback, tone: gc.tone })
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
