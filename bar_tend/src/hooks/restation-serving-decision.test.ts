import { describe, expect, it } from 'vitest'
import { createDialogueSessionState } from '@/lib/session/dialogue-session.js'
import type { CocktailData } from '@/types.js'
import { createRestationServingDecision } from './restation-serving-decision.js'

function cocktail(alcohol: number): CocktailData {
  return {
    id: 'test-cocktail',
    taste: { alcohol },
  } as CocktailData
}

describe('Restation serving decision', () => {
  it('keeps a regular serving in the calculated session phase', () => {
    const decision = createRestationServingDecision({
      cocktail: cocktail(2),
      currentPhase: 'conversation',
      alcoholStarTotal: 2,
      dialogueSession: createDialogueSessionState(),
    })

    expect(decision.plan.requiresFarewell).toBe(false)
    expect(decision.farewellEntryKind).toBeNull()
    expect(decision.nextPhase).toBe('aftertalk')
  })

  it('routes an alcohol-limit serving through the welcome XYZ phase when needed', () => {
    const decision = createRestationServingDecision({
      cocktail: cocktail(5),
      currentPhase: 'conversation',
      alcoholStarTotal: 5,
      dialogueSession: createDialogueSessionState(),
    })

    expect(decision.plan.requiresFarewell).toBe(true)
    expect(decision.farewellEntryKind).toBe('welcome-farewell-xyz')
    expect(decision.nextPhase).toBe('xyz')
  })

  it('routes an alcohol-limit serving through the regular XYZ phase after welcome', () => {
    const state = createDialogueSessionState()
    const decision = createRestationServingDecision({
      cocktail: cocktail(5),
      currentPhase: 'conversation',
      alcoholStarTotal: 5,
      dialogueSession: {
        ...state,
        welcomeDrink: { ...state.welcomeDrink, served: true },
      },
    })

    expect(decision.farewellEntryKind).toBe('alcohol-xyz')
    expect(decision.nextPhase).toBe('xyz')
  })
})
