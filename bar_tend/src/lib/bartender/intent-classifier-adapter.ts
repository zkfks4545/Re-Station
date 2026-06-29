import { IntentClassifier, type ClassifiedIntent, type DialogueContext } from './intent-classifier.js'
import type { CocktailData, Message } from '../../types.js'

export class IntentClassifierAdapter {
  private classifier: IntentClassifier

  constructor(cocktailDB: CocktailData[]) {
    this.classifier = new IntentClassifier(cocktailDB)
  }

  classifyWithFallback(input: string, history: Message[]): ClassifiedIntent {
    const context = this.buildDialogueContext(history)
    const classified = this.classifier.classify(input, context)

    return {
      ...classified,
      metadata: {
        ...classified.metadata,
        contextualEligibility: {
          ...classified.metadata.contextualEligibility,
          allowsRecommendation: !this.isRecommendationBlockedByContext(history),
          allowsStoryQuery: !this.isStoryQueryBlockedByContext(history),
          allowsGeneralChat: true,
        },
        contextualExclusions: {
          ...classified.metadata.contextualExclusions,
          blockedRecommendation: this.isRecommendationBlockedByContext(history),
          blockedStoryQuery: this.isStoryQueryBlockedByContext(history),
          fallbackToGeneral: this.isRecommendationBlockedByContext(history) || this.isStoryQueryBlockedByContext(history),
        },
      },
    }
  }

  private buildDialogueContext(history: Message[]): DialogueContext {
    const lastUserMessage = history.filter(m => m.role === 'user').pop()
    const lastBartenderMessage = history.filter(m => m.role === 'bartender').pop()

    const allText = history.map(m => m.text).join(' ')

    return {
      lastServedCocktail: this.findCocktailByName(lastBartenderMessage?.text || '') || undefined,
      mentionedCocktails: this.extractMentionedCocktails(allText),
      userMood: null,
      sessionPhase: 'conversation',
      activeRecommendationSession: history.some(m => m.text.includes('추천') || m.text.includes('취향')),
      welcomeDrinkUsed: false,
      alcoholStarsTotal: 0,
      lastTopic: this.inferLastTopic(lastUserMessage?.text || ''),
      totalUserMessages: history.filter(m => m.role === 'user').length,
      conversationTurnCount: Math.floor(history.length / 2),
      userName: undefined,
      exchangeCount: Math.floor(history.length / 2),
      lastBartenderWasQuestion: lastBartenderMessage?.text?.endsWith('?') || false,
    }
  }

  private isRecommendationBlockedByContext(history: Message[]): boolean {
    const lastUserMessage = history.filter(m => m.role === 'user').pop()
    if (!lastUserMessage) return false

    const farewellKeywords = ['잘 가', '다음에', '안녕히', '들러주셔서 감사합니다']
    const isFarewell = farewellKeywords.some(keyword => lastUserMessage.text.includes(keyword))
    if (isFarewell) return true

    const overdrunkKeywords = ['취했', '너무 취', '많이 마셨', '그만 마셔', '술 그만', '더 못 마시']
    const isOverdrunk = overdrunkKeywords.some(keyword => lastUserMessage.text.includes(keyword))
    if (isOverdrunk) return true

    return false
  }

  private isStoryQueryBlockedByContext(history: Message[]): boolean {
    const lastUserMessage = history.filter(m => m.role === 'user').pop()
    if (!lastUserMessage) return false

    return ['잘 가', '다음에', '안녕히'].some(keyword =>
      lastUserMessage.text.includes(keyword)
    )
  }

  private findCocktailByName(text: string): CocktailData | null {
    return this.classifier['cocktailDB'].find((c: CocktailData) =>
      text.includes(c.name) || (c.nameEn && text.includes(c.nameEn)) ||
      c.aliases?.some(alias => text.includes(alias))
    ) || null
  }

  private extractMentionedCocktails(text: string): CocktailData[] {
    return this.classifier['cocktailDB'].filter((c: CocktailData) =>
      text.includes(c.name) || (c.nameEn && text.includes(c.nameEn)) ||
      c.aliases?.some(alias => text.includes(alias))
    )
  }

  private inferLastTopic(text: string): string {
    if (!text) return ''

    if (['칵테일', '추천', '마실', '주문', '취향'].some(p => text.includes(p))) return 'cocktail'
    if (['이야기', '유래', '배경', '설명'].some(p => text.includes(p))) return 'story'
    if (['안녕', '반가', '처음'].some(p => text.includes(p))) return 'general'

    return 'general'
  }
}
