import { WEB_LLM_RUNTIME_CONFIG } from './config.js'
import type { WebLLMEngine, WebLLMEngineFactory } from './types.js'

export const createWebLLMEngine: WebLLMEngineFactory = async (model, onProgress) => {
  const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm')
  const worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), { type: 'module' })
  try {
    const engine = await CreateWebWorkerMLCEngine(worker, model, {
      initProgressCallback: (progress) => onProgress?.(progress.progress, progress.text),
    })
    const adapter: WebLLMEngine = {
      async complete(prompt, signal) {
        if (signal.aborted) throw abortError()
        const onAbort = () => engine.interruptGenerate()
        signal.addEventListener('abort', onAbort, { once: true })
        try {
          const completion = await engine.chat.completions.create({
            messages: [
              { role: 'system', content: '대사를 만들지 말고 요청된 의미 분석 JSON 객체만 출력하세요.' },
              { role: 'user', content: prompt },
            ],
            temperature: WEB_LLM_RUNTIME_CONFIG.temperature,
            max_tokens: WEB_LLM_RUNTIME_CONFIG.maxTokens,
            stream: false,
          })
          return completion.choices[0]?.message.content?.trim() ?? ''
        } finally {
          signal.removeEventListener('abort', onAbort)
        }
      },
      interrupt() {
        engine.interruptGenerate()
      },
      async unload() {
        await engine.unload()
        worker.terminate()
      },
    }
    return adapter
  } catch (error) {
    worker.terminate()
    throw error
  }
}

function abortError(): DOMException {
  return new DOMException('WebLLM 요청이 취소되었습니다.', 'AbortError')
}
