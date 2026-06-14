import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearSession,
  loadSession,
  saveSession,
  type RestationSession,
} from './guest-session-store.js'
import {
  loadUnlockedIds,
  saveUnlockedIds,
  unlockCocktailId,
} from './cocktail-unlocks.js'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  readonly length = 0

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const session: RestationSession = {
  preference: { sweetness: 0.8 },
  idol: { sentiment: 'warm', lastTopics: ['taste'], exchangeCount: 2 },
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('guest session storage boundaries', () => {
  it('migrates a valid legacy session', () => {
    const storage = new MemoryStorage()
    storage.setItem('barbot_session_v1', JSON.stringify(session))
    vi.stubGlobal('localStorage', storage)

    expect(loadSession()).toEqual(session)
    expect(storage.getItem('barbot_session_v1')).toBeNull()
    expect(storage.getItem('restation_session_v1')).not.toBeNull()
  })

  it('sanitizes malformed session fields instead of loading them', () => {
    const storage = new MemoryStorage()
    storage.setItem('restation_session_v1', JSON.stringify({
      preference: { sweetness: 2, fizz: 0.8, unknown: 0.5 },
      idol: {
        sentiment: 'broken',
        lastTopics: ['one', 2, 'three'],
        exchangeCount: 'many',
        userName: 42,
      },
    }))
    vi.stubGlobal('localStorage', storage)

    expect(loadSession()).toEqual({
      preference: { fizz: 0.8 },
      idol: {
        sentiment: 'neutral',
        lastTopics: ['one', 'three'],
        exchangeCount: 0,
        userName: undefined,
      },
    })
  })

  it('falls back and keeps reset usable when browser storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    })

    expect(loadSession()).toEqual({
      preference: {},
      idol: { sentiment: 'neutral', lastTopics: [], exchangeCount: 0 },
    })
    expect(() => saveSession(session)).not.toThrow()
    expect(clearSession()).toEqual({
      preference: {},
      idol: { sentiment: 'neutral', lastTopics: [], exchangeCount: 0 },
    })
  })
})

describe('cocktail unlock storage boundaries', () => {
  it('migrates legacy unlocks and removes invalid entries', () => {
    const storage = new MemoryStorage()
    storage.setItem('barbot_codex_unlocks', JSON.stringify(['one', 2, 'two']))
    vi.stubGlobal('localStorage', storage)

    expect(loadUnlockedIds()).toEqual(new Set(['one', 'two']))
    expect(storage.getItem('barbot_codex_unlocks')).toBeNull()
  })

  it('keeps unlock operations usable when browser storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    })

    expect(loadUnlockedIds()).toEqual(new Set())
    expect(() => saveUnlockedIds(new Set(['one']))).not.toThrow()
    expect(unlockCocktailId('one')).toEqual(new Set(['one']))
  })
})
