import { type CocktailData } from '../../types.js'
import { routeUserInput, type InputRoute, type RouteResult } from '../dialogue/input-router.js'
import { kf } from '../dialogue/pattern-utils.js'

import { keywordRules } from './keywords.js'

export type IntentType =
  | 'general-chat'
  | 'cocktail-query'
  | 'story-query'
  | 'lore-query'
  | 'cocktail-info-query'
  | 'character-query'
  | 'story-query-followup'
  | 'story-query-cocktail-specific'
  | 'lore-followup'
  | 'welcome-drink'
  | 'welcome-drink-feedback'
  | 'recognition'
  | 'mood-talk'
  | 'quiet-talk'
  | 'bar-setting'
  | 'siesta-setting'
  | 'bar-atmosphere'
  | 'weather-talk'
  | 'uncertain-talk'
  | 'water-request'
  | 'overdrunk'
  | 'ingredient-constraint'
  | 'real-world-info'
  | 'rude-talk'
  | 'recipe-query'
  | 'recommendation-query'
  | 'taste-query'
  | 'menu-request'
  | 'order-cocktail'
  | 'order-cocktail-mixed'
  | 'random-request'
  | 'unknown-cocktail-request'
  | 'recommendation-cancel'
  | 'exit-intent'
  | 'safety-alert'

export interface ExtractedEntities {
  cocktailName?: string
  cocktailId?: string
  mood?: 'tired' | 'sad' | 'happy' | null
  situation?: string
  taste?: {
    sweet?: boolean
    sour?: boolean
    bitter?: boolean
    spicy?: boolean
    alcoholic?: boolean
    carbonated?: boolean
  }
  baseSpirit?: string
  excludedIngredients?: string[]
  alcoholPreference?: 'low' | 'high'
  weather?: string
  time?: string
  reason?: string
}

export interface DialogueContext {
  lastServedCocktail?: CocktailData | null
  mentionedCocktails: CocktailData[]
  userMood?: 'tired' | 'sad' | 'happy' | null
  sessionPhase:
    | 'entry'
    | 'conversation'
    | 'recommending'
    | 'aftertalk'
    | 'xyz'
    | 'farewell'
    | 'safetyLocked'
    | 'returnHome'
  activeRecommendationSession?: boolean
  welcomeDrinkUsed?: boolean
  alcoholStarsTotal?: number
  lastTopic?: string
  totalUserMessages?: number
  conversationTurnCount?: number
  userName?: string
  exchangeCount?: number
  lastBartenderWasQuestion?: boolean
  allowRecommendationRoutes?: boolean
  lastDiscussedCocktailId?: string
  orderCandidateCocktailId?: string
}

export interface CocktailReference {
  name: string
  id: string
  type: 'direct' | 'pronoun' | 'context' | 'historical'
  confidence: number
}

export interface ClassifiedIntent {
  route: RouteResult
  intent: IntentType
  entities: ExtractedEntities
  confidence: number
  source: 'input-router' | 'conversation' | 'keyword-rules' | 'inference'
  metadata: {
    cocktailReferences: CocktailReference[]
    contextualEligibility: {
      allowsRecommendation?: boolean
      allowsStoryQuery?: boolean
      allowsGeneralChat?: boolean
    }
    contextualExclusions: {
      blockedRecommendation?: boolean
      blockedStoryQuery?: boolean
      fallbackToGeneral?: boolean
    }
    debugInfo?: {
      matchedKeywords?: string[]
      matchingPatterns?: string[]
      previousTurnContext?: string
      sessionHistoryContext?: {
        lastCocktail?: string
        lastMood?: string
        recentTopics?: string[]
      }
    }
  }
}

export class IntentClassifier {
  constructor(private cocktailDB: CocktailData[]) {}

  classify(input: string, context: DialogueContext): ClassifiedIntent {
    const normalizedInput = input.trim().toLowerCase()
    const cocktailRefs: CocktailReference[] = []
    const matchedKeywords: string[] = []
    const matchingPatterns: string[] = []

    const route = routeUserInput(normalizedInput, {
      recommendationActive: context.activeRecommendationSession ?? false,
      allowRecommendationRoutes: context.allowRecommendationRoutes ?? true,
      lastDiscussedCocktailId: context.lastDiscussedCocktailId ?? context.lastServedCocktail?.id,
      orderCandidateCocktailId: context.orderCandidateCocktailId ?? context.lastServedCocktail?.id,
    })
    const conversationResult = this.evaluateConversationIntent(normalizedInput)
    const keywordRulesResult = this.evaluateKeywordRules(normalizedInput)

    let finalIntent: IntentType
    let finalConfidence: number
    let finalSource: ClassifiedIntent['source']

    const routeMustWin = [
      'safety',
      'exit',
      'recommendation-cancel',
      'lore-based-order',
      'explicit-cocktail',
      'cocktail-mention',
      'unknown-cocktail-query',
    ].includes(route.route)

    if (routeMustWin) {
      finalIntent = this.mapInputRouteToIntent(route.route)
      finalConfidence = route.confidence
      finalSource = 'input-router'
      matchingPatterns.push(`route:${route.route}`)
    } else if (conversationResult.intent !== 'general-chat') {
      finalIntent = conversationResult.intent
      finalConfidence = conversationResult.confidence
      finalSource = 'conversation'
    } else if (route.route !== 'general') {
      finalIntent = this.mapInputRouteToIntent(route.route)
      finalConfidence = route.confidence
      finalSource = 'input-router'
      matchingPatterns.push(`route:${route.route}`)
    } else if (keywordRulesResult.intent !== 'general') {
      finalIntent = this.mapKeywordResultToIntent(keywordRulesResult.intent)
      finalConfidence = keywordRulesResult.confidence
      finalSource = 'keyword-rules'
    } else {
      finalIntent = 'general-chat'
      finalConfidence = 0.5
      finalSource = 'inference'
    }

    const entities: ExtractedEntities = this.extractEntities(normalizedInput)
    const cocktailNameCandidates = this.extractCocktailNameCandidates(normalizedInput, context)

    if (cocktailNameCandidates.length > 0) {
      const top = cocktailNameCandidates[0]
      entities.cocktailName = top.name
      entities.cocktailId = top.id
    }

    cocktailNameCandidates.forEach(cocktail => {
      cocktailRefs.push({
        name: cocktail.name,
        id: cocktail.id,
        type: this.determineCocktailReferenceType(cocktail.name, normalizedInput, context),
        confidence: this.calculateCocktailReferenceConfidence(cocktail, normalizedInput, context),
      })
    })

    return {
      route,
      intent: finalIntent,
      entities,
      confidence: finalConfidence,
      source: finalSource,
      metadata: {
        cocktailReferences: cocktailRefs,
        contextualEligibility: this.calculateContextualEligibility(finalIntent, context),
        contextualExclusions: this.calculateContextualExclusions(finalIntent, context),
        debugInfo: {
          matchedKeywords: matchedKeywords,
          matchingPatterns: matchingPatterns,
          previousTurnContext: context.lastTopic,
          sessionHistoryContext: this.buildSessionHistoryContext(context),
        },
      },
    }
  }

  private evaluateConversationIntent(input: string) {
    const intents = this.detectConversationIntents(input)
    const cocktailCandidates = this.extractCocktailNameCandidates(input, this.emptyContext())

    if (cocktailCandidates.length > 0) {
      if (intents[0] === 'general-chat' || intents[0] === 'cocktail-query') {
        return { intent: 'order-cocktail' as IntentType, confidence: 0.85 }
      }
    }

    const mainIntent = intents[0]
    return {
      intent: mainIntent,
      confidence: intents.length > 0 ? 0.7 : 0.5,
    }
  }

  private emptyContext(): DialogueContext {
    return { mentionedCocktails: [], sessionPhase: 'conversation' }
  }

  private evaluateKeywordRules(input: string) {
    const keywordMatch = this.detectKeywordMatch(input)
    const intent = keywordMatch ? this.mapKeywordResultToIntent(keywordMatch) : 'general'
    return {
      intent,
      confidence: keywordMatch ? 0.8 : 0.5,
    }
  }

  private detectConversationIntents(input: string): IntentType[] {
    const lower = input.toLowerCase()

    if (kf(['시끄러', '닥쳐', '꺼져', '짜증나', '열받아', '화나']).test(lower)) return ['rude-talk']
    if (kf(['당장', '빨리 해', '가져와', '내놔', '말 들어', '듣거라', '니가 뭔데']).test(lower)) return ['rude-talk']
    if (kf(['별로', '마음에 안 들어', '실망', '기대 이하', '못하네']).test(lower)) return ['rude-talk']

    if (kf(['Re:Station', '리스테이션', '처음 왔', '처음이야', '이게 무슨 곳']).test(lower)) return ['bar-setting']
    if (/(?:여기|여긴|여기가)\s*(?:뭐\s*하는\s*(?:곳|데)|어디)/.test(lower)) return ['bar-setting']
    if (kf(['시에스타', '사장님', '사장']).test(lower)) return ['siesta-setting']
    if (/당신은\s*(?:그럼|누구|뭐|뭘)|넌\s*(?:뭐|누구)|너는\s*(?:누구|뭐)|바텐더(?:야|니|예요|인가)|네가\s*(?:누구|뭐|뭔데)/.test(lower)) return ['character-query']
    if (kf(['분위기', '음악', '조명', '바 좋', '좋은 곳', '멋지', '예쁘', '아늑']).test(lower)) return ['bar-atmosphere']
    if (kf(['비 오', '비가', '눈 오', '춥', '더워', '날씨', '바람', '습하']).test(lower)) return ['weather-talk']
    if (kf(['모르겠', '뭐하지', '고민', '아무 생각', '그냥 왔', '딱히']).test(lower)) return ['uncertain-talk']
    if (kf(['조용히', '혼자', '쉬고 싶', '말없이', '가만히', '잠깐 쉬']).test(lower)) return ['quiet-talk']
    if (kf(['물 좀', '물 주세요', '물 줘', '물 한잔', '물 한 잔', '시원한 물']).test(lower)) return ['water-request']
    if (kf(['취했', '너무 취', '많이 마셨', '그만 마셔', '술 그만', '더 못 마시']).test(lower)) return ['overdrunk']
    if (kf(['알레르기', '못 먹', '빼고', '제외', '먹으면 안', '알러지']).test(lower)) return ['ingredient-constraint']
    if (kf(['예약', '영업시간', '주소', '위치', '전화', '결제', '카드 돼', '화장실', '와이파이']).test(lower)) return ['real-world-info']
    if (kf(['아무거나']).test(lower)) return ['random-request']

    if (/누가\s*(?:만들|발명|고안|마시|좋아하)/.test(lower)) return ['story-query']
    if (/[가-힣]{2,}[이가]\s*(?:마시|좋아하).*칵테일/.test(lower)) return ['story-query']
    if (/왜\s*(?:이름|불리|붙은)/.test(lower)) return ['story-query']
    if (/탄생\s*(?:이야기|설명)|기원/.test(lower)) return ['lore-query']
    if (/정보\s*(?:좀\s*)?(?:알려|줘|뭐야|뭔지)|맛\s*설명|도수|어떤\s*칵테일|이\s*칵테일\s*(?:정보|설명)/.test(lower)) return ['cocktail-info-query']

    if (kf(['젓지말고 흔들', '젓지 말고 흔들', '흔들어서', '흔든', '본드식', '007처럼']).test(lower)) return ['lore-followup']
    if (/shaken\s*,?\s*not\s*stirred/i.test(lower)) return ['lore-followup']
    if (/shaken\s+not\s+stirred/i.test(lower)) return ['lore-followup']

    if (kf(['추천', '뭐가 좋아', '칵테일', '마실', '취하', '주문', '한 잔', '한잔']).test(lower)) return ['cocktail-query']
    if (kf(['달콤', '쓰다', '신맛', '짠맛', '향', '맛', '상큼', '청량', '순하', '강하', '진하', '산미']).test(lower)) return ['taste-query']
    if (kf(['어떻게', '재료', '만들', '레시피', '뭐가 들', '조리법', '방법']).test(lower)) return ['recipe-query']
    if (kf(['힘들', '우울', '슬퍼', '행복', '기분', '외롭', '지쳤', '피곤', '스트레스', '속상', '답답', '졸리', '좋은 일', '좋았']).test(lower)) return ['mood-talk']
    if (kf(['이야기', '얘기', '사연', '비밀', '옛날', '추억', '유래', '뒷이야기']).test(lower)) return ['story-query']
    if (/그거\s*맞/.test(lower)) return ['story-query-followup']
    if (/좋아하/.test(lower)) return ['story-query']
    if (kf(['더 알려', '더 들려', '계속 들려']).test(lower)) return ['story-query-followup']

    if (/[가-힣]{2,}[이가]\s*마시/.test(lower)) return ['lore-query']

    return ['general-chat']
  }

  private detectKeywordMatch(input: string): string | null {
    for (const rule of keywordRules) {
      if (rule.pattern.test(input)) {
        return rule.dialogueCategory || rule.response
      }
    }
    return null
  }

  private extractEntities(input: string): ExtractedEntities {
    const entities: ExtractedEntities = {}

    const tasteKeywords: Record<string, string[]> = {
      sweet: ['달콤', 'sweet'],
      sour: ['신맛', 'sour'],
      bitter: ['쓴맛', 'bitter'],
      spicy: ['매운', 'spicy'],
      alcoholic: ['술', '알코올', '도수'],
      carbonated: ['탄산', 'carbonated'],
    }

    Object.entries(tasteKeywords).forEach(([key, keywords]) => {
      if (keywords.some(k => input.includes(k))) entities.taste = { ...entities.taste, [key]: true }
    })

    const baseSpirits = ['진', '보드카', '럼', '위스키', '데킬라', '브랜디', 'gin', 'vodka', 'rum', 'whiskey', 'tequila', 'brandy']
    const matchedBase = baseSpirits.find(spirits => input.includes(spirits))
    if (matchedBase) entities.baseSpirit = matchedBase

    return entities
  }

  private extractCocktailNameCandidates(input: string, context: DialogueContext): CocktailData[] {
    const candidates: CocktailData[] = []
    const lower = input.toLowerCase()

    this.cocktailDB.forEach(cocktail => {
      const nameMatch = lower.includes(cocktail.name.toLowerCase())
      const nameEnMatch = cocktail.nameEn && lower.includes(cocktail.nameEn.toLowerCase())
      const aliasMatch = cocktail.aliases?.some(alias => lower.includes(alias.toLowerCase()))

      if (nameMatch || nameEnMatch || aliasMatch) {
        candidates.push(cocktail)
      }
    })

    if (context.lastServedCocktail && !candidates.find(c => c.id === context.lastServedCocktail?.id)) {
      candidates.unshift(context.lastServedCocktail)
    }

    context.mentionedCocktails?.forEach(cocktail => {
      if (!candidates.find(c => c.id === cocktail.id)) {
        candidates.unshift(cocktail)
      }
    })

    return candidates
  }

  private determineCocktailReferenceType(
    cocktailName: string,
    input: string,
    context: DialogueContext,
  ): CocktailReference['type'] {
    if (input.includes(cocktailName.toLowerCase()) && !this.isPronounReplacement(input)) {
      return 'direct'
    }
    if (this.isPronounReplacement(input) && context.lastServedCocktail?.name === cocktailName) {
      return 'pronoun'
    }
    if (context.mentionedCocktails?.some(c => c.name === cocktailName)) {
      return 'context'
    }
    return 'historical'
  }

  private isPronounReplacement(input: string): boolean {
    const pronounPatterns = ['그거', '그칵테일', '그거 맞나요', '그거 얘기', '그런', '그']
    return pronounPatterns.some(pattern => input.includes(pattern))
  }

  private calculateCocktailReferenceConfidence(
    cocktail: CocktailData,
    input: string,
    context: DialogueContext,
  ): number {
    let confidence = 0.5

    if (input.includes(cocktail.name.toLowerCase())) confidence += 0.3
    if (cocktail.nameEn && input.includes(cocktail.nameEn.toLowerCase())) confidence += 0.2
    if (cocktail.aliases?.some(alias => input.includes(alias.toLowerCase()))) confidence += 0.5

    if (context.lastServedCocktail?.id === cocktail.id) confidence += 0.3
    if (context.mentionedCocktails?.some(c => c.id === cocktail.id)) confidence += 0.2

    return Math.min(confidence, 1.0)
  }

  private calculateContextualEligibility(
    intent: IntentType,
    context: DialogueContext,
  ): ClassifiedIntent['metadata']['contextualEligibility'] {
    const eligibility: ClassifiedIntent['metadata']['contextualEligibility'] = {}

    if (intent === 'cocktail-query' || intent === 'recommendation-query') {
      eligibility.allowsRecommendation = this.isRecommendationAllowed(context)
    }

    if (intent === 'story-query' || intent === 'story-query-cocktail-specific') {
      eligibility.allowsStoryQuery = this.isStoryQueryAllowed(context)
    }

    eligibility.allowsGeneralChat = this.isGeneralChatAllowed(intent)

    return eligibility
  }

  private calculateContextualExclusions(
    intent: IntentType,
    context: DialogueContext,
  ): ClassifiedIntent['metadata']['contextualExclusions'] {
    const exclusions: ClassifiedIntent['metadata']['contextualExclusions'] = {}

    if (this.isRecommendationBlocked(context, intent)) {
      exclusions.blockedRecommendation = true
      exclusions.fallbackToGeneral = true
    }

    if (this.isStoryQueryBlocked(context, intent)) {
      exclusions.blockedStoryQuery = true
      exclusions.fallbackToGeneral = true
    }

    return exclusions
  }

  private isRecommendationAllowed(context: DialogueContext): boolean {
    if (context.sessionPhase === 'farewell' || context.sessionPhase === 'safetyLocked' || context.sessionPhase === 'returnHome') return false
    if (context.alcoholStarsTotal && context.alcoholStarsTotal >= 10) return false
    return true
  }

  private isStoryQueryAllowed(context: DialogueContext): boolean {
    if (context.sessionPhase === 'farewell' || context.sessionPhase === 'safetyLocked' || context.sessionPhase === 'returnHome') return false
    return true
  }

  private isGeneralChatAllowed(intent: IntentType): boolean {
    return intent === 'general-chat' || intent === 'cocktail-query'
  }

  private isRecommendationBlocked(
    context: DialogueContext,
    intent: IntentType,
  ): boolean {
    if (context.sessionPhase === 'farewell' || context.sessionPhase === 'safetyLocked' || context.sessionPhase === 'returnHome') return intent === 'cocktail-query' || intent === 'recommendation-query'
    if (context.alcoholStarsTotal && context.alcoholStarsTotal >= 10 && intent === 'cocktail-query') return true
    return false
  }

  private isStoryQueryBlocked(context: DialogueContext, intent: IntentType): boolean {
    if (!['story-query', 'lore-query', 'cocktail-info-query', 'story-query-followup', 'story-query-cocktail-specific', 'lore-followup'].includes(intent)) return false
    if (context.sessionPhase === 'farewell' || context.sessionPhase === 'safetyLocked' || context.sessionPhase === 'returnHome') return true
    return false
  }

  private mapInputRouteToIntent(route: InputRoute): IntentType {
    const map: Record<InputRoute, IntentType> = {
      safety: 'safety-alert',
      exit: 'exit-intent',
      'recommendation-cancel': 'recommendation-cancel',
      'random-recommendation': 'random-request',
      'lore-based-order': 'order-cocktail',
      'explicit-cocktail': 'order-cocktail',
      'cocktail-mention': 'cocktail-query',
      'unknown-cocktail-query': 'unknown-cocktail-request',
      'story-query': 'story-query',
      'lore-query': 'lore-query',
      'cocktail-info-query': 'cocktail-info-query',
      'character-query': 'character-query',
      recommendation: 'cocktail-query',
      general: 'general-chat',
    }
    return map[route]
  }

  private mapKeywordResultToIntent(keywordMatch: string): IntentType {
    const map: Record<string, IntentType> = {
      'bar-intro': 'bar-setting',
      'siesta-mention': 'siesta-setting',
      'bar-atmosphere': 'bar-atmosphere',
      'small-talk-weather': 'weather-talk',
      'guest-uncertain': 'uncertain-talk',
      'quiet-moment': 'quiet-talk',
      'water-request': 'water-request',
      overdrunk: 'overdrunk',
      'ingredient-constraint': 'ingredient-constraint',
      'real-world-info': 'real-world-info',
      'rude-annoyed': 'rude-talk',
      'rude-boundary': 'rude-talk',
      greeting: 'recognition',
      'mood-tired': 'mood-talk',
      'mood-sad': 'mood-talk',
      'mood-happy': 'mood-talk',
      'cocktail-request': 'cocktail-query',
      'taste-sweet': 'taste-query',
      'taste-strong': 'taste-query',
    }
    return map[keywordMatch] ?? 'general-chat'
  }

  private buildSessionHistoryContext(context: DialogueContext): { lastCocktail?: string; lastMood?: string; recentTopics?: string[] } {
    return {
      lastCocktail: context.lastServedCocktail?.name,
      lastMood: context.userMood ?? undefined,
      recentTopics: [context.lastTopic].filter((x): x is string => x !== null && x !== undefined),
    }
  }
}
