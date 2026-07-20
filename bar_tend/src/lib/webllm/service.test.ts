import { describe, expect, it, vi } from 'vitest'
import { ExperimentalWebLLMDiagnostics } from './diagnostics.js'
import { ExperimentalWebLLMLoader } from './loader.js'
import { ExperimentalSemanticAssistant, isEligibleSemanticRoute } from './service.js'
import { SemanticSessionTagStore } from './session-tags.js'
import type { WebLLMEngine, WebLLMSemanticRequest } from './types.js'

function request(overrides: Partial<WebLLMSemanticRequest> = {}): WebLLMSemanticRequest {
  return { input: 'Long day at work.', route: 'general-chat', ...overrides }
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

describe('WebLLM semantic assistant', () => {
  it('does not call the engine when semantic analysis is disabled', async () => {
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
    'does not call the engine for decision route %s',
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

  it('allows only low-risk conversation intents for semantic snapshots', () => {
    expect(isEligibleSemanticRoute('general-chat')).toBe(true)
    expect(isEligibleSemanticRoute('mood-talk')).toBe(true)
    expect(isEligibleSemanticRoute('weather-talk')).toBe(true)

    expect(isEligibleSemanticRoute('order-cocktail')).toBe(false)
    expect(isEligibleSemanticRoute('recommendation-query')).toBe(false)
    expect(isEligibleSemanticRoute('safety-alert')).toBe(false)
    expect(isEligibleSemanticRoute('exit-intent')).toBe(false)
    expect(isEligibleSemanticRoute('recipe-query')).toBe(false)
  })

  it('stores only validated semantic session tags', async () => {
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

  it('skips overlapping requests instead of blocking the current response', async () => {
    let resolve!: (value: string) => void
    const engine = fakeEngine(new Promise<string>((done) => { resolve = done }))
    const loader = await preparedLoader(engine)
    const assistant = new ExperimentalSemanticAssistant({
      loader,
      flags: () => ({ preloadEnabled: true, semanticEnabled: true }),
    })

    const first = assistant.analyze(request({ input: 'first input' }))
    const second = await assistant.analyze(request({ input: 'next input' }))
    resolve(semanticJson())
    await first

    expect(second.analysis).toBeNull()
    expect(second.metadata.generationSkippedReason).toBe('generation-busy')
  })

  it('discards timed out results and disables WebLLM for the session', async () => {
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

  it('records last result, last failure, and reason statistics for runtime inspection', async () => {
    const diagnostics = new ExperimentalWebLLMDiagnostics()
    const loader = await preparedLoader(fakeEngine('not json'))
    const assistant = new ExperimentalSemanticAssistant({
      loader,
      diagnostics,
      flags: () => ({ preloadEnabled: true, semanticEnabled: true }),
    })

    const result = await assistant.analyze(request())
    const snapshot = diagnostics.snapshot()

    expect(result.analysis).toBeNull()
    expect(snapshot.lastResult?.metadata.generationSkippedReason).toBe('validation-failed')
    expect(snapshot.lastFailure?.generationSkippedReason).toBe('validation-failed')
    expect(snapshot.statistics).toMatchObject({
      attempts: 1,
      successes: 0,
      failures: 1,
      skips: 0,
    })
    expect(snapshot.statistics.byReason['validation-failed']).toBe(1)
  })
})

function fakeEngine(result: string | Promise<string>): WebLLMEngine {
  return {
    complete: vi.fn(async () => result),
    interrupt: vi.fn(),
    unload: vi.fn(async () => undefined),
  }
}
