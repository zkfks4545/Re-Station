import { describe, expect, it } from 'vitest'
import { readWebLLMFeatureFlags } from './config.js'

describe('WebLLM 기능 플래그 기본값', () => {
  it('PRELOAD는 기본 ON, RESPONSE는 기본 OFF다', () => {
    expect(readWebLLMFeatureFlags({})).toEqual({
      preloadEnabled: true,
      responseEnabled: false,
    })
  })

  it('PRELOAD는 명시적으로 false일 때만 비활성화한다', () => {
    expect(readWebLLMFeatureFlags({ VITE_WEB_LLM_PRELOAD_ENABLED: 'false' }).preloadEnabled).toBe(false)
  })
})
