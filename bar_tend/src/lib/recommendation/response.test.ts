import { describe, expect, it } from 'vitest'
import { getCocktailById } from '../cocktails/database.js'
import { createRecommendationDecision, createRecommendationState } from './state.js'
import {
  formatExplicitCocktailReply,
  formatRandomRecommendationReply,
  formatRecommendationReply,
} from './response.js'

describe('recommendation dialogue copy', () => {
  it('keeps explicit cocktail character copy in dialogue without factual card copy', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const reply = formatExplicitCocktailReply(cocktail)

    expect(reply).toContain('메뉴판보다 손님이 빠르시네')
    expect(reply).not.toContain(cocktail.description)
  })

  it('uses structured recommendation reasons in Kahlua dialogue', () => {
    const cocktail = getCocktailById('cocktail_classic_008')!
    const state = {
      ...createRecommendationState(),
      taste: { fizz: 0.8 },
    }
    const reply = formatRecommendationReply(createRecommendationDecision(cocktail, state))

    expect(reply).toContain(`「${cocktail.name}」`)
    expect(reply).toContain('탄산감 취향과 가까워요')
    expect(reply).toContain('눈치가 빠르죠')
    expect(reply).not.toContain(cocktail.description)
  })

  it('uses distinct copy for a random recommendation', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const reply = formatRandomRecommendationReply(cocktail)

    expect(reply).toContain(`「${cocktail.name}」`)
    expect(reply).toContain('선택권은 방금 제게 넘기셨어요')
    expect(reply).not.toContain(cocktail.description)
  })

  it('uses distinct copy for a nearest fallback recommendation', () => {
    const cocktail = getCocktailById('cocktail_classic_028')!
    const reply = formatRecommendationReply(
      createRecommendationDecision(cocktail, createRecommendationState()),
      null,
      'nearest',
    )

    expect(reply).toContain('완전히 같은 잔은 없어서')
    expect(reply).toContain('몇 조건은 살짝 양보')
    expect(reply).not.toContain('눈치가 빠르죠')
  })
})
