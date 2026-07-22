import { afterEach, describe, expect, it, vi } from 'vitest'
import { cocktails } from '../cocktails/index.js'
import { createConversationContext } from './conversation-context.js'
import { DialogueService, type DialogueServiceRequest } from './dialogue-service.js'
import { detectCharacterPreferenceTopic, routeUserInput } from './input-router.js'

const service = new DialogueService(cocktails)

const cases = [
  ['당신은 무슨 음료를 좋아하나요', 'drink'],
  ['카루아는 어떤 술을 좋아해요', 'drink'],
  ['너는 좋아하는 칵테일이 뭐야', 'drink'],
  ['바텐더님은 어떤 음료를 선호하세요', 'drink'],
  ['당신 취향의 술은 뭐예요', 'drink'],
  ['카루아가 즐겨 마시는 건 뭐예요', 'drink'],
  ['넌 무슨 술을 좋아해', 'drink'],
  ['칼루아는 커피 리큐르를 좋아하나요', 'drink'],
  ['당신은 어떤 잔을 좋아하세요', 'drink'],
  ['바텐더는 뭘 즐겨 마셔요', 'drink'],
  ['카루아는 마시고 싶은 칵테일이 있어요', 'drink'],
  ['너는 어떤 리큐르를 선호해', 'drink'],
  ['당신은 뭘 좋아해요', 'general'],
  ['카루아는 뭐를 좋아하나요', 'general'],
  ['넌 무엇을 좋아해', 'general'],
  ['너는 어떤 걸 좋아해', 'general'],
  ['바텐더는 어떤 것을 좋아하나요', 'general'],
  ['카루아가 좋아하는 것은 뭐예요', 'general'],
  ['당신 취미는 뭐예요', 'general'],
  ['카루아의 취향은 뭐예요', 'general'],
  ['칼루아는 아끼는 것은 뭐예요', 'general'],
  ['바텐더님은 좋아하는 게 있나요', 'general'],
  ['당신은 어떤 시간을 좋아하세요', 'general'],
  ['카루아는 조용한 시간을 좋아하나요', 'general'],
] as const

function request(text: string): DialogueServiceRequest {
  return {
    text,
    messages: [{ role: 'user', text }],
    conversationContext: createConversationContext(),
    session: {
      phase: 'conversation', activeRecommendationSession: false,
      allowRecommendationRoutes: false, welcomeDrinkUsed: true,
      alcoholStarsTotal: 0, totalUserMessages: 1, conversationTurnCount: 0,
    },
    displayedCocktail: null,
  }
}

afterEach(() => vi.restoreAllMocks())

describe('Karua preference questions', () => {
  it.each(cases)('classifies %s as a grounded character preference about %s', (input, topic) => {
    expect(detectCharacterPreferenceTopic(input)).toBe(topic)
    expect(routeUserInput(input).route).toBe('character-query')

    const result = service.resolve(request(input))
    expect(result.understanding).toMatchObject({
      primaryTopic: { value: 'character' },
      speechActs: [{ value: 'ask-character-preference' }],
      characterPreferenceTopic: { value: topic },
    })
    expect(result.understanding.entities).toContainEqual(expect.objectContaining({
      type: 'character', id: 'kahlua', value: '카루아',
    }))
  })

  it('returns the fixed drink preference ResponsePlan', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const result = service.resolve(request('당신은 무슨 음료를 좋아하나요'))

    expect(result.directResponse?.turn.responsePlanId)
      .toBe('karua.small-talk.character-preference-drink')
    expect(result.directResponse?.turn.reply)
      .toBe('저는 커피 리큐르가 들어간 잔을 좋아해요.\n이름 때문만은 아니고요.')
  })

  it('returns the fixed general preference ResponsePlan', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const result = service.resolve(request('당신은 뭘 좋아해요'))

    expect(result.directResponse?.turn.responsePlanId)
      .toBe('karua.small-talk.character-preference-general')
    expect(result.directResponse?.turn.reply)
      .toBe('조용한 시간하고, 주문이 꼬이지 않는 밤이요.\n둘 다 자주 있는 건 아니지만요.')
  })
})
