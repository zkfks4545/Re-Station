import { describe, expect, it, vi } from 'vitest'
import { ExperimentalWebLLMLoader } from './loader.js'
import { ExperimentalSemanticAssistant } from './service.js'
import { SemanticSessionTagStore } from './session-tags.js'
import type { WebLLMEngine, WebLLMSemanticRequest } from './types.js'

function request(overrides: Partial<WebLLMSemanticRequest> = {}): WebLLMSemanticRequest {
  return { input: '요즘 일이 좀 많았어요.', route: 'general-chat', ...overrides }
}

function semanticJson(): string {
  return JSON.stringify({
    topic: 'work',
    stance: 'observant',
    responseBlocks: ['reaction', 'metaphor'],
    rapportHint: 'neutral',
    sessionTags: ['burnout', 'work'],
    confidence: 0.8,
  })
}

async function preparedLoader(engine: WebLLMEngine): Promise<ExperimentalWebLLMLoader> {
  const loader = new ExperimentalWebLLMLoader({
    engineFactory: async () => engine,
    flags: () => ({ preloadEnabled: true, semanticEnabled: true }),
    capabilityCheck: () => ({ supported: true }),
  })
  await loader.prepare()
  return loader
}

describe('WebLLM 의미 보조 서비스', () => {
  it('SEMANTIC OFF이면 엔진을 호출하지 않고 분석 없이 끝난다', async () => {
    const engine = fakeEngine(semanticJson())
    const loader = await preparedLoader(engine)
    const assistant = new ExperimentalSemanticAssistant({
      loader,
      flags: () => ({ preloadEnabled: true, semanticEnabled: false }),
    })

    const result = await assistant.analyze(request())

    expect(result.analysis).toBeNull()
    expect(result.metadata.generationSkippedReason).toBe('semantic-disabled')
    expect(engine.complete).not.toHaveBeenCalled()
  })

  it.each(['safety-alert', 'order-cocktail', 'recommendation-query', 'farewell', 'lore-query'])(
    '결정 경로 %s에서는 의미 분석을 호출하지 않는다',
    async (route) => {
      const engine = fakeEngine(semanticJson())
      const loader = await preparedLoader(engine)
      const assistant = new ExperimentalSemanticAssistant({
        loader,
        flags: () => ({ preloadEnabled: true, semanticEnabled: true }),
      })

      const result = await assistant.analyze(request({ route }))

      expect(result.analysis).toBeNull()
      expect(result.metadata.generationSkippedReason).toBe('ineligible-route')
      expect(engine.complete).not.toHaveBeenCalled()
    },
  )

  it('검증된 의미 정보와 세션 태그만 저장한다', async () => {
    const tagStore = new SemanticSessionTagStore()
    const loader = await preparedLoader(fakeEngine(semanticJson()))
    const assistant = new ExperimentalSemanticAssistant({
      loader,
      tagStore,
      flags: () => ({ preloadEnabled: true, semanticEnabled: true }),
    })

    const result = await assistant.analyze(request())

    expect(result.analysis?.responseBlocks).toEqual(['reaction', 'metaphor'])
    expect(tagStore.snapshot()).toEqual(['burnout', 'work'])
  })

  it('분석 중 새 요청은 기다리지 않고 즉시 건너뛴다', async () => {
    let resolve!: (value: string) => void
    const engine = fakeEngine(new Promise<string>((done) => { resolve = done }))
    const loader = await preparedLoader(engine)
    const assistant = new ExperimentalSemanticAssistant({
      loader,
      flags: () => ({ preloadEnabled: true, semanticEnabled: true }),
    })

    const first = assistant.analyze(request({ input: '첫 입력' }))
    const second = await assistant.analyze(request({ input: '다음 입력' }))
    resolve(semanticJson())
    await first

    expect(second.analysis).toBeNull()
    expect(second.metadata.generationSkippedReason).toBe('generation-busy')
  })

  it('timeout이면 결과를 버리고 해당 세션의 WebLLM을 비활성화한다', async () => {
    const engine = fakeEngine(new Promise<string>(() => undefined))
    const loader = await preparedLoader(engine)
    const assistant = new ExperimentalSemanticAssistant({
      loader,
      flags: () => ({ preloadEnabled: true, semanticEnabled: true }),
      timeoutMs: 5,
    })

    const result = await assistant.analyze(request())

    expect(result.analysis).toBeNull()
    expect(result.metadata.generationSkippedReason).toBe('timeout')
    expect(loader.isDisabled()).toBe(true)
  })
})

function fakeEngine(result: string | Promise<string>): WebLLMEngine {
  return {
    complete: vi.fn(async () => result),
    interrupt: vi.fn(),
    unload: vi.fn(async () => undefined),
  }
}
