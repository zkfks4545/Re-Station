import { useEffect } from 'react'
import { readWebLLMFeatureFlags } from '../lib/webllm/config.js'
import { installExperimentalWebLLMDebugApi } from '../lib/webllm/debug.js'
import { experimentalWebLLMLoader } from '../lib/webllm/loader.js'

export function useExperimentalWebLLMPreparation(): void {
  useEffect(() => {
    installExperimentalWebLLMDebugApi()
    if (!readWebLLMFeatureFlags().preloadEnabled) return

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(
        () => { void experimentalWebLLMLoader.prepare() },
        { timeout: 5_000 },
      )
      return () => window.cancelIdleCallback(handle)
    }

    const handle = window.setTimeout(() => { void experimentalWebLLMLoader.prepare() }, 0)
    return () => window.clearTimeout(handle)
  }, [])
}
