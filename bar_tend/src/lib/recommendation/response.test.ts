import { describe, expect, it } from 'vitest'
import { findCocktailByName, getCocktailById } from '../cocktails/database.js'
import { createRecommendationDecision, createRecommendationState } from './state.js'
import {
  formatExplicitCocktailReply,
  formatExactRecommendationResponse,
  formatLoreBasedOrderReply,
  formatRandomRecommendationReply,
  formatRandomRecommendationResponse,
  formatRecommendationReply,
  formatSecretMenuOrderReply,
  selectShortCocktailStory,
  selectCocktailTalkingPoint,
  selectRecommendationOpening,
} from './response.js'

describe('neutral recommendation dialogue copy', () => {
  it('formats a lore match as an order instead of an information-only reply', () => {
    const cocktail = findCocktailByName('모히토')!
    const reply = formatLoreBasedOrderReply(cocktail)

    expect(reply).toContain(cocktail.name)
    expect(reply).toContain('준비할게요')
    expect(reply).toContain(selectShortCocktailStory(cocktail))
    expect(reply).not.toContain('자세한 정보')
  })

  it('serves an explicit cocktail with one short story fragment', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const reply = formatExplicitCocktailReply(cocktail)

    expect(reply).toContain('바로 준비할게요')
    expect(reply).toContain(selectShortCocktailStory(cocktail))
    expect(reply.split('\n')).toHaveLength(2)
    expect(reply).not.toContain('찾으시는군요')
    expect(reply).not.toContain('자세한 정보')
    expect(reply).not.toContain(cocktail.description)
  })

  it('uses a noticed reaction and only one story fragment for secret orders', () => {
    const pukey = getCocktailById('cocktail_signature_042')!
    const glitchRain = getCocktailById('cocktail_signature_043')!
    const pukeyReply = formatSecretMenuOrderReply(pukey)
    const glitchReply = formatSecretMenuOrderReply(glitchRain)

    expect(pukeyReply).toContain('암구호를 아시네요')
    expect(pukeyReply).toContain(selectShortCocktailStory(pukey))
    expect(glitchReply).toContain('오랜만에 듣네요')
    expect(glitchReply).toContain(selectShortCocktailStory(glitchRain))
    expect(pukey.talkingPoints?.filter((point) => pukeyReply.includes(point))).toHaveLength(1)
    expect(glitchRain.talkingPoints?.filter((point) => glitchReply.includes(point))).toHaveLength(1)
    expect(pukey.talkingPoints?.some((point) => glitchReply.includes(point))).toBe(false)
    expect(glitchRain.talkingPoints?.some((point) => pukeyReply.includes(point))).toBe(false)
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

  it('keeps randomPick ResponsePlan text and playful expression equal to the legacy formatter', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const opening = '이번에는 제가 하나 골라봤어요.'
    const talkingPoint = selectCocktailTalkingPoint(cocktail)
    const formatted = formatRandomRecommendationResponse(cocktail, opening)

    expect(formatted).toEqual({
      text: `${opening}\n「${cocktail.name}」은 어떠세요?\n${talkingPoint}`,
      expression: 'smirk',
    })
  })

  it('falls back to the legacy random formatter when no ResponsePlan is available', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const opening = '이번에는 제가 하나 골라봤어요.'

    expect(formatRandomRecommendationResponse(cocktail, opening, { plans: [] })).toEqual({
      text: `${opening}\n「${cocktail.name}」은 어떠세요?\n${selectCocktailTalkingPoint(cocktail)}`,
      expression: 'smirk',
    })
  })

  it('falls back to the legacy random formatter when the plan uses a forbidden slot', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const opening = '이번에는 제가 하나 골라봤어요.'

    expect(formatRandomRecommendationResponse(cocktail, opening, {
      plans: [{
        id: 'invalid.random-pick-body',
        speaker: 'karua',
        intent: 'recommend',
        request: 'random-pick-body',
        blocks: { answer: [{ text: '{opening}\n{cocktail_name}', expression: 'smirk' }] },
        fallbackText: '{cocktail_name}',
      }],
    })).toEqual({
      text: `${opening}\n「${cocktail.name}」은 어떠세요?\n${selectCocktailTalkingPoint(cocktail)}`,
      expression: 'smirk',
    })
  })

  it.each([
    ['neutral', 'smirk'],
    ['warm', 'smirk'],
    ['curious', 'thinking'],
    ['confident', 'smirk'],
    ['playful', 'smirk'],
    ['concerned', 'sympathy'],
    ['awkward', 'thinking'],
    ['tired', 'sympathy'],
  ] as const)('keeps %s exact recommendation text/expression equal to legacy', (affectState, expression) => {
    const cocktail = getCocktailById('cocktail_classic_008')!
    const decision = createRecommendationDecision(cocktail, {
      ...createRecommendationState(),
      taste: { fizz: 0.8 },
    }, {
      route: 'tastePreferenceOrder',
      routeTags: ['taste'],
      dialogueState: 'recommending',
      affectState,
    })

    const legacy = formatExactRecommendationResponse(decision, { plans: [] })
    const migrated = formatExactRecommendationResponse(decision)

    expect(migrated).toEqual(legacy)
    expect(migrated.expression).toBe(expression)
    expect(migrated.text).toContain(cocktail.name)
    expect(migrated.text).toContain('탄산감 취향과 잘 맞아요')
    expect(migrated.text).toContain(selectCocktailTalkingPoint(cocktail))
  })

  it('prioritizes the exact recommendation ResponsePlan over the legacy formatter', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const decision = createRecommendationDecision(cocktail, createRecommendationState())
    const formatted = formatExactRecommendationResponse(decision, {
      plans: [{
        id: 'test.exact-recommendation-body',
        speaker: 'karua',
        intent: 'recommend',
        state: decision.dialogue.affectState,
        request: 'exact-recommendation-body',
        blocks: {
          reaction: [{ text: 'ResponsePlan reaction', expression: 'smirk' }],
          recommend: [{ text: '{cocktail_name}', expression: 'smirk' }],
          explanation: [{ text: '{reason}', expression: 'smirk' }],
          answer: [{ text: '{talking_point}', expression: 'smirk' }],
        },
        fallbackText: 'fallback',
      }],
    })

    expect(formatted.text).toBe([
      'ResponsePlan reaction',
      cocktail.name,
      decision.reasons.find((reason) => reason.code !== 'context')?.detail
        ?? '말씀해 주신 취향을 기준으로 골랐어요.',
      selectCocktailTalkingPoint(cocktail),
    ].join('\n'))
    expect(formatted.expression).toBe('smirk')
  })

  it('falls back to the legacy exact formatter when slot rendering fails', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const decision = createRecommendationDecision(cocktail, createRecommendationState())
    const legacy = formatExactRecommendationResponse(decision, { plans: [] })

    expect(formatExactRecommendationResponse(decision, {
      plans: [{
        id: 'invalid.exact-recommendation-body',
        speaker: 'karua',
        intent: 'recommend',
        state: decision.dialogue.affectState,
        request: 'exact-recommendation-body',
        blocks: {
          reaction: [{ text: '{opening}', expression: 'smirk' }],
          recommend: [{ text: '{cocktail_name}', expression: 'smirk' }],
          explanation: [{ text: '{reason}', expression: 'smirk' }],
          answer: [{ text: '{talking_point}', expression: 'smirk' }],
        },
        fallbackText: 'fallback',
      }],
    })).toEqual(legacy)
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

  it('keeps randomPick opening ranking and recent ID avoidance outside the formatter', () => {
    const cocktail = getCocktailById('cocktail_classic_001')!
    const decision = createRecommendationDecision(cocktail, createRecommendationState(), {
      route: 'randomPick',
      routeTags: ['random'],
      dialogueState: 'serving',
      affectState: 'playful',
    })
    const first = selectRecommendationOpening(decision)
    const second = selectRecommendationOpening(decision, [first.id])

    expect(first.id).toBe('random-pick')
    expect(second.id).toBe('random-counter')
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
