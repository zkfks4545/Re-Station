import type { TastePreference } from '../../types/cocktail-db.js'
import type { FeatureKey } from '../../types/cocktail-db.js'
import type { IdolMemorySlot, IdolSentiment } from '../idol/memory.js'

const OLD_SESSION_KEY = 'barbot_session_v1'
const SESSION_KEY = 'restation_session_v1'

export interface RestationSession {
  preference: TastePreference
  idol: IdolMemorySlot
}

const DEFAULT_SESSION: RestationSession = {
  preference: {},
  idol: {
    sentiment: 'neutral',
    lastTopics: [],
    exchangeCount: 0,
  },
}

const FEATURE_KEYS: FeatureKey[] = ['sweetness', 'alcohol_strength', 'fizz', 'sourness']
const SENTIMENTS: IdolSentiment[] = ['neutral', 'warm', 'melancholy', 'excited']

function migrateSession(): void {
  const old = localStorage.getItem(OLD_SESSION_KEY)
  if (old) {
    localStorage.setItem(SESSION_KEY, old)
    localStorage.removeItem(OLD_SESSION_KEY)
  }
}

export function loadSession(): RestationSession {
  try {
    migrateSession()
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return createDefaultSession()
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return createDefaultSession()

    return {
      preference: parsePreference(parsed.preference),
      idol: parseIdolMemory(parsed.idol),
    }
  } catch {
    return createDefaultSession()
  }
}

export function saveSession(session: RestationSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function clearSession(): RestationSession {
  const fresh = createDefaultSession()
  saveSession(fresh)
  return fresh
}

function createDefaultSession(): RestationSession {
  return {
    preference: {},
    idol: { ...DEFAULT_SESSION.idol, lastTopics: [] },
  }
}

function parsePreference(value: unknown): TastePreference {
  if (!isRecord(value)) return {}

  return FEATURE_KEYS.reduce<TastePreference>((preference, key) => {
    const feature = value[key]
    if (typeof feature === 'number' && Number.isFinite(feature) && feature >= 0 && feature <= 1) {
      preference[key] = feature
    }
    return preference
  }, {})
}

function parseIdolMemory(value: unknown): IdolMemorySlot {
  if (!isRecord(value)) return createDefaultSession().idol

  return {
    sentiment: SENTIMENTS.includes(value.sentiment as IdolSentiment)
      ? value.sentiment as IdolSentiment
      : 'neutral',
    lastTopics: Array.isArray(value.lastTopics)
      ? value.lastTopics.filter((topic): topic is string => typeof topic === 'string').slice(-6)
      : [],
    exchangeCount: typeof value.exchangeCount === 'number'
      && Number.isInteger(value.exchangeCount)
      && value.exchangeCount >= 0
      ? value.exchangeCount
      : 0,
    userName: typeof value.userName === 'string' ? value.userName : undefined,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
