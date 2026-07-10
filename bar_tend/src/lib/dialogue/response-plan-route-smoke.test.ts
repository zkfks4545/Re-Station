import { describe, expect, it } from 'vitest'
import { getCocktailResponse } from '../bartender/engine.js'
import { IntentClassifier, type DialogueContext, type IntentType } from '../bartender/intent-classifier.js'
import { cocktails } from '../cocktails/database.js'

const classifier = new IntentClassifier(cocktails)
const baseContext: DialogueContext = {
  mentionedCocktails: [],
  sessionPhase: 'conversation',
}

const smokeCases = [
  {
    label: 'bar-setting',
    input: '\uC5EC\uAE30 \uBB50\uD558\uB294 \uACF3\uC774\uC5D0\uC694?',
    intent: 'bar-setting',
  },
  {
    label: 'siesta-setting',
    input: '\uC2DC\uC5D0\uC2A4\uD0C0\uB294 \uB204\uAD6C\uC608\uC694?',
    intent: 'siesta-setting',
  },
  {
    label: 'water-request',
    input: '\uBB3C \uD55C \uC794 \uC8FC\uC138\uC694',
    intent: 'water-request',
  },
  {
    label: 'overdrunk',
    input: '\uB098 \uB108\uBB34 \uCDE8\uD588\uC5B4',
    intent: 'overdrunk',
  },
  {
    label: 'ingredient-constraint',
    input: '\uC54C\uB808\uB974\uAE30 \uC788\uC5B4\uC11C \uACAC\uACFC\uB958 \uBE7C\uACE0',
    intent: 'ingredient-constraint',
  },
  {
    label: 'real-world-info',
    input: '\uC608\uC57D\uC774\uB791 \uACB0\uC81C\uB294 \uC5B4\uB5BB\uAC8C \uD574?',
    intent: 'real-world-info',
  },
  {
    label: 'rude-annoyed',
    input: '\uC9DC\uC99D\uB098',
    intent: 'rude-talk',
    expression: 'annoyed',
  },
  {
    label: 'rude-boundary',
    input: '\uB2F9\uC7A5 \uAC00\uC838\uC640',
    intent: 'rude-talk',
    expression: 'stern',
  },
  {
    label: 'mood-tired',
    input: '\uC624\uB298 \uB108\uBB34 \uD53C\uACE4\uD558\uACE0 \uC9C0\uCCE4\uC5B4',
    intent: 'mood-talk',
    expression: 'sympathy',
  },
  {
    label: 'mood-sad',
    input: '\uC624\uB298 \uB108\uBB34 \uC6B0\uC6B8\uD574',
    intent: 'mood-talk',
    expression: 'sympathy',
  },
  {
    label: 'mood-happy',
    input: '\uC624\uB298 \uC9C4\uC9DC \uD589\uBCF5\uD574',
    intent: 'mood-talk',
    expression: 'smirk',
  },
  {
    label: 'bar-atmosphere',
    input: '\uC5EC\uAE30 \uBD84\uC704\uAE30 \uC88B\uB2E4',
    intent: 'bar-atmosphere',
  },
  {
    label: 'small-talk-weather',
    input: '\uBC16\uC5D0 \uBE44\uAC00 \uC624\uB124',
    intent: 'weather-talk',
  },
  {
    label: 'guest-uncertain',
    input: '\uBB50 \uB9C8\uC2E4\uC9C0 \uBAA8\uB974\uACA0\uACE0 \uADF8\uB0E5 \uC654\uC5B4',
    intent: 'uncertain-talk',
  },
  {
    label: 'quiet-moment',
    input: '\uC624\uB298\uC740 \uD63C\uC790 \uC870\uC6A9\uD788 \uC26C\uACE0 \uC2F6\uC5B4',
    intent: 'quiet-talk',
  },
] satisfies readonly {
  label: string
  input: string
  intent: IntentType
  expression?: string
}[]

describe('Phase 11 ResponsePlan route smoke', () => {
  it.each(smokeCases)('routes and renders $label without deleting JSON fallbacks', ({ input, intent, expression }) => {
    const classified = classifier.classify(input, baseContext)
    const response = getCocktailResponse(input, [])

    expect(classified.intent).toBe(intent)
    expect(response.response.trim().length).toBeGreaterThan(0)
    expect(response.expression).toBeTruthy()
    if (expression) expect(response.expression).toBe(expression)
  })
})
