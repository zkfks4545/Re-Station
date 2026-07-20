import type { WebLLMMetadata, WebLLMSemanticResult, WebLLMStatistics } from './types.js'

const FAILURE_REASONS = new Set<WebLLMMetadata['generationSkippedReason']>([
  'timeout',
  'validation-failed',
  'preparation-failed',
  'generation-failed',
])

export class ExperimentalWebLLMDiagnostics {
  private lastResult: WebLLMSemanticResult | null = null
  private lastFailure: WebLLMMetadata | null = null
  private readonly statistics: WebLLMStatistics = {
    attempts: 0,
    successes: 0,
    skips: 0,
    failures: 0,
    byReason: {},
  }

  record(result: WebLLMSemanticResult): void {
    this.lastResult = result
    this.statistics.attempts += 1

    const reason = result.metadata.generationSkippedReason
    if (result.usedWebLLM) {
      this.statistics.successes += 1
      return
    }

    if (reason) {
      this.statistics.byReason[reason] = (this.statistics.byReason[reason] ?? 0) + 1
    }

    if (reason && FAILURE_REASONS.has(reason)) {
      this.statistics.failures += 1
      this.lastFailure = result.metadata
      return
    }

    this.statistics.skips += 1
  }

  snapshot(): {
    lastResult: WebLLMSemanticResult | null
    lastFailure: WebLLMMetadata | null
    statistics: WebLLMStatistics
  } {
    return {
      lastResult: this.lastResult,
      lastFailure: this.lastFailure,
      statistics: {
        ...this.statistics,
        byReason: { ...this.statistics.byReason },
      },
    }
  }

  reset(): void {
    this.lastResult = null
    this.lastFailure = null
    this.statistics.attempts = 0
    this.statistics.successes = 0
    this.statistics.skips = 0
    this.statistics.failures = 0
    this.statistics.byReason = {}
  }
}

export const experimentalWebLLMDiagnostics = new ExperimentalWebLLMDiagnostics()
