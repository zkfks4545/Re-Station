import { experimentalWebLLMLoader } from './loader.js'
import { experimentalSemanticAssistant } from './service.js'
import { experimentalWebLLMDiagnostics } from './diagnostics.js'
import { semanticSessionTags } from './session-tags.js'
import type { WebLLMSemanticResult } from './types.js'

interface WebLLMDebugApi {
  snapshot: () => {
    enabled: boolean
    prepared: boolean
    sessionTags: ReturnType<typeof semanticSessionTags.snapshot>
    status: ReturnType<typeof experimentalWebLLMLoader.getMetadata>
    diagnostics: ReturnType<typeof experimentalWebLLMDiagnostics.snapshot>
  }
  status: () => ReturnType<typeof experimentalWebLLMLoader.getMetadata>
  prepare: () => ReturnType<typeof experimentalWebLLMLoader.prepare>
  unload: () => Promise<void>
  disable: () => void
  tags: () => ReturnType<typeof semanticSessionTags.snapshot>
  resetTags: () => void
  resetDiagnostics: () => void
  test: (input: string) => Promise<WebLLMSemanticResult>
}

declare global {
  interface Window {
    __RESTATION_WEBLLM__?: WebLLMDebugApi
  }
}

export function installExperimentalWebLLMDebugApi(): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') return
  window.__RESTATION_WEBLLM__ = {
    snapshot: () => {
      const status = experimentalWebLLMLoader.getMetadata()
      return {
        enabled: status.enabled,
        prepared: status.prepared,
        sessionTags: semanticSessionTags.snapshot(),
        status,
        diagnostics: experimentalWebLLMDiagnostics.snapshot(),
      }
    },
    status: () => experimentalWebLLMLoader.getMetadata(),
    prepare: () => experimentalWebLLMLoader.prepare({ manual: true }),
    unload: () => experimentalWebLLMLoader.unload(),
    disable: () => experimentalWebLLMLoader.disableForSession(),
    tags: () => semanticSessionTags.snapshot(),
    resetTags: () => semanticSessionTags.reset(),
    resetDiagnostics: () => experimentalWebLLMDiagnostics.reset(),
    test: (input) => experimentalSemanticAssistant.analyze({
      input,
      route: 'general-chat',
    }),
  }
}
