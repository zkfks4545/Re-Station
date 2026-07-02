import { experimentalWebLLMLoader } from './loader.js'
import { experimentalWebLLMService } from './service.js'
import type { WebLLMPolishResult } from './types.js'

interface WebLLMDebugApi {
  status: () => ReturnType<typeof experimentalWebLLMLoader.getMetadata>
  prepare: () => ReturnType<typeof experimentalWebLLMLoader.prepare>
  unload: () => Promise<void>
  disable: () => void
  test: (input: string) => Promise<WebLLMPolishResult>
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
    test: (input) => experimentalWebLLMService.polish({
      input,
      route: 'general-chat',
      fallbackResponse: '그 얘기, 조금 더 들어볼 만하네요.',
    }),
  }
}
