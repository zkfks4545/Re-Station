import { describe, expect, it } from 'vitest'
import { getAllCocktailData } from '../cocktails/database.js'
import {
  formatWelcomeDrinkFeedbackReply,
  formatWelcomeDrinkReply,
  selectWelcomeDrink,
  WELCOME_DRINK_FEEDBACK_QUESTION,
} from './welcome-drink.js'

describe('welcome drink selection', () => {
  it('selects an approachable classic cocktail', () => {
    const cocktail = selectWelcomeDrink()

    expect(cocktail.type).toBe('CLASSIC')
    expect(cocktail.features.alcohol_strength).toBeLessThanOrEqual(0.65)
    expect(cocktail.features.sweetness).toBeLessThanOrEqual(0.75)
  })

  it('falls back to available cocktails when the ideal pool is empty', () => {
    const [strongCocktail] = getAllCocktailData()
    const cocktail = selectWelcomeDrink([{
      ...strongCocktail,
      type: 'SIGNATURE',
      features: {
        ...strongCocktail.features,
        alcohol_strength: 0.95,
        sweetness: 0.9,
      },
    }])

    expect(cocktail.id).toBe(strongCocktail.id)
  })

  it('formats a welcome-drink reply without starting the recommendation survey', () => {
    const cocktail = selectWelcomeDrink()
    const reply = formatWelcomeDrinkReply(cocktail)

    expect(reply).toContain('웰컴드링크')
    expect(reply).toContain(cocktail.name_ko ?? cocktail.name)
    expect(reply).not.toContain('선택해 주세요')
  })

  it('defines a one-step welcome drink feedback question', () => {
    expect(WELCOME_DRINK_FEEDBACK_QUESTION.id).toBe('welcome-drink-feedback')
    expect(WELCOME_DRINK_FEEDBACK_QUESTION.prompt).toContain('괜찮')
    expect(WELCOME_DRINK_FEEDBACK_QUESTION.choices).toHaveLength(4)
    expect(WELCOME_DRINK_FEEDBACK_QUESTION.choices.every((choice) => choice.finishRecommendation)).toBe(true)
  })

  it('formats welcome drink feedback replies from buttons or free text', () => {
    const lighter = formatWelcomeDrinkFeedbackReply('조금 더 가볍게')
    expect(lighter.text).toContain('가볍')
    expect(lighter.expression).toBe('embarrassed')

    const positive = formatWelcomeDrinkFeedbackReply('맛있고 괜찮았어')
    expect(positive.text).toContain('밸런스')
    expect(positive.expression).toBe('smirk')

    const sweeter = formatWelcomeDrinkFeedbackReply('더 달았으면 좋겠어')
    expect(sweeter.text).toContain('단맛')
    expect(sweeter.expression).toBe('embarrassed')
  })
})
