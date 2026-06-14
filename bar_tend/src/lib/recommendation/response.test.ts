import { describe, expect, it } from 'vitest'
import { getCocktailById } from '../cocktails/database.js'
import { createRecommendationDecision, createRecommendationState } from './state.js'
import {
  formatExplicitCocktailReply,
  formatRandomRecommendationReply,
  formatRecommendationReply,
} from './response.js'

describe('neutral recommendation dialogue copy', () => {
  it('uses neutral copy for an explicit cocktail without factual card copy', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const reply = formatExplicitCocktailReply(cocktail)

    expect(reply).toContain('찾으시는군요')
    expect(reply).toContain('자세한 정보도 함께 보여드릴게요')
    expect(reply).not.toMatch(/손님|농담|잔/)
    expect(reply).not.toContain(cocktail.description)
  })

  it('uses structured recommendation reasons without character voice', () => {
    const cocktail = getCocktailById('cocktail_classic_008')!
    const state = {
      ...createRecommendationState(),
      taste: { fizz: 0.8 },
    }
    const reply = formatRecommendationReply(createRecommendationDecision(cocktail, state))

    expect(reply).toContain(`「${cocktail.name}」`)
    expect(reply).toContain('탄산감 취향과 잘 맞아요')
    expect(reply).not.toMatch(/눈치|농담|잔/)
    expect(reply).not.toContain(cocktail.description)
  })

  it('uses distinct copy for a random recommendation', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const reply = formatRandomRecommendationReply(cocktail)

    expect(reply).toContain(`「${cocktail.name}」`)
    expect(reply).toContain('제가 하나 골라볼게요')
    expect(reply).not.toMatch(/선택권|농담/)
    expect(reply).not.toContain(cocktail.description)
  })

  it('uses distinct copy for a nearest fallback recommendation', () => {
    const cocktail = getCocktailById('cocktail_classic_028')!
    const reply = formatRecommendationReply(
      createRecommendationDecision(cocktail, createRecommendationState()),
      null,
      'nearest',
    )

    expect(reply).toContain('완전히 맞는 칵테일은 없어서')
    expect(reply).toContain('조금 다른 부분이 있을 수 있습니다')
    expect(reply).not.toMatch(/눈치|농담|잔/)
  })
})
