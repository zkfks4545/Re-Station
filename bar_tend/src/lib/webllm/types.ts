import type { Message } from '../../types.js'
import type { WebLLMSkipReason } from './capability.js'

export type WebLLMStatus = 'idle' | 'preparing' | 'ready' | 'generating' | 'unavailable' | 'disabled'

export interface WebLLMMetadata {
  provider: 'webllm'
  status: WebLLMStatus
  model: string
  elapsedMs: number
  errorReason?: string
  validationWarnings: string[]
  prepared: boolean
  enabled: boolean
  generationSkippedReason?: WebLLMSkipReason
}

export const SEMANTIC_TOPICS = [
  'work', 'music', 'travel', 'nostalgia', 'daily-life', 'relationship', 'rest', 'weather',
] as const
export type SemanticTopic = typeof SEMANTIC_TOPICS[number]

export const CONVERSATION_STANCES = ['neutral', 'playful', 'curious', 'quiet', 'observant'] as const
export type ConversationStance = typeof CONVERSATION_STANCES[number]

export const RESPONSE_BLOCK_SUGGESTIONS = [
  'reaction', 'metaphor', 'joke', 'idiom', 'transition', 'closing',
] as const
export type ResponseBlockSuggestion = typeof RESPONSE_BLOCK_SUGGESTIONS[number]

export const SESSION_TAGS = [
  'burnout', 'music', 'work', 'travel', 'nostalgia', 'energetic', 'quiet',
] as const
export type SemanticSessionTag = typeof SESSION_TAGS[number]

export const RAPPORT_HINTS = ['neutral', 'warmer', 'reserved'] as const
export type RapportHint = typeof RAPPORT_HINTS[number]

export interface WebLLMSemanticRequest {
  input: string
  route: string
  speaker?: 'karua'
  history?: Message[]
}

export interface WebLLMSemanticAnalysis {
  topic?: SemanticTopic
  stance?: ConversationStance
  responseBlocks: ResponseBlockSuggestion[]
  rapportHint?: RapportHint
  sessionTags: SemanticSessionTag[]
  confidence: number
}

export type WebLLMSemanticSnapshot = WebLLMSemanticAnalysis

export interface WebLLMSemanticResult {
  analysis: WebLLMSemanticSnapshot | null
  usedWebLLM: boolean
  metadata: WebLLMMetadata
}

export interface WebLLMStatistics {
  attempts: number
  successes: number
  skips: number
  failures: number
  byReason: Partial<Record<WebLLMSkipReason, number>>
}

export interface WebLLMEngine {
  complete(prompt: string, signal: AbortSignal): Promise<string>
  interrupt(): void
  unload(): Promise<void>
}

export type WebLLMEngineFactory = (
  model: string,
  onProgress?: (progress: number, text: string) => void,
) => Promise<WebLLMEngine>
