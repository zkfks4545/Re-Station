import { describe, expect, it } from 'vitest'
import { getCocktailById } from '../cocktails/database.js'
import { createRecommendationDecision, createRecommendationState } from './state.js'
import {
  formatExplicitCocktailReply,
  formatRandomRecommendationReply,
  formatRecommendationReply,
  selectCocktailTalkingPoint,
  selectRecommendationOpening,
} from './response.js'

describe('neutral recommendation dialogue copy', () => {
  it('uses neutral copy for an explicit cocktail without factual card copy', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const reply = formatExplicitCocktailReply(cocktail)

    expect(reply).toContain('찾으시는군요')
    expect(reply).toContain(selectCocktailTalkingPoint(cocktail))
    expect(reply).toContain('자세한 정보도 함께 보여드릴게요')
    expect(reply).not.toMatch(/손님|농담/)
    expect(reply).not.toContain(cocktail.description)
  })

  it('uses structured recommendation reasons without character voice', () => {
    const cocktail = getCocktailById('cocktail_classic_008')!
    const state = {
      ...createRecommendationState(),
      taste: { fizz: 0.8 },
    }
    const reply = formatRecommendationReply(createRecommendationDecision(cocktail, state))

    expect(reply).toContain(cocktail.name)
    expect(reply).toContain('탄산감 취향과 잘 맞아요')
    expect(reply).toContain(selectCocktailTalkingPoint(cocktail))
    expect(reply).not.toMatch(/눈치|농담/)
    expect(reply).not.toContain(cocktail.description)
  })

  it('uses distinct copy for a random recommendation', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const reply = formatRandomRecommendationReply(cocktail)

    expect(reply).toContain(`「${cocktail.name}」`)
    expect(reply).toContain('제가 하나 골라볼게요')
    expect(reply).toContain(selectCocktailTalkingPoint(cocktail))
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
    expect(reply).toContain(selectCocktailTalkingPoint(cocktail))
    expect(reply).toContain('조금 다른 부분이 있을 수 있습니다')
    expect(reply).not.toMatch(/눈치|농담/)
  })

  it('uses route-specific neutral openings for recommendation replies', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const baseState = createRecommendationState()

    const moodReply = formatRecommendationReply(createRecommendationDecision(cocktail, baseState, {
      route: 'moodOrder',
      routeTags: ['mood'],
      dialogueState: 'recommending',
      affectState: 'warm',
    }))
    const ingredientReply = formatRecommendationReply(createRecommendationDecision(cocktail, baseState, {
      route: 'ingredientOrBaseOrder',
      routeTags: ['ingredient'],
      dialogueState: 'recommending',
      affectState: 'warm',
    }))

    expect(moodReply.split('\n')).toHaveLength(4)
    expect(ingredientReply.split('\n')).toHaveLength(4)
    expect(moodReply).toContain(cocktail.name)
    expect(ingredientReply).toContain(cocktail.name)
  })

  it('prioritizes affect-specific mood openings over generic route copy', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const decision = createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'moodOrder',
      routeTags: ['mood', 'situation'],
      dialogueState: 'recommending',
      affectState: 'tired',
    })

    const opening = selectRecommendationOpening(decision)

    expect(opening.id).toBe('mood-tired')
    expect(opening.text).toContain('피곤한 날')
  })

  it('uses awkward and warm mood openings when those affect states are inferred', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const awkward = selectRecommendationOpening(createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'moodOrder',
      routeTags: ['mood'],
      dialogueState: 'recommending',
      affectState: 'awkward',
    }))
    const warm = selectRecommendationOpening(createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'moodOrder',
      routeTags: ['mood'],
      dialogueState: 'recommending',
      affectState: 'warm',
    }))

    expect(awkward.id).toBe('mood-awkward')
    expect(warm.id).toBe('mood-warm')
  })

  it('uses awkward and warm inference openings when no route tag is more specific', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const awkward = selectRecommendationOpening(createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'recommendationInference',
      routeTags: [],
      dialogueState: 'recommending',
      affectState: 'awkward',
    }))
    const warm = selectRecommendationOpening(createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'recommendationInference',
      routeTags: [],
      dialogueState: 'recommending',
      affectState: 'warm',
    }))

    expect(awkward.id).toBe('inference-awkward')
    expect(warm.id).toBe('inference-warm')
  })

  it('prioritizes tag-specific openings for strength and excluded ingredient contexts', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const strengthDecision = createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'tastePreferenceOrder',
      routeTags: ['taste', 'strength'],
      dialogueState: 'recommending',
      affectState: 'warm',
    })
    const excludedDecision = createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'ingredientOrBaseOrder',
      routeTags: ['excluded-ingredient'],
      dialogueState: 'recommending',
      affectState: 'warm',
    })

    expect(selectRecommendationOpening(strengthDecision)).toMatchObject({
      id: 'taste-strength',
    })
    expect(selectRecommendationOpening(excludedDecision)).toMatchObject({
      id: 'ingredient-excluded',
    })
  })

  it('uses dialogue-state and affect matches for direct serving copy', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const decision = createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'directCocktailOrder',
      routeTags: ['direct-name'],
      dialogueState: 'serving',
      affectState: 'confident',
    })

    const opening = selectRecommendationOpening(decision)

    expect(opening.id).toBe('direct-serving')
    expect(opening.text).toContain('바로 찾으신 메뉴')
  })

  it('falls through to the next matching scored opening when the best line is recent', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const decision = createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'moodOrder',
      routeTags: ['mood'],
      dialogueState: 'recommending',
      affectState: 'tired',
    })

    const opening = selectRecommendationOpening(decision, ['mood-tired'])

    expect(opening.id).toBe('mood-context')
  })

  it('skips recently used route opening lines when another line is available', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const decision = createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'tastePreferenceOrder',
      routeTags: ['taste'],
      dialogueState: 'recommending',
      affectState: 'warm',
    })
    const first = selectRecommendationOpening(decision)
    const second = selectRecommendationOpening(decision, [first.id])

    expect(first.id).not.toBe(second.id)
    expect(second.text).toContain('맛의 균형')
  })

  it('falls back to the first line when all route lines are recent', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const decision = createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'tastePreferenceOrder',
      routeTags: ['taste'],
      dialogueState: 'recommending',
      affectState: 'warm',
    })
    const first = selectRecommendationOpening(decision)
    const second = selectRecommendationOpening(decision, [first.id])
    const third = selectRecommendationOpening(decision, [first.id, second.id])

    expect(third.id).toBe(first.id)
  })

  it('uses acknowledgement when provided instead of selecting an opening', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const reply = formatRecommendationReply(
      createRecommendationDecision(cocktail, createRecommendationState()),
      '네, 말씀해 주신 내용도 함께 볼게요.',
    )

    expect(reply).toContain('네, 말씀해 주신 내용도 함께 볼게요.')
    expect(reply).toContain(cocktail.name)
    expect(reply).toContain(selectCocktailTalkingPoint(cocktail))
  })

  it('accepts a custom opening for random recommendation', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const reply = formatRandomRecommendationReply(cocktail, '이번엔 제가 골라봤어요.')

    expect(reply).toContain('이번엔 제가 골라봤어요.')
    expect(reply).toContain(cocktail.name)
    expect(reply).toContain(selectCocktailTalkingPoint(cocktail))
  })

  it('selects a stable talking point from cocktail data', () => {
    const cocktail = getCocktailById('cocktail_classic_043')!
    const first = selectCocktailTalkingPoint(cocktail)
    const second = selectCocktailTalkingPoint(cocktail)

    expect(cocktail.talkingPoints).toContain(first)
    expect(second).toBe(first)
  })
})
