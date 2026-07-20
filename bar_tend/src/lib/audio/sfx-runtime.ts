export type SfxId = 'shake' | 'serve'

export const SFX_URLS: Record<SfxId, string> = {
  shake: '/sfx/shake.mp3',
  serve: '/sfx/serve.wav',
}

export const DEFAULT_SFX_SETTINGS: SfxSettings = {
  volume: 0.65,
  muted: false,
}

export interface SfxSettings {
  volume: number
  muted: boolean
}

export interface SfxStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface SfxAudioInstance {
  loop: boolean
  volume: number
  muted: boolean
  src: string
  play(): Promise<void>
  pause(): void
  addEventListener(type: 'ended', listener: () => void, options: { once: true }): void
}

export interface SfxRuntime {
  play(id: SfxId): void
  stop(id: SfxId): void
  stopAll(): void
  setVolume(value: number): number
  setMuted(value: boolean): boolean
  dispose(): void
  snapshot(): SfxSettings & { loopCount: number; oneShotCount: number }
}

export const SFX_SETTINGS_KEY = 'restation.sfx.settings.v1'

export function clampSfxVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SFX_SETTINGS.volume
  return Math.min(1, Math.max(0, value))
}

export function readSfxSettings(storage?: SfxStorage): SfxSettings {
  if (!storage) return DEFAULT_SFX_SETTINGS
  try {
    const raw = storage.getItem(SFX_SETTINGS_KEY)
    if (!raw) return DEFAULT_SFX_SETTINGS
    const parsed = JSON.parse(raw) as Partial<SfxSettings>
    return {
      volume: typeof parsed.volume === 'number'
        ? clampSfxVolume(parsed.volume)
        : DEFAULT_SFX_SETTINGS.volume,
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULT_SFX_SETTINGS.muted,
    }
  } catch {
    return DEFAULT_SFX_SETTINGS
  }
}

export function writeSfxSettings(storage: SfxStorage | undefined, settings: SfxSettings): void {
  if (!storage) return
  try {
    storage.setItem(SFX_SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable; session-only.
  }
}

export function createSfxRuntime(input: {
  createAudio(url: string): SfxAudioInstance
  initialSettings?: SfxSettings
}): SfxRuntime {
  let volume = clampSfxVolume(input.initialSettings?.volume ?? DEFAULT_SFX_SETTINGS.volume)
  let muted = input.initialSettings?.muted ?? DEFAULT_SFX_SETTINGS.muted
  const loops = new Map<SfxId, SfxAudioInstance>()
  const oneShots = new Set<SfxAudioInstance>()

  const release = (audio: SfxAudioInstance, pause: boolean) => {
    if (pause) audio.pause()
    audio.src = ''
    oneShots.delete(audio)
  }

  const applySettings = (audio: SfxAudioInstance) => {
    audio.volume = volume
    audio.muted = muted
  }

  const stop = (id: SfxId) => {
    if (id === 'serve') {
      for (const audio of oneShots) release(audio, true)
      return
    }

    const audio = loops.get(id)
    if (!audio) return
    audio.pause()
    audio.src = ''
    loops.delete(id)
  }

  const stopAll = () => {
    for (const id of [...loops.keys()]) stop(id)
    stop('serve')
  }

  const play = (id: SfxId) => {
    if (muted) return

    if (id === 'shake') {
      if (loops.has(id)) return
      const audio = input.createAudio(SFX_URLS[id])
      audio.loop = true
      applySettings(audio)
      loops.set(id, audio)
      void audio.play().catch(() => {
        if (loops.get(id) !== audio) return
        audio.src = ''
        loops.delete(id)
      })
      return
    }

    const audio = input.createAudio(SFX_URLS[id])
    applySettings(audio)
    oneShots.add(audio)
    audio.addEventListener('ended', () => release(audio, false), { once: true })
    void audio.play().catch(() => release(audio, false))
  }

  return {
    play,
    stop,
    stopAll,
    setVolume(value) {
      volume = clampSfxVolume(value)
      for (const audio of [...loops.values(), ...oneShots]) audio.volume = volume
      return volume
    },
    setMuted(value) {
      muted = value
      if (muted) stopAll()
      return muted
    },
    dispose: stopAll,
    snapshot: () => ({ volume, muted, loopCount: loops.size, oneShotCount: oneShots.size }),
  }
}
