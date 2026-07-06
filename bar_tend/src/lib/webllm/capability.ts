import { WEB_LLM_RUNTIME_CONFIG } from './config.js'

export type WebLLMSkipReason =
  | 'preload-disabled'
  | 'semantic-disabled'
  | 'unsupported-browser'
  | 'insecure-context'
  | 'webgpu-unavailable'
  | 'insufficient-memory'
  | 'insufficient-cpu'
  | 'session-disabled'
  | 'not-prepared'
  | 'ineligible-route'
  | 'generation-busy'
  | 'cancelled'
  | 'stale-request'
  | 'timeout'
  | 'validation-failed'
  | 'preparation-failed'
  | 'generation-failed'

export interface WebLLMCapabilityResult {
  supported: boolean
  reason?: WebLLMSkipReason
}

interface BrowserNavigator {
  gpu?: unknown
  deviceMemory?: number
  hardwareConcurrency?: number
  userAgent?: string
}

export interface WebLLMCapabilityEnvironment {
  navigator?: BrowserNavigator
  isSecureContext?: boolean
}

export function checkWebLLMCapability(
  environment: WebLLMCapabilityEnvironment = browserEnvironment(),
): WebLLMCapabilityResult {
  const navigator = environment.navigator
  if (!navigator) return { supported: false, reason: 'unsupported-browser' }
  if (!isCompatibleBrowser(navigator.userAgent)) {
    return { supported: false, reason: 'unsupported-browser' }
  }
  if (environment.isSecureContext !== true) {
    return { supported: false, reason: 'insecure-context' }
  }
  if (!navigator.gpu) return { supported: false, reason: 'webgpu-unavailable' }
  if (
    typeof navigator.deviceMemory === 'number'
    && navigator.deviceMemory < WEB_LLM_RUNTIME_CONFIG.minimumDeviceMemoryGb
  ) {
    return { supported: false, reason: 'insufficient-memory' }
  }
  if (
    typeof navigator.hardwareConcurrency === 'number'
    && navigator.hardwareConcurrency < WEB_LLM_RUNTIME_CONFIG.minimumHardwareConcurrency
  ) {
    return { supported: false, reason: 'insufficient-cpu' }
  }
  return { supported: true }
}

function browserEnvironment(): WebLLMCapabilityEnvironment {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return {}
  return {
    navigator: navigator as BrowserNavigator,
    isSecureContext: window.isSecureContext,
  }
}

function isCompatibleBrowser(userAgent = ''): boolean {
  if (!userAgent) return true
  if (/Firefox\//.test(userAgent)) return false
  const chromiumBased = /(Chrome|Chromium|Edg)\//.test(userAgent)
  const safariOnly = /Safari\//.test(userAgent) && !chromiumBased
  return chromiumBased && !safariOnly
}
