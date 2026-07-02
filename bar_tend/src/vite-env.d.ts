/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEB_LLM_PRELOAD_ENABLED?: string
  readonly VITE_WEB_LLM_RESPONSE_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
