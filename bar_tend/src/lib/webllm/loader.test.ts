import { describe, expect, it, vi } from 'vitest'
import type { WebLLMEngine } from './types.js'
import { ExperimentalWebLLMLoader } from './loader.js'

function fakeEngine(): WebLLMEngine {
  return {
    complete: vi.fn(async () => '카루아 대사입니다.'),
    interrupt: vi.fn(),
    unload: vi.fn(async () => undefined),
  }
}

describe('실험 WebLLM 싱글턴 로더', () => {
  it('PRELOAD 설정이 없으면 기본적으로 모델 준비를 활성화한다', async () => {
    const factory = vi.fn(async () => fakeEngine())
    const loader = new ExperimentalWebLLMLoader({
      engineFactory: factory,
      flags: () => ({ preloadEnabled: true, semanticEnabled: false }),
      capabilityCheck: () => ({ supported: true }),
    })

    const result = await loader.prepare()

    expect(result.prepared).toBe(true)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('PRELOAD 플래그가 꺼져 있으면 엔진을 만들지 않는다', async () => {
    const factory = vi.fn(async () => fakeEngine())
    const loader = new ExperimentalWebLLMLoader({
      engineFactory: factory,
      flags: () => ({ preloadEnabled: false, semanticEnabled: false }),
      capabilityCheck: () => ({ supported: true }),
    })

    const result = await loader.prepare()

    expect(factory).not.toHaveBeenCalled()
    expect(result.generationSkippedReason).toBe('preload-disabled')
  })

  it('PRELOAD만 켜면 의미 분석 활성화 여부와 무관하게 모델을 준비한다', async () => {
    const factory = vi.fn(async () => fakeEngine())
    const loader = new ExperimentalWebLLMLoader({
      engineFactory: factory,
      flags: () => ({ preloadEnabled: true, semanticEnabled: false }),
      capabilityCheck: () => ({ supported: true }),
    })

    const result = await loader.prepare()

    expect(factory).toHaveBeenCalledTimes(1)
    expect(result.prepared).toBe(true)
    expect(result.enabled).toBe(false)
  })

  it('동시에 준비를 요청해도 로더와 다운로드를 하나만 만든다', async () => {
    let resolveEngine!: (engine: WebLLMEngine) => void
    const factory = vi.fn(() => new Promise<WebLLMEngine>((resolve) => { resolveEngine = resolve }))
    const loader = new ExperimentalWebLLMLoader({
      engineFactory: factory,
      flags: () => ({ preloadEnabled: true, semanticEnabled: false }),
      capabilityCheck: () => ({ supported: true }),
    })

    const first = loader.prepare()
    const second = loader.prepare()
    resolveEngine(fakeEngine())
    await Promise.all([first, second])

    expect(first).toBe(second)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('capability 실패 시 세션에서 비활성화하고 자동 재시도하지 않는다', async () => {
    const factory = vi.fn(async () => fakeEngine())
    const loader = new ExperimentalWebLLMLoader({
      engineFactory: factory,
      flags: () => ({ preloadEnabled: true, semanticEnabled: false }),
      capabilityCheck: () => ({ supported: false, reason: 'webgpu-unavailable' }),
    })

    const first = await loader.prepare()
    const second = await loader.prepare()

    expect(first.generationSkippedReason).toBe('webgpu-unavailable')
    expect(second.generationSkippedReason).toBe('session-disabled')
    expect(factory).not.toHaveBeenCalled()
  })

  it('준비 실패 후 같은 세션에서 자동 재시도하지 않는다', async () => {
    const factory = vi.fn(async () => { throw new Error('모델 준비 실패') })
    const loader = new ExperimentalWebLLMLoader({
      engineFactory: factory,
      flags: () => ({ preloadEnabled: true, semanticEnabled: false }),
      capabilityCheck: () => ({ supported: true }),
    })

    const first = await loader.prepare()
    const second = await loader.prepare()

    expect(first.generationSkippedReason).toBe('preparation-failed')
    expect(second.generationSkippedReason).toBe('session-disabled')
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('수동 unload가 모델 인스턴스를 해제한다', async () => {
    const engine = fakeEngine()
    const loader = new ExperimentalWebLLMLoader({
      engineFactory: async () => engine,
      flags: () => ({ preloadEnabled: false, semanticEnabled: false }),
      capabilityCheck: () => ({ supported: true }),
    })
    await loader.prepare({ manual: true })

    await loader.unload()

    expect(engine.unload).toHaveBeenCalledTimes(1)
    expect(loader.isPrepared()).toBe(false)
  })
})
