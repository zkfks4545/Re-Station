import { WEB_LLM_RUNTIME_CONFIG, readWebLLMFeatureFlags, type WebLLMFeatureFlags } from './config.js'
import { experimentalWebLLMLoader, type ExperimentalWebLLMLoader } from './loader.js'
import { buildSemanticAnalysisPrompt } from './prompt.js'
import { semanticSessionTags, type SemanticSessionTagStore } from './session-tags.js'
import type { WebLLMMetadata, WebLLMSemanticRequest, WebLLMSemanticResult } from './types.js'
import { validateSemanticAnalysis } from './validator.js'

export interface SemanticAssistantDependencies {
  loader?: ExperimentalWebLLMLoader
  tagStore?: SemanticSessionTagStore
  flags?: () => WebLLMFeatureFlags
  now?: () => number
  timeoutMs?: number
}

export class ExperimentalSemanticAssistant {
  private readonly loader: ExperimentalWebLLMLoader
  private readonly tagStore: SemanticSessionTagStore
  private readonly flags: () => WebLLMFeatureFlags
  private readonly now: () => number
  private readonly timeoutMs: number
  private active = false

  constructor(dependencies: SemanticAssistantDependencies = {}) {
    this.loader = dependencies.loader ?? experimentalWebLLMLoader
    this.tagStore = dependencies.tagStore ?? semanticSessionTags
    this.flags = dependencies.flags ?? readWebLLMFeatureFlags
    this.now = dependencies.now ?? (() => performance.now())
    this.timeoutMs = dependencies.timeoutMs ?? WEB_LLM_RUNTIME_CONFIG.timeoutMs
  }

  async analyze(request: WebLLMSemanticRequest): Promise<WebLLMSemanticResult> {
    if (!this.flags().semanticEnabled) return this.skipped('semantic-disabled')
    if (!isEligible(request.route)) return this.skipped('ineligible-route')
    if (this.loader.isDisabled()) return this.skipped('session-disabled')
    if (!this.loader.isPrepared()) return this.skipped('not-prepared')
    if (this.active) return this.skipped('generation-busy')

    const controller = new AbortController()
    const startedAt = this.now()
    this.active = true
    try {
      const raw = await withTimeout(
        this.loader.complete(buildSemanticAnalysisPrompt(request), controller.signal),
        this.timeoutMs,
        () => {
          controller.abort()
          this.loader.interrupt()
          // 종료가 확인되지 않은 분석과 다음 요청이 겹치지 않도록 세션에서 비활성화한다.
          this.loader.disableForSession()
        },
      )
      const validation = validateSemanticAnalysis(raw)
      if (!validation.valid || !validation.analysis) {
        return this.skipped('validation-failed', this.now() - startedAt, validation.warnings)
      }
      this.tagStore.add(validation.analysis.sessionTags)
      return {
        analysis: validation.analysis,
        usedWebLLM: true,
        metadata: {
          ...this.loader.getMetadata(),
          elapsedMs: this.now() - startedAt,
          validationWarnings: [],
          enabled: true,
        },
      }
    } catch (error) {
      return this.skipped(
        controller.signal.aborted ? 'timeout' : 'generation-failed',
        this.now() - startedAt,
        [],
        errorMessage(error),
      )
    } finally {
      this.active = false
    }
  }

  private skipped(
    reason: WebLLMMetadata['generationSkippedReason'],
    elapsedMs = 0,
    validationWarnings: string[] = [],
    errorReason?: string,
  ): WebLLMSemanticResult {
    return {
      analysis: null,
      usedWebLLM: false,
      metadata: {
        ...this.loader.getMetadata(),
        elapsedMs,
        errorReason,
        validationWarnings,
        enabled: this.flags().semanticEnabled,
        generationSkippedReason: reason,
      },
    }
  }
}

export const experimentalSemanticAssistant = new ExperimentalSemanticAssistant()

const ELIGIBLE_ROUTES = new Set(['general', 'general-chat', 'mood-talk', 'bar-atmosphere', 'small-talk-weather'])

function isEligible(route: string): boolean {
  return ELIGIBLE_ROUTES.has(route)
}

function withTimeout<T>(task: Promise<T>, timeoutMs: number, onTimeout: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      onTimeout()
      reject(new Error('WebLLM 의미 분석 제한 시간을 초과했습니다.'))
    }, timeoutMs)
    task.then(
      (value) => { clearTimeout(timeout); resolve(value) },
      (error) => { clearTimeout(timeout); reject(error) },
    )
  })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
