import { describe, expect, it, vi } from 'vitest'
import { ExperimentalWebLLMLoader } from './loader.js'
import { ExperimentalWebLLMService } from './service.js'
import type { WebLLMEngine } from './types.js'

const fallbackResponse = '규칙 기반 응답입니다.'

function request(overrides: Partial<Parameters<ExperimentalWebLLMService['polish']>[0]> = {}) {
  return {
    input: '오늘은 그냥 얘기나 할래요.',
    route: 'general-chat',
    fallbackResponse,
    ...overrides,
  }
}

async function preparedLoader(engine: WebLLMEngine): Promise<ExperimentalWebLLMLoader> {
  const loader = new ExperimentalWebLLMLoader({
    engineFactory: async () => engine,
    flags: () => ({ preloadEnabled: true, responseEnabled: true }),
    capabilityCheck: () => ({ supported: true }),
  })
  await loader.prepare()
  return loader
}

describe('실험 WebLLM 응답 서비스', () => {
  it('RESPONSE 플래그 OFF에서 기존 응답을 그대로 반환하고 생성을 호출하지 않는다', async () => {
    const engine: WebLLMEngine = {
      complete: vi.fn(async () => '호출되면 안 됩니다.'),
      interrupt: vi.fn(),
      unload: vi.fn(async () => undefined),
    }
    const loader = await preparedLoader(engine)
    const service = new ExperimentalWebLLMService({
      loader,
      flags: () => ({ preloadEnabled: true, responseEnabled: false }),
    })

    const result = await service.polish(request())

    expect(result.response).toBe(fallbackResponse)
    expect(result.usedWebLLM).toBe(false)
    expect(result.metadata.generationSkippedReason).toBe('response-disabled')
    expect(engine.complete).not.toHaveBeenCalled()
  })

  it('허용되지 않은 경로에서는 RESPONSE가 켜져도 생성하지 않는다', async () => {
    const engine: WebLLMEngine = {
      complete: vi.fn(async () => '호출되면 안 됩니다.'),
      interrupt: vi.fn(),
      unload: vi.fn(async () => undefined),
    }
    const loader = await preparedLoader(engine)
    const service = new ExperimentalWebLLMService({
      loader,
      flags: () => ({ preloadEnabled: true, responseEnabled: true }),
    })

    const result = await service.polish(request({ route: 'safety-alert' }))

    expect(result.response).toBe(fallbackResponse)
    expect(result.metadata.generationSkippedReason).toBe('ineligible-route')
    expect(engine.complete).not.toHaveBeenCalled()
  })

  it.each(['safety-alert', 'order-cocktail', 'farewell', 'lore-query', 'recipe-query'])(
    '금지 경로 %s는 reaction 표식으로 우회할 수 없다',
    async (route) => {
      const engine: WebLLMEngine = {
        complete: vi.fn(async () => '호출되면 안 됩니다.'),
        interrupt: vi.fn(),
        unload: vi.fn(async () => undefined),
      }
      const loader = await preparedLoader(engine)
      const service = new ExperimentalWebLLMService({
        loader,
        flags: () => ({ preloadEnabled: true, responseEnabled: true }),
      })

      const result = await service.polish(request({ route, reactionKind: 'simple' }))

      expect(result.metadata.generationSkippedReason).toBe('ineligible-route')
      expect(engine.complete).not.toHaveBeenCalled()
    },
  )

  it('제한 시간 초과 시 즉시 규칙 기반 응답으로 복구한다', async () => {
    const engine: WebLLMEngine = {
      complete: vi.fn(() => new Promise<string>(() => undefined)),
      interrupt: vi.fn(),
      unload: vi.fn(async () => undefined),
    }
    const loader = await preparedLoader(engine)
    const service = new ExperimentalWebLLMService({
      loader,
      flags: () => ({ preloadEnabled: true, responseEnabled: true }),
      timeoutMs: 5,
    })

    const result = await service.polish(request())

    expect(result.response).toBe(fallbackResponse)
    expect(result.metadata.generationSkippedReason).toBe('timeout')
    expect(engine.interrupt).toHaveBeenCalled()
  })

  it('검증 실패 응답을 폐기하고 경고를 기록한다', async () => {
    const engine: WebLLMEngine = {
      complete: vi.fn(async () => '**제가 도와드릴게요.**'),
      interrupt: vi.fn(),
      unload: vi.fn(async () => undefined),
    }
    const loader = await preparedLoader(engine)
    const service = new ExperimentalWebLLMService({
      loader,
      flags: () => ({ preloadEnabled: true, responseEnabled: true }),
    })

    const result = await service.polish(request())

    expect(result.response).toBe(fallbackResponse)
    expect(result.metadata.generationSkippedReason).toBe('validation-failed')
    expect(result.metadata.validationWarnings.length).toBeGreaterThan(0)
  })

  it('검증을 통과한 짧은 한국어 응답만 사용한다', async () => {
    const engine: WebLLMEngine = {
      complete: vi.fn(async () => '오늘은 이야기가 먼저 잔을 잡았네요.'),
      interrupt: vi.fn(),
      unload: vi.fn(async () => undefined),
    }
    const loader = await preparedLoader(engine)
    const service = new ExperimentalWebLLMService({
      loader,
      flags: () => ({ preloadEnabled: true, responseEnabled: true }),
    })

    const result = await service.polish(request())

    expect(result.response).toBe('오늘은 이야기가 먼저 잔을 잡았네요.')
    expect(result.usedWebLLM).toBe(true)
  })

  it('새 요청이 오면 이전 요청을 취소하고 stale 응답을 사용하지 않는다', async () => {
    let call = 0
    const engine: WebLLMEngine = {
      complete: vi.fn((_prompt, signal) => {
        call += 1
        if (call === 2) return Promise.resolve('새 이야기가 먼저 도착했네요.')
        return new Promise<string>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new DOMException('취소', 'AbortError')), { once: true })
        })
      }),
      interrupt: vi.fn(),
      unload: vi.fn(async () => undefined),
    }
    const loader = await preparedLoader(engine)
    const service = new ExperimentalWebLLMService({
      loader,
      flags: () => ({ preloadEnabled: true, responseEnabled: true }),
      timeoutMs: 100,
    })

    const first = service.polish(request({ input: '첫 요청' }))
    const second = service.polish(request({ input: '새 요청' }))
    const [firstResult, secondResult] = await Promise.all([first, second])

    expect(firstResult.usedWebLLM).toBe(false)
    expect(['cancelled', 'stale-request']).toContain(firstResult.metadata.generationSkippedReason)
    expect(secondResult.response).toBe('새 이야기가 먼저 도착했네요.')
    expect(engine.interrupt).toHaveBeenCalled()
  })
})
