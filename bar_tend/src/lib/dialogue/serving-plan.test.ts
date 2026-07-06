import { describe, expect, it } from 'vitest'
import type { CocktailData } from '../../types.js'
import { XYZ_COCKTAIL_ID } from '../session/session-flow.js'
import { createServingPlan } from './serving-plan.js'

function cocktail(id: string, alcohol: number): CocktailData {
  return { id, taste: { alcohol } } as CocktailData
}

describe('serving plan', () => {
  it('adds alcohol and returns the normal post-serving phase', () => {
    const plan = createServingPlan({
      cocktail: cocktail('mojito', 2),
      currentPhase: 'conversation',
      alcoholStarTotal: 1,
    })

    expect(plan).toMatchObject({
      isXyz: false,
      nextAlcoholStarTotal: 3,
      shouldUpdateAlcoholTotal: true,
      requiresFarewell: false,
      nextPhase: 'aftertalk',
    })
  })

  it('requests farewell when the served drink reaches the alcohol limit', () => {
    const plan = createServingPlan({
      cocktail: cocktail('martini', 5),
      currentPhase: 'conversation',
      alcoholStarTotal: 8,
    })

    expect(plan.requiresFarewell).toBe(true)
    expect(plan.nextPhase).toBeNull()
  })

  it('does not add XYZ alcohol twice', () => {
    const plan = createServingPlan({
      cocktail: cocktail(XYZ_COCKTAIL_ID, 5),
      currentPhase: 'xyz',
      alcoholStarTotal: 12,
    })

    expect(plan).toMatchObject({
      isXyz: true,
      nextAlcoholStarTotal: 12,
      shouldUpdateAlcoholTotal: false,
      requiresFarewell: false,
      nextPhase: 'farewell',
    })
  })
})
