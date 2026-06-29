import { describe, expect, it } from 'vitest'
import { IntentClassifier, type DialogueContext } from '../bartender/intent-classifier.js'
import { cocktails, findCocktailByName } from '../cocktails/database.js'
import { resolveDialogueAction } from './action-resolver.js'
import { createConversationContext, updateConversationContext } from './conversation-context.js'

const classifier = new IntentClassifier(cocktails)
const mojito = findCocktailByName('모히토')!
const caipirinha = findCocktailByName('카이피리냐')!
const dialogueContext: DialogueContext = {
  mentionedCocktails: [],
  sessionPhase: 'conversation',
  allowRecommendationRoutes: false,
}

describe('dialogue action resolver', () => {
  it('turns a cocktail mention into a discuss action', () => {
    const classified = classifier.classify('모히토', dialogueContext)
    const action = resolveDialogueAction(classified, createConversationContext())

    expect(action).toEqual({ type: 'discuss', cocktailId: mojito.id })
  })

  it('turns an omitted-name order into an order for the context candidate', () => {
    const context = updateConversationContext(createConversationContext(), {
      type: 'discussed',
      cocktailId: mojito.id,
    })
    const classified = classifier.classify('그걸로 주세요', {
      ...dialogueContext,
      orderCandidateCocktailId: context.lastOrderCandidateCocktailId ?? undefined,
    })

    expect(resolveDialogueAction(classified, context)).toEqual({
      type: 'order',
      cocktailId: mojito.id,
    })
  })

  it('turns a next-drink lore request into a lore based order action', () => {
    const context = updateConversationContext(createConversationContext(), {
      type: 'served',
      cocktailId: caipirinha.id,
    })
    const classified = classifier.classify('헤밍웨이가 즐겨마셨다는 걸로 다음잔을 부탁해요', {
      ...dialogueContext,
      orderCandidateCocktailId: caipirinha.id,
    })

    expect(resolveDialogueAction(classified, context)).toEqual({
      type: 'loreBasedOrder',
      cocktailId: mojito.id,
    })
  })

  it('continues a story with the latest contextual cocktail', () => {
    const context = updateConversationContext(createConversationContext(), {
      type: 'recommended',
      cocktailId: mojito.id,
    })
    const classified = classifier.classify('그 이야기 더 들려줘', dialogueContext)

    expect(resolveDialogueAction(classified, context)).toEqual({
      type: 'continueStory',
      topic: 'story',
      cocktailId: mojito.id,
    })
  })

  it('orders a lore match instead of the last served welcome drink', () => {
    const context = updateConversationContext(createConversationContext(), {
      type: 'served',
      cocktailId: caipirinha.id,
    })
    const classified = classifier.classify('헤밍웨이가 즐겨마셨다는 걸로 주세요', {
      ...dialogueContext,
      orderCandidateCocktailId: caipirinha.id,
    })

    expect(resolveDialogueAction(classified, context)).toEqual({
      type: 'loreBasedOrder',
      cocktailId: mojito.id,
    })
  })

  it('answers a person-lore confirmation with the lore match, not the welcome drink', () => {
    const context = updateConversationContext(createConversationContext(), {
      type: 'served',
      cocktailId: caipirinha.id,
    })
    const classified = classifier.classify('헤밍웨이가 그거 맞아요?', {
      ...dialogueContext,
      lastDiscussedCocktailId: caipirinha.id,
      orderCandidateCocktailId: caipirinha.id,
    })

    expect(resolveDialogueAction(classified, context)).toEqual({
      type: 'continueStory',
      topic: 'story',
      cocktailId: mojito.id,
    })
  })

  it('does not fall back to the last served drink for an unmatched explicit lore clue', () => {
    const context = updateConversationContext(createConversationContext(), {
      type: 'served',
      cocktailId: caipirinha.id,
    })
    const classified = classifier.classify('톨킨이 즐겨마셨다는 걸로 주세요', {
      ...dialogueContext,
      orderCandidateCocktailId: caipirinha.id,
    })

    expect(resolveDialogueAction(classified, context)).toEqual({
      type: 'continueStory',
      topic: 'story',
      cocktailId: null,
    })
  })
})
