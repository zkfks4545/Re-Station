import { describe, expect, it, vi } from 'vitest'
import type { CocktailData } from '../../types.js'
import { executeDialogueAction, type ActionExecutionPorts, type ActionOutcome } from './action-executor.js'

const cocktail = { id: 'mojito', name: '모히토' } as CocktailData
const outcome: ActionOutcome = {
  reply: '모히토를 준비할게요.',
  expression: 'smirk',
  cocktail,
}

function ports(overrides: Partial<ActionExecutionPorts> = {}): ActionExecutionPorts {
  return {
    getCocktail: vi.fn(() => cocktail),
    recommendByPreference: vi.fn(() => outcome),
    recommendRandom: vi.fn(() => outcome),
    orderExplicit: vi.fn(() => outcome),
    orderByLore: vi.fn(() => outcome),
    ...overrides,
  }
}

describe('action executor', () => {
  it('executes preference and random recommendation through their ports', () => {
    const actionPorts = ports()

    const preference = executeDialogueAction({
      action: { type: 'recommend', mode: 'preference' },
      text: '상큼한 걸 추천해 주세요',
    }, actionPorts)
    const random = executeDialogueAction({
      action: { type: 'recommend', mode: 'random' },
      text: '아무거나 주세요',
    }, actionPorts)

    expect(preference).toMatchObject({
      status: 'completed',
      effect: { type: 'serve', cocktail, recommended: true },
    })
    expect(random).toMatchObject({
      status: 'completed',
      effect: { type: 'serve', cocktail, recommended: true },
    })
    expect(actionPorts.recommendByPreference).toHaveBeenCalledWith('상큼한 걸 추천해 주세요')
    expect(actionPorts.recommendRandom).toHaveBeenCalledOnce()
  })

  it('keeps explicit and lore orders on separate execution ports', () => {
    const actionPorts = ports()

    executeDialogueAction({
      action: { type: 'order', cocktailId: cocktail.id },
      text: '모히토 주세요',
      secretPassphrase: '비밀 문구',
    }, actionPorts)
    executeDialogueAction({
      action: { type: 'loreBasedOrder', cocktailId: cocktail.id },
      text: '헤밍웨이가 마시던 걸로 주세요',
    }, actionPorts)

    expect(actionPorts.orderExplicit).toHaveBeenCalledWith(cocktail, { secretPassphrase: '비밀 문구' })
    expect(actionPorts.orderByLore).toHaveBeenCalledWith(cocktail)
  })

  it('reports a missing order target without calling an order port', () => {
    const actionPorts = ports({ getCocktail: vi.fn(() => null) })

    const result = executeDialogueAction({
      action: { type: 'order', cocktailId: 'missing' },
      text: '없는 칵테일 주세요',
    }, actionPorts)

    expect(result).toEqual({
      status: 'missing-target',
      outcome: null,
      recommended: false,
      cocktailId: 'missing',
    })
    expect(actionPorts.orderExplicit).not.toHaveBeenCalled()
  })

  it('returns a respond effect when recommendation needs another answer', () => {
    const questionOutcome: ActionOutcome = {
      reply: '한 가지만 더 여쭤볼게요.',
      expression: 'thinking',
      cocktail: null,
    }
    const result = executeDialogueAction({
      action: { type: 'recommend', mode: 'preference' },
      text: '추천해 주세요',
    }, ports({ recommendByPreference: vi.fn(() => questionOutcome) }))

    expect(result).toMatchObject({
      status: 'completed',
      outcome: questionOutcome,
      effect: { type: 'respond' },
    })
  })

  it('leaves response-only actions to DialogueService', () => {
    const result = executeDialogueAction({
      action: { type: 'respond' },
      text: '안녕하세요',
    }, ports())

    expect(result).toEqual({
      status: 'not-executable',
      outcome: null,
      recommended: false,
    })
  })
})
