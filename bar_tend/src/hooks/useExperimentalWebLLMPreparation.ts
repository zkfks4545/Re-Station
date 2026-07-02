import { useEffect } from 'react'
import { readWebLLMFeatureFlags } from '../lib/webllm/config.js'
import { installExperimentalWebLLMDebugApi } from '../lib/webllm/debug.js'
import { experimentalWebLLMLoader } from '../lib/webllm/loader.js'

export function useExperimentalWebLLMPreparation(): void {
  useEffect(() => {
    installExperimentalWebLLMDebugApi()
    if (!readWebLLMFeatureFlags().preloadEnabled) return
    void experimentalWebLLMLoader.prepare()
  }, [])
}
