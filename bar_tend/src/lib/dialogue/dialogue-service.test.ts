import { describe, expect, it } from 'vitest'
import { cocktails } from '../cocktails/database.js'
import { createConversationContext, updateConversationContext } from './conversation-context.js'
import { DialogueService, type DialogueServiceRequest } from './dialogue-service.js'

const service = new DialogueService(cocktails)

function request(text: string): DialogueServiceRequest {
  return {
    text,
    messages: [{ role: 'user', text }],
    conversationContext: createConversationContext(),
    session: {
      phase: 'conversation',
      activeRecommendationSession: false,
      allowRecommendationRoutes: false,
      welcomeDrinkUsed: true,
      alcoholStarsTotal: 0,
      totalUserMessages: 1,
      conversationTurnCount: 0,
    },
    displayedCocktail: null,
  }
}

describe('DialogueService', () => {
  it('resolves an exact cocktail name as an order action without creating a direct reply', () => {
    const result = service.resolve(request('모히토'))

    expect(result.routeResult.route).toBe('explicit-cocktail')
    expect(result.action).toMatchObject({ type: 'order' })
    expect(result.directResponse).toBeNull()
  })

  it('keeps information requests above a secret passphrase and targets the current cocktail', () => {
    const context = updateConversationContext(createConversationContext(), {
      type: 'served',
      cocktailId: 'cocktail_signature_043',
    })
    const result = service.resolve({
      ...request('오늘은 이야기를 섞어줘'),
      conversationContext: context,
    })

    expect(result.routeResult.route).toBe('story-query')
    expect(result.routeResult.secretPassphrase).toBeUndefined()
    expect(result.directResponse?.kind).toBe('cocktail-content')
    expect(result.directResponse?.cocktail?.id).toBe('cocktail_signature_043')
  })

  it('returns context events for the next undisclosed cocktail fact', () => {
    let context = updateConversationContext(createConversationContext(), {
      type: 'served',
      cocktailId: 'cocktail_signature_043',
    })
    const first = service.resolve({
      ...request('설명을 더 해주세요'),
      conversationContext: context,
    })
    for (const event of first.directResponse?.contextEvents ?? []) {
      context = updateConversationContext(context, event)
    }
    const second = service.resolve({
      ...request('이야기 더'),
      conversationContext: context,
    })

    expect(first.directResponse?.turn.reply).not.toBe(second.directResponse?.turn.reply)
    expect(first.directResponse?.contextEvents).toContainEqual({
      type: 'story-targeted',
      cocktailId: 'cocktail_signature_043',
    })
    expect(first.directResponse?.contextEvents.some((event) => event.type === 'fact-disclosed')).toBe(true)
  })

  it('reacts before continuing with cocktail lore', () => {
    const result = service.resolve(request('모히토 유래가 뭐죠?'))
    const lines = result.directResponse?.turn.reply.split('\n') ?? []

    expect(result.routeResult.route).toBe('story-query')
    expect(lines[0]).toBe('그 이야기는 꽤 유명하죠.')
    expect(lines.slice(1).join('\n').trim().length).toBeGreaterThan(0)
    expect(result.directResponse?.contextEvents.some((event) => event.type === 'fact-disclosed')).toBe(true)
  })

  it('uses a continuation reaction without repeating the disclosed fact', () => {
    let context = updateConversationContext(createConversationContext(), {
      type: 'served',
      cocktailId: 'cocktail_classic_001',
    })
    const first = service.resolve({ ...request('이야기를 들려줘'), conversationContext: context })
    for (const event of first.directResponse?.contextEvents ?? []) {
      context = updateConversationContext(context, event)
    }
    const second = service.resolve({ ...request('조금 더 알려줘'), conversationContext: context })

    expect(second.directResponse?.turn.reply.split('\n')[0]).toBe('조금 더 이어가보죠.')
    expect(second.directResponse?.turn.reply).not.toContain(first.directResponse?.turn.reply ?? '')
  })

  it('builds the general dialogue turn after recommendation execution is resolved externally', () => {
    const serviceRequest = request('오늘 좀 피곤하네요')
    const resolution = service.resolve(serviceRequest)
    const turn = service.buildMainTurn(serviceRequest, resolution, {
      outcome: null,
      inviteRecommendation: true,
    })

    expect(turn?.reply).toContain('한 잔 맞춰볼까요?')
    expect(turn?.action).toBe('reply')
  })

  it('does not emit order context events when farewell blocks a lore-based order', () => {
    const conversationContext = updateConversationContext(createConversationContext(), {
      type: 'served',
      cocktailId: 'cocktail_classic_001',
    })
    const result = service.resolve({
      ...request('헤밍웨이가 즐겨마셨다는 걸로 주세요'),
      conversationContext,
      session: {
        ...request('').session,
        phase: 'farewell',
      },
    })

    expect(result.routeResult.route).toBe('lore-based-order')
    expect(result.blockedBySession).toBe(true)
    expect(result.contextEvents).toEqual([])
    const updated = result.contextEvents.reduce(updateConversationContext, conversationContext)
    expect(updated).toEqual(conversationContext)
  })

  it('blocks order and recommendation contracts while safetyLocked', () => {
    const lockedSession = {
      ...request('').session,
      phase: 'safetyLocked' as const,
      allowRecommendationRoutes: true,
    }
    const order = service.resolve({ ...request('모히토'), session: lockedSession })
    const recommendation = service.resolve({ ...request('추천받기'), session: lockedSession })

    expect(order.blockedBySession).toBe(true)
    expect(order.contextEvents).toEqual([])
    expect(recommendation.routeResult.route).toBe('recommendation')
    expect(recommendation.blockedBySession).toBe(true)
  })

  it('uses the same order-candidate event contract for typed and sidebar-style orders', () => {
    const typed = service.resolve(request('모히토'))
    const sidebar = service.resolve(request('모히토 주세요'))

    expect(typed.action.type).toBe('order')
    expect(typed.action).toEqual(sidebar.action)
    expect(typed.contextEvents).toEqual(sidebar.contextEvents)
    if (typed.action.type !== 'order') throw new Error('Expected an order action')
    expect(typed.contextEvents).toEqual([{
      type: 'order-candidate',
      cocktailId: typed.action.cocktailId,
    }])
  })

  it.each([
    ['맛있어요', 'positive-feedback'],
    ['별로예요', 'negative-feedback'],
    ['맞아요', 'agreement'],
    ['무슨 말인지 모르겠어요', 'confused'],
  ] as const)('reacts to %s without continuing into lore or an order', (text, reactionType) => {
    const serviceRequest = request(text)
    const resolution = service.resolve(serviceRequest)
    const turn = service.buildMainTurn(serviceRequest, resolution, { outcome: null })

    expect(resolution.reaction?.type).toBe(reactionType)
    expect(resolution.action).toEqual({ type: 'respond' })
    expect(resolution.directResponse).toBeNull()
    expect(turn?.reply).toBe(resolution.reaction?.reply)
  })

  it('reacts first and then uses the existing recommendation action for another-request', () => {
    const serviceRequest = {
      ...request('다른 걸로 추천해줘'),
      session: { ...request('').session, allowRecommendationRoutes: true },
    }
    const resolution = service.resolve(serviceRequest)
    const turn = service.buildMainTurn(serviceRequest, resolution, {
      outcome: {
        reply: '새 후보를 골랐어요.',
        expression: 'talk',
        decision: null,
      },
    })

    expect(resolution.reaction?.type).toBe('another-request')
    expect(resolution.action).toEqual({ type: 'recommend', mode: 'preference' })
    expect(turn?.reply).toBe(`${resolution.reaction?.reply}\n새 후보를 골랐어요.`)
  })
})
