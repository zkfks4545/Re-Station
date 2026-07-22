import type { RecommendationSignal } from '../../types/recommendation.js'
import type { ClassifiedIntent, IntentType } from '../bartender/intent-classifier.js'
import {
  detectCharacterPreferenceTopic,
  type CharacterPreferenceTopic,
  type InputRoute,
} from './input-router.js'
import type { ConversationContextSnapshot } from './conversation-context-snapshot.js'
import { extractRecommendationSignals } from '../recommendation/state.js'

export interface TurnInput {
  text: string
  context: Readonly<ConversationContextSnapshot>
}

export interface EvidenceSpan {
  start: number
  end: number
  text: string
}

export type SignalSource = 'rule' | 'semantic-assist'

export interface GroundedSignal<T> {
  value: T
  confidence: number
  evidence: readonly EvidenceSpan[]
  source: SignalSource
}

export type PrimaryTopic =
  | 'safety'
  | 'session'
  | 'recommendation'
  | 'cocktail'
  | 'story'
  | 'character'
  | 'world-building'
  | 'daily-life'
  | 'knowledge'
  | 'smalltalk'

export type SpeechAct =
  | 'safety-disclosure'
  | 'exit'
  | 'cancel'
  | 'order'
  | 'request'
  | 'question'
  | 'answer'
  | 'feedback'
  | 'statement'
  | 'ask-character-preference'

export type ControlIntent = 'safety' | 'exit' | 'cancel-recommendation'

export type ConversationStateCue =
  | 'hesitation'
  | 'joke'
  | 'complaint'
  | 'exclamation'
  | 'confusion'

export type EntityType = 'cocktail' | 'ingredient' | 'base-spirit' | 'unknown-cocktail' | 'character'

export interface PreferenceSignal extends GroundedSignal<RecommendationSignal['value']> {
  field: RecommendationSignal['field']
}

export interface EntitySignal extends GroundedSignal<string> {
  type: EntityType
  id?: string
}

export interface InputUnderstanding {
  primaryTopic: GroundedSignal<PrimaryTopic>
  speechActs: readonly GroundedSignal<SpeechAct>[]
  preferenceSignals: readonly PreferenceSignal[]
  entities: readonly EntitySignal[]
  characterPreferenceTopic: GroundedSignal<CharacterPreferenceTopic> | null
  controlIntents: readonly GroundedSignal<ControlIntent>[]
  conversationStateCues: readonly GroundedSignal<ConversationStateCue>[]
}

export type SemanticCandidate =
  | (GroundedSignal<PrimaryTopic> & { kind: 'primary-topic' })
  | (GroundedSignal<SpeechAct> & { kind: 'speech-act' })
  | (PreferenceSignal & { kind: 'preference' })
  | (EntitySignal & { kind: 'entity' })
  | (GroundedSignal<ConversationStateCue> & { kind: 'conversation-state-cue' })

export interface SemanticAssistProposal {
  candidates: readonly SemanticCandidate[]
}

export interface SemanticAssistPort {
  propose(input: TurnInput): Promise<unknown>
}

export class NoopSemanticAssistPort implements SemanticAssistPort {
  async propose(input: TurnInput): Promise<null> {
    void input
    return null
  }
}

export class FakeSemanticAssistPort implements SemanticAssistPort {
  constructor(private readonly proposal: unknown) {}

  async propose(input: TurnInput): Promise<unknown> {
    void input
    return this.proposal
  }
}

export function createShadowUnderstanding(
  input: TurnInput,
  classified: ClassifiedIntent,
): InputUnderstanding {
  if (!input.text.trim()) throw new Error('TurnInput.text must not be empty')

  const wholeInput = wholeInputEvidence(input.text)
  return {
    primaryTopic: grounded(primaryTopicFor(classified), classified.confidence, wholeInput),
    speechActs: [grounded(speechActFor(input, classified), classified.confidence, wholeInput)],
    preferenceSignals: extractRecommendationSignals(input.text).map((signal) => ({
      field: signal.field,
      value: signal.value,
      confidence: signal.confidence,
      evidence: [wholeInput],
      source: 'rule',
    })),
    entities: entitySignalsFor(input.text, classified),
    characterPreferenceTopic: characterPreferenceTopicFor(input.text, wholeInput),
    controlIntents: controlIntentFor(classified.route.route).map((value) => (
      grounded(value, classified.route.confidence, wholeInput)
    )),
    conversationStateCues: conversationStateCuesFor(input.text),
  }
}

export function isSemanticAssistEligible(understanding: InputUnderstanding): boolean {
  return understanding.controlIntents.length === 0
    && understanding.entities.length === 0
    && understanding.preferenceSignals.length === 0
    && !understanding.speechActs.some(({ value }) => value === 'answer')
    && understanding.primaryTopic.confidence < 0.65
}

export function validateSemanticAssistProposal(
  value: unknown,
  input: TurnInput,
): value is SemanticAssistProposal {
  if (!isRecord(value) || !hasOnlyKeys(value, ['candidates']) || !Array.isArray(value.candidates)) {
    return false
  }
  if (value.candidates.length === 0 || value.candidates.length > 8) return false
  return value.candidates.every((candidate) => validateCandidate(candidate, input.text))
}

const PRIMARY_TOPICS: readonly PrimaryTopic[] = [
  'safety', 'session', 'recommendation', 'cocktail', 'story', 'character',
  'world-building', 'daily-life', 'knowledge', 'smalltalk',
]
const SPEECH_ACTS: readonly SpeechAct[] = [
  'safety-disclosure', 'exit', 'cancel', 'order', 'request', 'question',
  'answer', 'feedback', 'statement',
  'ask-character-preference',
]
const CONVERSATION_STATE_CUES: readonly ConversationStateCue[] = [
  'hesitation', 'joke', 'complaint', 'exclamation', 'confusion',
]
const ENTITY_TYPES: readonly EntityType[] = [
  'cocktail', 'ingredient', 'base-spirit', 'unknown-cocktail', 'character',
]
const PREFERENCE_FIELDS: readonly RecommendationSignal['field'][] = [
  'taste.sweetness', 'taste.alcohol_strength', 'taste.fizz', 'taste.sourness',
  'moods', 'situations', 'alcoholPreference', 'preferredIngredients', 'excludedIngredients',
]

function primaryTopicFor(classified: ClassifiedIntent): PrimaryTopic {
  const route = classified.route.route
  if (route === 'safety') return 'safety'
  if (route === 'exit' || route === 'recommendation-cancel') return 'session'
  if (route === 'recommendation' || route === 'random-recommendation') return 'recommendation'
  if (route === 'story-query' || route === 'lore-query') return 'story'
  if (route === 'character-query') return 'character'
  if (['explicit-cocktail', 'lore-based-order', 'cocktail-mention', 'unknown-cocktail-query', 'cocktail-info-query'].includes(route)) {
    return 'cocktail'
  }

  const intent = classified.intent
  if (intent === 'bar-setting' || intent === 'bar-atmosphere') return 'world-building'
  if (intent === 'siesta-setting' || intent === 'character-query') return 'character'
  if (['story-query', 'lore-query', 'story-query-followup', 'story-query-cocktail-specific', 'lore-followup'].includes(intent)) return 'story'
  if (['mood-talk', 'quiet-talk', 'weather-talk', 'overdrunk'].includes(intent)) return 'daily-life'
  if (intent === 'real-world-info') return 'knowledge'
  if (['cocktail-query', 'recommendation-query', 'random-request'].includes(intent)) return 'recommendation'
  if (['taste-query', 'recipe-query', 'ingredient-constraint', 'order-cocktail', 'order-cocktail-mixed', 'unknown-cocktail-request'].includes(intent)) return 'cocktail'
  return 'smalltalk'
}

function speechActFor(input: TurnInput, classified: ClassifiedIntent): SpeechAct {
  const { text } = input
  const route = classified.route.route
  if (route === 'safety') return 'safety-disclosure'
  if (route === 'exit') return 'exit'
  if (route === 'recommendation-cancel') return 'cancel'
  if (detectCharacterPreferenceTopic(text)) return 'ask-character-preference'
  if (route === 'explicit-cocktail' || route === 'lore-based-order') return 'order'
  if (route === 'recommendation' || route === 'random-recommendation') return 'request'
  if (input.context.pendingQuestion !== null && classified.metadata.answersPendingQuestion) return 'answer'
  if (['cocktail-query', 'recommendation-query', 'random-request'].includes(classified.intent)) return 'request'
  if (['rude-talk'].includes(classified.intent) || /별로|마음에\s*안\s*들|좋았|맛있/.test(text)) return 'feedback'
  if (/[?？]|뭐|누구|어디|왜|어떻게|얼마|무슨/.test(text) || isQueryIntent(classified.intent)) return 'question'
  return 'statement'
}

function isQueryIntent(intent: IntentType): boolean {
  return [
    'cocktail-query', 'story-query', 'lore-query', 'cocktail-info-query',
    'character-query', 'recipe-query', 'taste-query', 'menu-request',
    'recommendation-query', 'real-world-info',
  ].includes(intent)
}

function controlIntentFor(route: InputRoute): ControlIntent[] {
  if (route === 'safety') return ['safety']
  if (route === 'exit') return ['exit']
  if (route === 'recommendation-cancel') return ['cancel-recommendation']
  return []
}

function entitySignalsFor(text: string, classified: ClassifiedIntent): EntitySignal[] {
  const signals: EntitySignal[] = []
  const { entities, route } = classified
  if (detectCharacterPreferenceTopic(text)) {
    signals.push({
      type: 'character',
      id: 'kahlua',
      ...grounded('카루아', classified.confidence, wholeInputEvidence(text)),
    })
  }
  if (entities.cocktailName) {
    signals.push({
      type: 'cocktail',
      id: entities.cocktailId,
      ...grounded(entities.cocktailName, classified.confidence, evidenceFor(text, entities.cocktailName)),
    })
  } else if (route.unknownCocktailName) {
    signals.push({
      type: 'unknown-cocktail',
      ...grounded(route.unknownCocktailName, route.confidence, evidenceFor(text, route.unknownCocktailName)),
    })
  }
  if (entities.baseSpirit) {
    signals.push({
      type: 'base-spirit',
      ...grounded(entities.baseSpirit, classified.confidence, evidenceFor(text, entities.baseSpirit)),
    })
  }
  for (const ingredient of entities.excludedIngredients ?? []) {
    signals.push({
      type: 'ingredient',
      ...grounded(ingredient, classified.confidence, evidenceFor(text, ingredient)),
    })
  }
  return signals
}

function characterPreferenceTopicFor(
  text: string,
  evidence: EvidenceSpan,
): GroundedSignal<CharacterPreferenceTopic> | null {
  const topic = detectCharacterPreferenceTopic(text)
  return topic ? grounded(topic, 0.95, evidence) : null
}

function conversationStateCuesFor(text: string): GroundedSignal<ConversationStateCue>[] {
  const patterns: Array<[ConversationStateCue, RegExp]> = [
    ['hesitation', /모르겠|글쎄|(?:^|\s)음+|망설/],
    ['joke', /농담|ㅋㅋ|ㅎㅎ|하하/],
    ['complaint', /별로|싫|짜증|불만|실망|힘들/],
    ['exclamation', /!|！|대박|와(?:우)?/],
    ['confusion', /무슨\s*말|이해.*안|헷갈|모르겠/],
  ]
  return patterns.flatMap(([cue, pattern]) => {
    const match = pattern.exec(text)
    return match?.[0]
      ? [grounded(cue, 0.8, span(text, match.index, match[0].length))]
      : []
  })
}

function grounded<T>(value: T, confidence: number, evidence: EvidenceSpan): GroundedSignal<T> {
  return { value, confidence, evidence: [evidence], source: 'rule' }
}

function wholeInputEvidence(text: string): EvidenceSpan {
  return span(text, 0, text.length)
}

function evidenceFor(text: string, value: string): EvidenceSpan {
  const start = text.toLowerCase().indexOf(value.toLowerCase())
  return start >= 0 ? span(text, start, value.length) : wholeInputEvidence(text)
}

function span(text: string, start: number, length: number): EvidenceSpan {
  return { start, end: start + length, text: text.slice(start, start + length) }
}

function validateCandidate(value: unknown, input: string): value is SemanticCandidate {
  if (!isRecord(value) || typeof value.kind !== 'string') return false
  const commonValid = typeof value.confidence === 'number'
    && Number.isFinite(value.confidence)
    && value.confidence >= 0
    && value.confidence <= 1
    && Array.isArray(value.evidence)
    && value.evidence.length > 0
    && value.evidence.every((evidence) => validateEvidence(evidence, input))
  if (!commonValid) return false

  if (value.kind === 'primary-topic') {
    return hasOnlyKeys(value, ['kind', 'value', 'confidence', 'evidence', 'source'])
      && isOneOf(value.value, PRIMARY_TOPICS)
      && value.source === 'semantic-assist'
  }
  if (value.kind === 'speech-act') {
    return hasOnlyKeys(value, ['kind', 'value', 'confidence', 'evidence', 'source'])
      && isOneOf(value.value, SPEECH_ACTS)
      && value.source === 'semantic-assist'
  }
  if (value.kind === 'conversation-state-cue') {
    return hasOnlyKeys(value, ['kind', 'value', 'confidence', 'evidence', 'source'])
      && isOneOf(value.value, CONVERSATION_STATE_CUES)
      && value.source === 'semantic-assist'
  }
  if (value.kind === 'preference') {
    return hasOnlyKeys(value, ['kind', 'field', 'value', 'confidence', 'evidence', 'source'])
      && isOneOf(value.field, PREFERENCE_FIELDS)
      && (typeof value.value === 'string' || typeof value.value === 'number')
      && value.source === 'semantic-assist'
  }
  if (value.kind === 'entity') {
    return hasOnlyKeys(value, ['kind', 'type', 'id', 'value', 'confidence', 'evidence', 'source'])
      && isOneOf(value.type, ENTITY_TYPES)
      && typeof value.value === 'string'
      && (value.id === undefined || typeof value.id === 'string')
      && value.source === 'semantic-assist'
  }
  return false
}

function validateEvidence(value: unknown, input: string): value is EvidenceSpan {
  if (!isRecord(value) || !hasOnlyKeys(value, ['start', 'end', 'text'])) return false
  if (!Number.isInteger(value.start) || !Number.isInteger(value.end) || typeof value.text !== 'string') return false
  const start = value.start as number
  const end = value.end as number
  return start >= 0 && end > start && end <= input.length && input.slice(start, end) === value.text
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key))
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}
