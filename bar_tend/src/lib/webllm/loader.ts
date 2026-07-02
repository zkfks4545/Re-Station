import { checkWebLLMCapability, type WebLLMCapabilityResult } from './capability.js'
import { WEB_LLM_RUNTIME_CONFIG, readWebLLMFeatureFlags, type WebLLMFeatureFlags } from './config.js'
import { createWebLLMEngine } from './engine-factory.js'
import type { WebLLMEngine, WebLLMEngineFactory, WebLLMMetadata, WebLLMStatus } from './types.js'

export interface WebLLMLoaderDependencies {
  engineFactory?: WebLLMEngineFactory
  capabilityCheck?: () => WebLLMCapabilityResult
  flags?: () => WebLLMFeatureFlags
  now?: () => number
}

export class ExperimentalWebLLMLoader {
  private engine: WebLLMEngine | null = null
  private preparationTask: Promise<WebLLMMetadata> | null = null
  private status: WebLLMStatus = 'idle'
  private sessionDisabled = false
  private failureCount = 0
  private lifecycle = 0
  private readonly engineFactory: WebLLMEngineFactory
  private readonly capabilityCheck: () => WebLLMCapabilityResult
  private readonly flags: () => WebLLMFeatureFlags
  private readonly now: () => number

  constructor(dependencies: WebLLMLoaderDependencies = {}) {
    this.engineFactory = dependencies.engineFactory ?? createWebLLMEngine
    this.capabilityCheck = dependencies.capabilityCheck ?? checkWebLLMCapability
    this.flags = dependencies.flags ?? readWebLLMFeatureFlags
    this.now = dependencies.now ?? (() => performance.now())
  }

  prepare(options: { manual?: boolean } = {}): Promise<WebLLMMetadata> {
    if (this.engine) return Promise.resolve(this.metadata(0))
    if (this.preparationTask) return this.preparationTask
    const flags = this.flags()
    if (!options.manual && !flags.preloadEnabled) {
      return Promise.resolve(this.metadata(0, 'preload-disabled'))
    }
    if (this.sessionDisabled) return Promise.resolve(this.metadata(0, 'session-disabled'))
    const capability = this.capabilityCheck()
    if (!capability.supported) {
      this.status = 'unavailable'
      this.sessionDisabled = true
      return Promise.resolve(this.metadata(0, capability.reason))
    }

    const startedAt = this.now()
    const lifecycle = this.lifecycle
    this.status = 'preparing'
    this.preparationTask = this.engineFactory(WEB_LLM_RUNTIME_CONFIG.model)
      .then(async (engine) => {
        if (lifecycle !== this.lifecycle || this.sessionDisabled) {
          await engine.unload()
          return this.metadata(this.now() - startedAt, 'cancelled')
        }
        this.engine = engine
        this.status = 'ready'
        this.failureCount = 0
        return this.metadata(this.now() - startedAt)
      })
      .catch((error: unknown) => {
        this.status = 'unavailable'
        this.sessionDisabled = true
        return this.metadata(this.now() - startedAt, 'preparation-failed', errorMessage(error))
      })
      .finally(() => {
        this.preparationTask = null
      })
    return this.preparationTask
  }

  async complete(prompt: string, signal: AbortSignal): Promise<string> {
    if (!this.engine) throw new Error('WebLLM 모델이 준비되지 않았습니다.')
    this.status = 'generating'
    try {
      const result = await this.engine.complete(prompt, signal)
      this.failureCount = 0
      return result
    } catch (error) {
      if (!isAbortError(error)) this.recordFailure()
      throw error
    } finally {
      if (!this.sessionDisabled) this.status = this.engine ? 'ready' : 'idle'
    }
  }

  interrupt(): void {
    this.engine?.interrupt()
  }

  async unload(): Promise<void> {
    this.lifecycle += 1
    this.interrupt()
    await this.engine?.unload()
    this.engine = null
    this.preparationTask = null
    this.status = 'idle'
    this.failureCount = 0
  }

  disableForSession(): void {
    this.lifecycle += 1
    this.sessionDisabled = true
    this.status = 'disabled'
    this.interrupt()
  }

  isPrepared(): boolean {
    return this.engine !== null && !this.sessionDisabled
  }

  isDisabled(): boolean {
    return this.sessionDisabled
  }

  getMetadata(): WebLLMMetadata {
    return this.metadata(0)
  }

  private recordFailure(): void {
    this.failureCount += 1
    if (this.failureCount >= WEB_LLM_RUNTIME_CONFIG.maximumConsecutiveFailures) {
      this.disableForSession()
    }
  }

  private metadata(
    elapsedMs: number,
    generationSkippedReason?: WebLLMMetadata['generationSkippedReason'],
    errorReason?: string,
  ): WebLLMMetadata {
    return {
      provider: 'webllm',
      status: this.status,
      model: WEB_LLM_RUNTIME_CONFIG.model,
      elapsedMs,
      errorReason,
      validationWarnings: [],
      prepared: this.isPrepared(),
      enabled: this.flags().responseEnabled,
      generationSkippedReason,
    }
  }
}

export const experimentalWebLLMLoader = new ExperimentalWebLLMLoader()

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
