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

export interface WebLLMPolishRequest {
  input: string
  route: string
  speaker?: 'karua'
  fallbackResponse: string
  history?: Message[]
  reactionKind?: 'simple' | 'light-small-talk'
}

export interface WebLLMPolishResult {
  response: string
  usedWebLLM: boolean
  metadata: WebLLMMetadata
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
