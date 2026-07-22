import { describe, expect, it } from 'vitest'
import { cocktails } from '../cocktails/index.js'
import { IntentClassifier, type DialogueContext } from '../bartender/intent-classifier.js'
import {
  FakeSemanticAssistPort,
  NoopSemanticAssistPort,
  createShadowUnderstanding,
  isSemanticAssistEligible,
  validateSemanticAssistProposal,
  type EvidenceSpan,
  type GroundedSignal,
  type TurnInput,
} from './input-understanding.js'

const classifier = new IntentClassifier(cocktails)
const dialogueContext: DialogueContext = {
  mentionedCocktails: [],
  sessionPhase: 'conversation',
}

function turnInput(text: string): TurnInput {
  return {
    text,
    context: {
      topic: 'none',
      affect: 'neutral',
      subject: { type: 'none', id: null },
      pendingQuestion: null,
      recommendationActive: false,
      safetyLocked: false,
    },
  }
}

function understand(text: string) {
  const input = turnInput(text)
  return createShadowUnderstanding(input, classifier.classify(text, dialogueContext))
}

function evidence(text: string, excerpt: string): EvidenceSpan {
  const start = text.indexOf(excerpt)
  return { start, end: start + excerpt.length, text: excerpt }
}

function expectGrounded<T>(input: string, signals: readonly GroundedSignal<T>[]) {
  for (const signal of signals) {
    expect(signal.confidence).toBeGreaterThanOrEqual(0)
    expect(signal.confidence).toBeLessThanOrEqual(1)
    expect(signal.evidence.length).toBeGreaterThan(0)
    for (const span of signal.evidence) {
      expect(input.slice(span.start, span.end)).toBe(span.text)
    }
  }
}

describe('InputUnderstanding shadow contract', () => {
  it.each([
    ['죽고 싶어', 'safety', 'safety', 'safety'],
    ['나갈게', 'exit', 'session', 'exit'],
    ['추천해줘', 'recommendation', 'recommendation', null],
    ['모히토 유래 알려줘', 'story-query', 'story', null],
    ['너는 누구야?', 'character-query', 'character', null],
  ] as const)('shadows legacy fixture %s without consuming it', (text, route, topic, control) => {
    const classified = classifier.classify(text, dialogueContext)
    const before = JSON.stringify(classified)
    const result = createShadowUnderstanding(turnInput(text), classified)

    expect(classified.route.route).toBe(route)
    expect(result.primaryTopic.value).toBe(topic)
    expect(result.controlIntents[0]?.value ?? null).toBe(control)
    expect(JSON.stringify(classified)).toBe(before)
  })

  it('exposes recommendation cancel only in an active recommendation context', () => {
    const text = '추천 취소'
    const classified = classifier.classify(text, {
      ...dialogueContext,
      activeRecommendationSession: true,
    })
    const result = createShadowUnderstanding({
      ...turnInput(text),
      context: { ...turnInput(text).context, recommendationActive: true },
    }, classified)

    expect(classified.route.route).toBe('recommendation-cancel')
    expect(result.primaryTopic.value).toBe('session')
    expect(result.controlIntents.map(({ value }) => value)).toEqual(['cancel-recommendation'])
  })

  it('keeps topic, speech act, preference, and cue as simultaneous signals', () => {
    const text = '오늘은 독한 술이 당기는데, 당신은 누구예요? 와!'
    const result = understand(text)

    expect(result.primaryTopic.value).toBe('character')
    expect(result.speechActs.map(({ value }) => value)).toContain('question')
    expect(result.preferenceSignals).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'taste.alcohol_strength', value: 0.8 }),
      expect.objectContaining({ field: 'alcoholPreference', value: 'high' }),
    ]))
    expect(result.conversationStateCues.map(({ value }) => value)).toContain('exclamation')
  })

  it('extracts an explicit preference while preserving the whole utterance as evidence', () => {
    const text = '탄산은 별로지만 사이다는 좋아해'
    const result = understand(text)
    const fizzSignals = result.preferenceSignals.filter(({ field }) => field === 'taste.fizz')
    const fizz = fizzSignals[fizzSignals.length - 1]

    expect(fizz).toMatchObject({ value: 0.1, confidence: 0.8, source: 'rule' })
    expect(fizz?.evidence).toEqual([{ start: 0, end: text.length, text }])
  })

  it('emits grounded hesitation, complaint, exclamation, and confusion cues', () => {
    const text = '음... 이 설명은 별로고 좀 헷갈리네요!'
    const result = understand(text)

    expect(result.conversationStateCues.map(({ value }) => value)).toEqual([
      'hesitation', 'complaint', 'exclamation', 'confusion',
    ])
    expectGrounded(text, [
      result.primaryTopic,
      ...result.speechActs,
      ...result.preferenceSignals,
      ...result.entities,
      ...result.controlIntents,
      ...result.conversationStateCues,
    ])
  })

  it('allows semantic assist only for low-confidence ungrounded internal results', () => {
    const ambiguous = understand('벽시계가 세 번 울렸네')
    expect(isSemanticAssistEligible(ambiguous)).toBe(true)
    expect(isSemanticAssistEligible(understand('탄산은 별로야'))).toBe(false)
    expect(isSemanticAssistEligible(understand('모히토'))).toBe(false)
    expect(isSemanticAssistEligible(understand('죽고 싶어'))).toBe(false)
  })
})

describe('SemanticAssistProposal boundary', () => {
  const input = turnInput('연기 같은 맛이 당겨')
  const validProposal = {
    candidates: [{
      kind: 'preference',
      field: 'preferredIngredients',
      value: '스모키',
      confidence: 0.72,
      evidence: [evidence(input.text, '연기 같은 맛')],
      source: 'semantic-assist',
    }],
  }

  it('accepts grounded meaning candidates and fake/no-op ports', async () => {
    const fake = new FakeSemanticAssistPort(validProposal)
    const noop = new NoopSemanticAssistPort()
    const proposed = await fake.propose(input)

    expect(validateSemanticAssistProposal(proposed, input)).toBe(true)
    expect(await noop.propose(input)).toBeNull()
  })

  it.each([
    ['top-level state', { ...validProposal, statePatch: { mode: 'recommendation' } }],
    ['control intent', {
      candidates: [{
        kind: 'control-intent', value: 'exit', confidence: 0.9,
        evidence: [evidence(input.text, '당겨')], source: 'semantic-assist',
      }],
    }],
    ['recommendation result', {
      candidates: [{
        ...validProposal.candidates[0], recommendationId: 'cocktail_classic_001',
      }],
    }],
    ['response plan', {
      candidates: [{
        ...validProposal.candidates[0], responsePlanId: 'karua.small-talk.default',
      }],
    }],
    ['invalid span', {
      candidates: [{
        ...validProposal.candidates[0], evidence: [{ start: 0, end: 2, text: '다른' }],
      }],
    }],
  ])('rejects forbidden or ungrounded proposal: %s', (_label, proposal) => {
    expect(validateSemanticAssistProposal(proposal, input)).toBe(false)
  })
})
