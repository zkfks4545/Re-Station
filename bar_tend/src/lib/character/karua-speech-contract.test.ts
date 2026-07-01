import { describe, it, expect } from 'vitest'
import dialoguesData from '../../data/dialogues.json'
import keywordRulesData from '../../data/keyword-rules.json'
import {
  INTENT_RESPONSE_TEMPLATES,
  COCKTAIL_FALLBACK_TEMPLATES,
  MOOD_SUB_TEMPLATES,
  MOOD_DEFAULT,
  TASTE_SUB_TEMPLATES,
  TASTE_DEFAULT,
  RUDE_SUB_TEMPLATES,
  RUDE_DEFAULT,
  STORY_FALLBACK,
  formatCocktailMentionDraft,
  formatCocktailInfoDraft,
  formatShakeOrderDraft,
  formatMartiniLoreFollowupDraft,
} from '../dialogue/response-templates.js'
import { STORY_PERSON_MISSING_TEMPLATE } from '../dialogue/response-templates.js'
import type { CocktailData } from '../../types.js'
import {
  formatWelcomeDrinkReply,
  formatWelcomeDrinkFeedbackReply,
  WELCOME_DRINK_FEEDBACK_QUESTION,
} from '../recommendation/welcome-drink.js'
import {
  formatFarewellConversationReply,
  formatXyzReply,
  formatWelcomeFarewellXyzReply,
  formatStandardFarewellEntryReply,
  formatFarewellBlockReply,
  formatReturnHomeReply,
  formatWelcomeXyzClarificationReply,
} from '../session/farewell-replies.js'
import { formatStoryQueryReply } from '../dialogue/story-query.js'
import {
  formatExplicitCocktailReply,
  formatLoreBasedOrderReply,
  formatSecretMenuOrderReply,
  formatRandomRecommendationReply,
  formatRecommendationReply,
  RECOMMENDATION_OPENING_LINES,
} from '../recommendation/response.js'
import { createRecommendationDecision, createRecommendationState } from '../recommendation/state.js'

const FORBIDDEN_PHRASES: { pattern: RegExp; reason: string }[] = [
  { pattern: /힘드셨겠어요/, reason: '직접 위로 금지' },
  { pattern: /힘내세요/, reason: '직접 응원·격려 금지' },
  { pattern: /괜찮아질 거예요/, reason: '희망 고정·직접 위로 금지' },
  { pattern: /괜찮으시면 천천히 말씀해 주세요/, reason: '상담가식 문장 금지' },
  { pattern: /제가 도와드릴게요/, reason: '해결사형 조력 약속 금지' },
  { pattern: /해결해 드릴게요/, reason: '해결책 제시 금지' },
  { pattern: /해결해드릴게요/, reason: '해결책 제시 금지' },
  { pattern: /좋은 결과가 있을 거예요/, reason: '희망 고정·감동 조언 금지' },
  { pattern: /마음이 나아질/, reason: '감정 개선 약속·직접 위로 금지' },
  { pattern: /기분이 좋아질/, reason: '감정 개선 약속 금지' },
  { pattern: /술\s*마시면\s*괜찮아/, reason: '술을 감정 해결책으로 제시 금지' },
  { pattern: /한 잔\s*하면\s*괜찮/, reason: '술을 감정 해결책으로 제시 금지' },
  { pattern: /제가 해결해/, reason: '해결사형 발언 금지' },
]

function checkText(text: string): { matched: boolean; reason: string; phrase: string } | null {
  for (const { pattern, reason } of FORBIDDEN_PHRASES) {
    if (pattern.test(text)) {
      return { matched: true, reason, phrase: pattern.source }
    }
  }
  return null
}

function checkTexts(label: string, texts: string[]): void {
  const violations: { text: string; reason: string; phrase: string }[] = []
  for (const text of texts) {
    const result = checkText(text)
    if (result) {
      violations.push({ text, reason: result.reason, phrase: result.phrase })
    }
  }
  expect(violations, `${label}: ${violations.map(v => `\n  [${v.reason}] "${v.text}"`).join('')}`).toHaveLength(0)
}

function collectFallbackTexts(): string[] {
  const texts: string[] = []
  const groups = [
    INTENT_RESPONSE_TEMPLATES,
    COCKTAIL_FALLBACK_TEMPLATES,
    MOOD_SUB_TEMPLATES,
    TASTE_SUB_TEMPLATES,
    RUDE_SUB_TEMPLATES,
    { story: STORY_FALLBACK },
  ]
  for (const group of groups) {
    for (const tmpl of Object.values(group)) {
      if (tmpl.fallback) texts.push(tmpl.fallback)
    }
  }
  if (MOOD_DEFAULT.fallback) texts.push(MOOD_DEFAULT.fallback)
  if (TASTE_DEFAULT.fallback) texts.push(TASTE_DEFAULT.fallback)
  if (RUDE_DEFAULT.fallback) texts.push(RUDE_DEFAULT.fallback)
  return texts
}

function collectTemplateDraftTexts(): string[] {
  const mockCocktail = {
    id: 'test',
    name: '모히토',
    name_ko: '모히토',
    story: '민트와 라임의 조화',
    vibe: '상쾌한 느낌',
    description: '민트와 라임의 상쾌한 칵테일',
  } as CocktailData

  return [
    formatCocktailMentionDraft(mockCocktail).text,
    formatCocktailInfoDraft(mockCocktail).text,
    formatShakeOrderDraft(mockCocktail).text,
    formatMartiniLoreFollowupDraft().text,
    STORY_PERSON_MISSING_TEMPLATE('헤밍웨이').text,
  ]
}

function collectPresetKaruaTexts(): string[] {
  const karuaPresets = [
    {
      reaction: [
        '그럼 너무 무거운 건 말고요.',
        '오늘은 좀 가볍게 가죠.',
        '연료 부족 경고등이 켜진 것 같은데요.',
        '피곤할 땐 취하는 것보다 쉬는 게 먼저긴 한데...',
        '그래도 빈손으로 보내긴 아쉽고요.',
      ],
      recommend: [
        '{cocktail_name} 괜찮겠네요.',
        '{cocktail_name} 쪽으로 드릴까요?',
        '오늘은 {cocktail_name_subject} 어울릴 것 같아요.',
      ],
      explanation: ['{taste_desc}', '{reason_desc}', '{effect_desc}', '{closing_desc}'],
    },
    {
      reaction: [
        '그럼 지금 흐름에 맞춰볼게요.',
        '좋아요, 조건은 대충 잡혔어요.',
        '이쪽이면 크게 빗나가진 않을 것 같네요.',
      ],
      recommend: [
        '{cocktail_name} 괜찮겠네요.',
        '{cocktail_name} 쪽으로 가볼게요.',
        '오늘은 {cocktail_name_subject} 어울릴 것 같아요.',
      ],
      explanation: ['{taste_desc}', '{reason_desc}', '{effect_desc}', '{closing_desc}'],
    },
  ]

  const texts: string[] = []
  for (const preset of karuaPresets) {
    for (const block of ['reaction', 'recommend', 'explanation'] as const) {
      for (const line of preset[block]) {
        const resolved = line.replace(/\{[a-zA-Z0-9_]+\}/g, '모히토')
        texts.push(resolved)
      }
    }
  }
  return texts
}

function collectFarewellTexts(): string[] {
  const mockCocktail = { id: 'x', name: '마티니', name_ko: '마티니' } as CocktailData
  return [
    formatWelcomeXyzClarificationReply().text,
    formatFarewellConversationReply('', { hasXyz: false }).text,
    formatFarewellConversationReply('', { hasXyz: true }).text,
    formatFarewellConversationReply('나가라는 뜻이야?', { hasXyz: true }).text,
    formatXyzReply(mockCocktail),
    formatWelcomeFarewellXyzReply(mockCocktail),
    formatStandardFarewellEntryReply(),
    formatFarewellBlockReply(),
    formatReturnHomeReply(),
  ]
}

function collectWelcomeDrinkTexts(): string[] {
  const texts: string[] = []
  const mockCocktail = { id: 'x', name: '진토닉', name_ko: '진토닉' } as CocktailData

  const replyHigh = formatWelcomeDrinkReply(mockCocktail, { alcoholStarTotal: 15 })
  texts.push(replyHigh)
  const replyMid = formatWelcomeDrinkReply(mockCocktail, { alcoholStarTotal: 5 })
  texts.push(replyMid)
  const replyFirst = formatWelcomeDrinkReply(mockCocktail, { alcoholStarTotal: 0 })
  texts.push(replyFirst)

  texts.push(formatWelcomeDrinkFeedbackReply('좋았어요').text)
  texts.push(formatWelcomeDrinkFeedbackReply('가볍게').text)
  texts.push(formatWelcomeDrinkFeedbackReply('달게').text)
  texts.push(formatWelcomeDrinkFeedbackReply('다른 느낌').text)
  texts.push(formatWelcomeDrinkFeedbackReply('').text)

  texts.push(WELCOME_DRINK_FEEDBACK_QUESTION.prompt)
  if (WELCOME_DRINK_FEEDBACK_QUESTION.dialogueFlow?.leadIn) {
    texts.push(WELCOME_DRINK_FEEDBACK_QUESTION.dialogueFlow.leadIn)
  }
  if (WELCOME_DRINK_FEEDBACK_QUESTION.dialogueFlow?.continuation) {
    texts.push(WELCOME_DRINK_FEEDBACK_QUESTION.dialogueFlow.continuation)
  }
  for (const choice of WELCOME_DRINK_FEEDBACK_QUESTION.choices) {
    if (choice.acknowledgement) texts.push(choice.acknowledgement)
  }

  return texts
}

function collectStoryQueryTexts(): string[] {
  const mockCocktail = {
    id: 'mojito',
    name: '모히토',
    talkingPoints: ['모히토는 쿠바에서 탄생한 칵테일입니다.'],
    description: '민트와 라임의 상쾌한 칵테일',
    recipeText: '럼 40ml, 라임즙 20ml, 민트 잎',
    features: { sweetness: 0.3, sourness: 0.6, alcohol_strength: 0.4, fizz: 0.7 },
  } as unknown as CocktailData

  const texts: string[] = []

  const reply1 = formatStoryQueryReply(null)
  texts.push(reply1.text)

  const reply2 = formatStoryQueryReply(mockCocktail)
  texts.push(reply2.text)

  const reply3 = formatStoryQueryReply(mockCocktail, ['story:0'])
  texts.push(reply3.text)

  const reply4 = formatStoryQueryReply(mockCocktail, ['story:0', 'description', 'recipe', 'tasting', 'trivia:0'])
  texts.push(reply4.text)

  return texts
}

function collectRecommendationTexts(): string[] {
  const texts: string[] = []

  for (const line of RECOMMENDATION_OPENING_LINES) {
    texts.push(line.text)
  }

  const mockCocktail = {
    id: 'gt',
    name: '진토닉',
    talkingPoints: ['진토닉은 영국 해군에서 시작된 칵테일입니다.'],
  } as CocktailData

  texts.push(formatExplicitCocktailReply(mockCocktail))
  texts.push(formatLoreBasedOrderReply(mockCocktail))
  texts.push(formatSecretMenuOrderReply(mockCocktail))
  texts.push(formatRandomRecommendationReply(mockCocktail))

  const mockDecision = createRecommendationDecision(mockCocktail, createRecommendationState())
  texts.push(formatRecommendationReply(mockDecision))

  return texts
}

describe('karua speech contract — dialogues.json', () => {
  const categories = (dialoguesData as unknown as { categories: Record<string, { lines: { text: string }[] }> }).categories
  const texts: string[] = []
  const sourceMap: { text: string; category: string }[] = []

  for (const [category, data] of Object.entries(categories)) {
    for (const line of data.lines) {
      texts.push(line.text)
      sourceMap.push({ text: line.text, category })
    }
  }

  it('has no forbidden phrases', () => {
    const violations: { text: string; reason: string; category: string }[] = []
    for (const { text, category } of sourceMap) {
      const result = checkText(text)
      if (result) {
        violations.push({ text, reason: result.reason, category })
      }
    }
    expect(violations, `dialogues.json violations:\n${violations.map(v => `  [${v.category}] ${v.reason}: "${v.text}"`).join('\n')}`).toHaveLength(0)
  })
})

describe('karua speech contract — keyword-rules.json', () => {
  it('has no forbidden phrases in response fields', () => {
    const violations: { response: string; reason: string }[] = []
    for (const rule of keywordRulesData as { patterns: string[]; response: string }[]) {
      const result = checkText(rule.response)
      if (result) {
        violations.push({ response: rule.response, reason: result.reason })
      }
    }
    expect(violations, `keyword-rules.json violations:\n${violations.map(v => `  ${v.reason}: "${v.response}"`).join('\n')}`).toHaveLength(0)
  })
})

describe('karua speech contract — response-templates.ts', () => {
  it('has no forbidden phrases in fallback texts', () => {
    const texts = collectFallbackTexts()
    checkTexts('response-templates fallbacks', texts)
  })

  it('has no forbidden phrases in draft formatters', () => {
    const texts = collectTemplateDraftTexts()
    checkTexts('response-templates drafts', texts)
  })
})

describe('karua speech contract — text-presets.ts (karua blocks only)', () => {
  it('has no forbidden phrases in karua preset blocks', () => {
    const texts = collectPresetKaruaTexts()
    checkTexts('text-presets karua blocks', texts)
  })
})

describe('karua speech contract — farewell-replies.ts', () => {
  it('has no forbidden phrases', () => {
    const texts = collectFarewellTexts()
    checkTexts('farewell-replies', texts)
  })
})

describe('karua speech contract — welcome-drink.ts', () => {
  it('has no forbidden phrases', () => {
    const texts = collectWelcomeDrinkTexts()
    checkTexts('welcome-drink', texts)
  })
})

describe('karua speech contract — story-query.ts', () => {
  it('has no forbidden phrases', () => {
    const texts = collectStoryQueryTexts()
    checkTexts('story-query', texts)
  })
})

describe('karua speech contract — recommendation response.ts', () => {
  it('has no forbidden phrases in opening lines', () => {
    checkTexts('recommendation opening lines', RECOMMENDATION_OPENING_LINES.map(l => l.text))
  })

  it('has no forbidden phrases in reply formatters', () => {
    const texts = collectRecommendationTexts()
    checkTexts('recommendation reply formatters', texts)
  })
})
