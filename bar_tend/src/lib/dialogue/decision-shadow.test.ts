import { describe, expect, it } from 'vitest'
import { cocktails, publicCocktails } from '../cocktails/index.js'
import { IntentClassifier, type DialogueContext } from '../bartender/intent-classifier.js'
import {
  RECOMMENDATION_QUESTIONS,
  pickFromPool,
  selectNextQuestion,
} from '../recommendation/question-engine.js'
import {
  applyRecommendationSignals,
  createRecommendationState,
  extractRecommendationSignals,
  resolveCocktailsByRecommendationState,
} from '../recommendation/state.js'
import {
  createDialogueSessionState,
  dialogueSessionReducer,
} from '../session/dialogue-session.js'
import type { DialogueAction } from './action-resolver.js'
import {
  deriveRecommendationStateFromEvidence,
  dialogueActionKey,
  evaluateLegacyCocktailSelection,
  evaluateLegacyDialogueAction,
  evaluateLegacyQuestionSelection,
  planShadowDialogueMove,
  recordPreferenceEvidence,
  selectDeterministically,
  type DialogueEvaluation,
  type PreferenceEvidence,
} from './decision-shadow.js'
import {
  createShadowUnderstanding,
  type PreferenceSignal,
  type TurnInput,
} from './input-understanding.js'

const classifier = new IntentClassifier(cocktails)
const dialogueContext: DialogueContext = {
  mentionedCocktails: [],
  sessionPhase: 'conversation',
}

function turnInput(text: string, recommendationActive = false): TurnInput {
  return {
    text,
    context: {
      topic: recommendationActive ? 'recommendation' : 'none',
      affect: 'neutral',
      subject: recommendationActive
        ? { type: 'recommendation', id: null }
        : { type: 'none', id: null },
      pendingQuestion: null,
      recommendationActive,
      safetyLocked: false,
    },
  }
}

function understand(text: string, recommendationActive = false) {
  const input = turnInput(text, recommendationActive)
  const classified = classifier.classify(text, {
    ...dialogueContext,
    activeRecommendationSession: recommendationActive,
  })
  return createShadowUnderstanding(input, classified)
}

function preferenceSignal(
  field: PreferenceSignal['field'],
  value: PreferenceSignal['value'],
  text: string,
): PreferenceSignal {
  return {
    field,
    value,
    confidence: 0.8,
    source: 'rule',
    evidence: [{ start: 0, end: text.length, text }],
  }
}

describe('Evaluate and Select shadow contracts', () => {
  it('selects equal scores by stable candidate id without mutating evaluations', () => {
    const evaluations: readonly DialogueEvaluation[] = Object.freeze([
      {
        candidate: { type: 'respond' }, candidateId: 'b', eligible: true, score: 1,
        hardConstraints: [], contributions: [{ code: 'fixture', score: 1 }],
      },
      {
        candidate: { type: 'respond' }, candidateId: 'a', eligible: true, score: 1,
        hardConstraints: [], contributions: [{ code: 'fixture', score: 1 }],
      },
    ])
    const before = JSON.stringify(evaluations)

    expect(selectDeterministically(evaluations).selected?.candidateId).toBe('a')
    expect(JSON.stringify(evaluations)).toBe(before)
  })

  it('never selects a hard-constrained candidate even with a higher score', () => {
    const evaluations: DialogueEvaluation[] = [
      {
        candidate: { type: 'respond' }, candidateId: 'blocked', eligible: true, score: 100,
        hardConstraints: ['safety'], contributions: [{ code: 'fixture', score: 100 }],
      },
      {
        candidate: { type: 'respond' }, candidateId: 'allowed', eligible: true, score: 1,
        hardConstraints: [], contributions: [{ code: 'fixture', score: 1 }],
      },
    ]

    expect(selectDeterministically(evaluations).selected?.candidateId).toBe('allowed')
  })

  it('matches the current preference recommendation while remaining non-consuming', () => {
    const state = applyRecommendationSignals(
      createRecommendationState(),
      extractRecommendationSignals('달콤한 럼 베이스로 추천해줘'),
    )
    const before = JSON.stringify(state)
    const resolved = resolveCocktailsByRecommendationState(publicCocktails, state).cocktails
    const legacy = pickFromPool(resolved, state.taste)
    const shadow = selectDeterministically(evaluateLegacyCocktailSelection(publicCocktails, state))

    expect(shadow.selected?.candidate.id).toBe(legacy?.id)
    expect(JSON.stringify(state)).toBe(before)
  })

  it('matches the current next-question result', () => {
    const state = createRecommendationState()
    const legacy = selectNextQuestion(publicCocktails, state)
    const shadow = selectDeterministically(
      evaluateLegacyQuestionSelection(publicCocktails, state, RECOMMENDATION_QUESTIONS),
    )

    expect(shadow.selected?.candidate.id).toBe(legacy?.id)
  })

  it('represents a session-blocked legacy action as ineligible', () => {
    const action = { type: 'recommend', mode: 'preference' } as const
    const evaluation = evaluateLegacyDialogueAction(action, true)

    expect(evaluation).toMatchObject({
      candidateId: 'recommend:preference', eligible: false, hardConstraints: ['session-blocked'],
    })
    expect(selectDeterministically([evaluation]).selected).toBeNull()
  })
})

describe('PreferenceEvidence ledger', () => {
  it('projects general, session, and entity-specific evidence by scope without mutation', () => {
    const base = createRecommendationState()
    const baseBefore = JSON.stringify(base)
    let ledger: PreferenceEvidence[] = []
    ledger = recordPreferenceEvidence(
      ledger,
      [preferenceSignal('taste.sweetness', 0.8, '달콤한 게 좋아')],
      { strength: 0.8, scope: { type: 'general' }, observedAtTurn: 1 },
    )
    ledger = recordPreferenceEvidence(
      ledger,
      [preferenceSignal('alcoholPreference', 'high', '오늘은 독한 게 당겨')],
      { strength: 0.9, scope: { type: 'session' }, observedAtTurn: 2 },
    )
    ledger = recordPreferenceEvidence(
      ledger,
      [preferenceSignal('taste.fizz', 0.1, '모히토는 탄산이 적었으면 해')],
      { strength: 0.7, scope: { type: 'entity', entityId: 'mojito' }, observedAtTurn: 3 },
    )
    const ledgerBefore = JSON.stringify(ledger)

    const general = deriveRecommendationStateFromEvidence(base, ledger, { includeSession: false })
    const session = deriveRecommendationStateFromEvidence(base, ledger, { includeSession: true })
    const entity = deriveRecommendationStateFromEvidence(base, ledger, {
      includeSession: true,
      entityId: 'mojito',
    })

    expect(general.taste).toEqual({ sweetness: 0.8 })
    expect(general.alcoholPreference).toBe('any')
    expect(session.alcoholPreference).toBe('high')
    expect(session.taste.fizz).toBeUndefined()
    expect(entity.taste.fizz).toBe(0.1)
    expect(JSON.stringify(base)).toBe(baseBefore)
    expect(JSON.stringify(ledger)).toBe(ledgerBefore)
  })

  it('prefers applicable specific evidence while retaining source evidence', () => {
    const text = '탄산은 별로지만 사이다는 좋아해'
    let ledger = recordPreferenceEvidence(
      [],
      [preferenceSignal('taste.fizz', 0.8, '평소엔 탄산이 좋아')],
      { strength: 1, scope: { type: 'general' }, observedAtTurn: 1 },
    )
    ledger = recordPreferenceEvidence(
      ledger,
      [preferenceSignal('taste.fizz', 0.1, text)],
      { strength: 0.7, scope: { type: 'session' }, observedAtTurn: 2 },
    )

    const result = deriveRecommendationStateFromEvidence(
      createRecommendationState(),
      ledger,
      { includeSession: true },
    )

    expect(result.taste.fizz).toBe(0.1)
    expect(ledger[1].evidence[0].text).toBe(text)
  })
})

describe('DialogueMove shadow plan', () => {
  it.each([
    [{ type: 'respond' }],
    [{ type: 'recommend', mode: 'preference' }],
    [{ type: 'recommend', mode: 'random' }],
    [{ type: 'order', cocktailId: 'mojito' }],
    [{ type: 'loreBasedOrder', cocktailId: 'vesper' }],
    [{ type: 'continueStory', topic: 'story', cocktailId: 'mojito' }],
    [{ type: 'discuss', cocktailId: 'mojito' }],
  ] as const)('preserves legacy action identity for %j', (action) => {
    const move = planShadowDialogueMove(action as DialogueAction, understand('오늘은 조용하네요'))

    expect(dialogueActionKey(move.action)).toBe(dialogueActionKey(action as DialogueAction))
  })

  it('creates safety transition without applying it', () => {
    const state = createDialogueSessionState('conversation')
    const before = JSON.stringify(state)
    const move = planShadowDialogueMove({ type: 'respond' }, understand('죽고 싶어'))

    expect(move).toMatchObject({ type: 'safety', transitions: [{ type: 'lock-safety' }] })
    expect(JSON.stringify(state)).toBe(before)
    expect(dialogueSessionReducer(state, move.transitions[0])).toMatchObject({
      phase: 'safetyLocked', safetyLocked: true,
    })
  })

  it('plans recommendation cancellation as a conversation-mode transition', () => {
    const move = planShadowDialogueMove(
      { type: 'respond' },
      understand('추천 취소', true),
    )

    expect(move).toMatchObject({
      type: 'cancel-recommendation',
      transitions: [{ type: 'set-mode', mode: 'conversation' }],
    })
  })
})
