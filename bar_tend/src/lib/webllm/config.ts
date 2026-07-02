export const WEB_LLM_DEFAULT_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'

export interface WebLLMFeatureFlags {
  preloadEnabled: boolean
  responseEnabled: boolean
}

export interface WebLLMRuntimeConfig {
  model: string
  temperature: number
  maxTokens: number
  timeoutMs: number
  maximumHistoryMessages: number
  minimumDeviceMemoryGb: number
  minimumHardwareConcurrency: number
  maximumConsecutiveFailures: number
}

export const WEB_LLM_RUNTIME_CONFIG: WebLLMRuntimeConfig = {
  model: WEB_LLM_DEFAULT_MODEL,
  temperature: 0.35,
  maxTokens: 96,
  timeoutMs: 4_000,
  maximumHistoryMessages: 4,
  minimumDeviceMemoryGb: 4,
  minimumHardwareConcurrency: 4,
  maximumConsecutiveFailures: 2,
}

export function readWebLLMFeatureFlags(
  env: Record<string, unknown> = import.meta.env,
): WebLLMFeatureFlags {
  return {
    preloadEnabled: env.VITE_WEB_LLM_PRELOAD_ENABLED !== 'false',
    responseEnabled: env.VITE_WEB_LLM_RESPONSE_ENABLED === 'true',
  }
}
