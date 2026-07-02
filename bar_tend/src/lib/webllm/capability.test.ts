import { describe, expect, it } from 'vitest'
import { checkWebLLMCapability } from './capability.js'

const capableNavigator = {
  gpu: {},
  deviceMemory: 8,
  hardwareConcurrency: 8,
  userAgent: 'Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36',
}

describe('WebLLM 브라우저 capability 검사', () => {
  it('지원 브라우저와 충분한 장치 조건을 통과시킨다', () => {
    expect(checkWebLLMCapability({
      navigator: capableNavigator,
      isSecureContext: true,
    })).toEqual({ supported: true })
  })

  it('WebGPU가 없으면 조용히 건너뛴다', () => {
    expect(checkWebLLMCapability({
      navigator: { ...capableNavigator, gpu: undefined },
      isSecureContext: true,
    })).toEqual({ supported: false, reason: 'webgpu-unavailable' })
  })

  it('지원하지 않는 브라우저를 건너뛴다', () => {
    expect(checkWebLLMCapability({
      navigator: { ...capableNavigator, userAgent: 'Mozilla/5.0 Firefox/140.0' },
      isSecureContext: true,
    })).toEqual({ supported: false, reason: 'unsupported-browser' })
  })

  it('보안 컨텍스트와 최소 장치 메모리를 확인한다', () => {
    expect(checkWebLLMCapability({
      navigator: capableNavigator,
      isSecureContext: false,
    }).reason).toBe('insecure-context')
    expect(checkWebLLMCapability({
      navigator: { ...capableNavigator, deviceMemory: 2 },
      isSecureContext: true,
    }).reason).toBe('insufficient-memory')
  })
})
