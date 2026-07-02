import { WEB_LLM_RUNTIME_CONFIG, readWebLLMFeatureFlags, type WebLLMFeatureFlags } from './config.js'
import { experimentalWebLLMLoader, type ExperimentalWebLLMLoader } from './loader.js'
import { buildExperimentalWebLLMPrompt } from './prompt.js'
import type { WebLLMMetadata, WebLLMPolishRequest, WebLLMPolishResult } from './types.js'
import { validateExperimentalWebLLMResponse } from './validator.js'

export interface ExperimentalWebLLMServiceDependencies {
  loader?: ExperimentalWebLLMLoader
  flags?: () => WebLLMFeatureFlags
  now?: () => number
  timeoutMs?: number
}

export class ExperimentalWebLLMService {
  private readonly loader: ExperimentalWebLLMLoader
  private readonly flags: () => WebLLMFeatureFlags
  private readonly now: () => number
  private readonly timeoutMs: number
  private sequence = 0
  private activeController: AbortController | null = null
  private activeTask: Promise<string> | null = null

  constructor(dependencies: ExperimentalWebLLMServiceDependencies = {}) {
    this.loader = dependencies.loader ?? experimentalWebLLMLoader
    this.flags = dependencies.flags ?? readWebLLMFeatureFlags
    this.now = dependencies.now ?? (() => performance.now())
    this.timeoutMs = dependencies.timeoutMs ?? WEB_LLM_RUNTIME_CONFIG.timeoutMs
  }

  async polish(request: WebLLMPolishRequest): Promise<WebLLMPolishResult> {
    const flags = this.flags()
    if (!flags.responseEnabled) return this.fallback(request, 'response-disabled')
    if (!isEligible(request)) return this.fallback(request, 'ineligible-route')
    if (this.loader.isDisabled()) return this.fallback(request, 'session-disabled')
    if (!this.loader.isPrepared()) return this.fallback(request, 'not-prepared')

    if (this.activeTask) {
      this.cancelActive()
      try {
        await this.activeTask
      } catch {
        // 취소된 이전 요청은 새 요청을 막지 않는다.
      }
    }

    const requestSequence = ++this.sequence
    const controller = new AbortController()
    const startedAt = this.now()
    const prompt = buildExperimentalWebLLMPrompt(request)
    const task = withTimeout(
      this.loader.complete(prompt, controller.signal),
      this.timeoutMs,
      () => {
        controller.abort()
        this.loader.interrupt()
      },
    )
    this.activeController = controller
    this.activeTask = task

    try {
      const generated = await task
      if (requestSequence !== this.sequence) {
        return this.fallback(request, 'stale-request', this.now() - startedAt)
      }
      const validation = validateExperimentalWebLLMResponse(generated)
      if (!validation.valid) {
        return this.fallback(
          request,
          'validation-failed',
          this.now() - startedAt,
          validation.warnings,
        )
      }
      return {
        response: generated.trim(),
        usedWebLLM: true,
        metadata: {
          ...this.loader.getMetadata(),
          status: 'ready',
          elapsedMs: this.now() - startedAt,
          validationWarnings: [],
          enabled: true,
        },
      }
    } catch (error) {
      const reason = controller.signal.aborted
        ? (requestSequence === this.sequence ? 'timeout' : 'cancelled')
        : 'generation-failed'
      return this.fallback(request, reason, this.now() - startedAt, [], errorMessage(error))
    } finally {
      if (requestSequence === this.sequence) {
        this.activeController = null
        this.activeTask = null
      }
    }
  }

  cancelActive(): void {
    if (!this.activeController) return
    this.sequence += 1
    this.activeController.abort()
    this.loader.interrupt()
  }

  private fallback(
    request: WebLLMPolishRequest,
    reason: WebLLMMetadata['generationSkippedReason'],
    elapsedMs = 0,
    validationWarnings: string[] = [],
    errorReason?: string,
  ): WebLLMPolishResult {
    return {
      response: request.fallbackResponse,
      usedWebLLM: false,
      metadata: {
        ...this.loader.getMetadata(),
        elapsedMs,
        errorReason,
        validationWarnings,
        enabled: this.flags().responseEnabled,
        generationSkippedReason: reason,
      },
    }
  }
}

export const experimentalWebLLMService = new ExperimentalWebLLMService()

function isEligible(request: WebLLMPolishRequest): boolean {
  if (WEB_LLM_FORBIDDEN_ROUTES.has(request.route)) return false
  if (request.route === 'general-chat') return true
  return request.route === 'general'
    && (request.reactionKind === 'simple' || request.reactionKind === 'light-small-talk')
}

const WEB_LLM_FORBIDDEN_ROUTES = new Set([
  'safety',
  'safety-alert',
  'recommendation-query',
  'recommendation-cancel',
  'order-cocktail',
  'order-cocktail-mixed',
  'secret-menu',
  'farewell',
  'exit',
  'xyz',
  'story-query',
  'lore-query',
  'cocktail-info-query',
  'recipe-query',
])

function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  onTimeout: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      onTimeout()
      reject(new Error('WebLLM 응답 제한 시간을 초과했습니다.'))
    }, timeoutMs)
    task.then(
      (value) => {
        clearTimeout(timeout)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeout)
        reject(error)
      },
    )
  })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
