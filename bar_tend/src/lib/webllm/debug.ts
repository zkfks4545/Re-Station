import { experimentalWebLLMLoader } from './loader.js'
import { experimentalSemanticAssistant } from './service.js'
import { semanticSessionTags } from './session-tags.js'
import type { WebLLMSemanticResult } from './types.js'

interface WebLLMDebugApi {
  status: () => ReturnType<typeof experimentalWebLLMLoader.getMetadata>
  prepare: () => ReturnType<typeof experimentalWebLLMLoader.prepare>
  unload: () => Promise<void>
  disable: () => void
  tags: () => ReturnType<typeof semanticSessionTags.snapshot>
  resetTags: () => void
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
    status: () => experimentalWebLLMLoader.getMetadata(),
    prepare: () => experimentalWebLLMLoader.prepare({ manual: true }),
    unload: () => experimentalWebLLMLoader.unload(),
    disable: () => experimentalWebLLMLoader.disableForSession(),
    tags: () => semanticSessionTags.snapshot(),
    resetTags: () => semanticSessionTags.reset(),
    test: (input) => experimentalSemanticAssistant.analyze({
      input,
      route: 'general-chat',
    }),
  }
}
