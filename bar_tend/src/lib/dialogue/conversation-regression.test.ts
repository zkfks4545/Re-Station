import { describe, expect, it, vi } from 'vitest'
import type { CocktailData } from '../../types.js'
import { cocktails, getCocktailById, publicCocktails } from '../cocktails/index.js'
import {
  createRecommendationSourcePool,
  pickFromPool,
} from '../recommendation/question-engine.js'
import {
  addExcludedCocktailId,
  getFeedbackExcludedCocktailId,
} from '../recommendation/feedback-exclusion.js'
import { executeDialogueAction, type ActionExecutionPorts } from './action-executor.js'
import {
  createConversationContext,
  updateConversationContext,
} from './conversation-context.js'
import { DialogueService, type DialogueServiceRequest } from './dialogue-service.js'

const service = new DialogueService(cocktails)

function request(
  text: string,
  conversationContext = createConversationContext(),
): DialogueServiceRequest {
  return {
    text,
    messages: [{ role: 'user', text }],
    conversationContext,
    session: {
      phase: 'conversation',
      activeRecommendationSession: false,
      allowRecommendationRoutes: true,
      welcomeDrinkUsed: true,
      alcoholStarsTotal: 0,
      totalUserMessages: 1,
      conversationTurnCount: 0,
    },
    displayedCocktail: null,
  }
}

function recommendationPorts(excludedCocktailIds: string[]): ActionExecutionPorts {
  const source = createRecommendationSourcePool(excludedCocktailIds)
  const selected = pickFromPool(source.cocktails, {})
  const fallback = selected ?? publicCocktails[0]
  const fallbackOutcome = {
    reply: `${fallback.name}을 준비할게요.`,
    expression: 'talk' as const,
    cocktail: fallback,
  }
  return {
    getCocktail: vi.fn((id: string) => getCocktailById(id) ?? null),
    recommendByPreference: vi.fn(() => selected ? {
      reply: `${selected.name}을 새로 골랐어요.`,
      expression: 'talk' as const,
      cocktail: selected,
    } : null),
    recommendRandom: vi.fn(() => fallbackOutcome),
    orderExplicit: vi.fn(() => fallbackOutcome),
    orderByLore: vi.fn(() => fallbackOutcome),
  }
}

describe('reaction and conversation flow regressions', () => {
  it('does not execute another-request recommendation during farewell', () => {
    const resolution = service.resolve({
      ...request('다른 걸로 추천해줘'),
      session: {
        ...request('').session,
        phase: 'farewell',
        allowRecommendationRoutes: false,
      },
    })
    const actionPorts = recommendationPorts([])

    if (!resolution.blockedBySession) {
      executeDialogueAction({ action: resolution.action, text: '다른 걸로 추천해줘' }, actionPorts)
    }

    expect(resolution.action).toEqual({ type: 'recommend', mode: 'preference' })
    expect(resolution.blockedBySession).toBe(true)
    expect(actionPorts.recommendByPreference).not.toHaveBeenCalled()
  })

  it('does not recommend the same cocktail again after negative feedback', () => {
    const previous = publicCocktails[0]
    const context = updateConversationContext(createConversationContext(), {
      type: 'recommended',
      cocktailId: previous.id,
    })
    const feedback = service.resolve(request('별로예요', context))

    expect(feedback.reaction?.type).toBe('negative-feedback')
    expect(feedback.action).toEqual({ type: 'respond' })

    const rejectedId = getFeedbackExcludedCocktailId(feedback.reaction, context)
    expect(rejectedId).toBe(previous.id)
    const excludedIds = addExcludedCocktailId([], rejectedId!)

    const retry = service.resolve(request('다시 추천해 주세요', context))
    const execution = executeDialogueAction({
      action: retry.action,
      text: '다시 추천해 주세요',
    }, recommendationPorts(excludedIds))

    expect(execution.status).toBe('completed')
    expect(execution.outcome?.cocktail?.id).not.toBe(previous.id)
  })

  it('turns another-request into a new recommendation', () => {
    const previous = publicCocktails[0]
    const context = updateConversationContext(createConversationContext(), {
      type: 'recommended',
      cocktailId: previous.id,
    })
    const resolution = service.resolve(request('다른 걸로 추천해줘', context))
    const rejectedId = getFeedbackExcludedCocktailId(resolution.reaction, context)
    const excludedIds = rejectedId ? addExcludedCocktailId([], rejectedId) : []
    const execution = executeDialogueAction({
      action: resolution.action,
      text: '다른 걸로 추천해줘',
    }, recommendationPorts(excludedIds))
    const turn = service.buildMainTurn(request('다른 걸로 추천해줘', context), resolution, {
      outcome: execution.outcome,
    })

    expect(resolution.reaction?.type).toBe('another-request')
    expect(rejectedId).toBe(previous.id)
    expect(resolution.action).toEqual({ type: 'recommend', mode: 'preference' })
    expect(execution.outcome?.cocktail?.id).not.toBe(previous.id)
    expect(turn?.reply.split('\n')[0]).toBe(resolution.reaction?.reply)
  })

  it('does not repeat a disclosed lore fact on follow-up', () => {
    const cocktail = getCocktailById('cocktail_classic_001') as CocktailData
    let context = updateConversationContext(createConversationContext(), {
      type: 'served',
      cocktailId: cocktail.id,
    })
    const first = service.resolve(request('이 칵테일 유래가 뭐죠?', context))
    const firstFactKeys = first.directResponse?.contextEvents
      .filter((event) => event.type === 'fact-disclosed')
      .map((event) => event.factKey) ?? []
    for (const event of first.directResponse?.contextEvents ?? []) {
      context = updateConversationContext(context, event)
    }

    const followup = service.resolve(request('그 이야기 더 들려줘요', context))
    const followupFactKeys = followup.directResponse?.contextEvents
      .filter((event) => event.type === 'fact-disclosed')
      .map((event) => event.factKey) ?? []

    expect(firstFactKeys).not.toHaveLength(0)
    expect(followupFactKeys).not.toHaveLength(0)
    expect(followupFactKeys.some((key) => firstFactKeys.includes(key))).toBe(false)
  })

  it('prints the reaction line before the lore body', () => {
    const resolution = service.resolve(request('모히토 유래가 뭐죠?'))
    const lines = resolution.directResponse?.turn.reply.split('\n') ?? []

    expect(lines[0]).toBe('그 이야기는 꽤 유명하죠.')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.slice(1).join('\n')).not.toBe('')
  })
})
