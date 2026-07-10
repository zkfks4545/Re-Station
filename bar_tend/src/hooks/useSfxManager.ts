import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type SfxId = 'shake' | 'serve'

const SFX_URLS: Record<SfxId, string> = {
  shake: '/sfx/shake.mp3',
  serve: '/sfx/serve.wav',
}

const SFX_SETTINGS_KEY = 'restation.sfx.settings.v1'

interface StoredSfxSettings {
  volume: number
  muted: boolean
}

function readStoredSfxSettings(): StoredSfxSettings {
  if (typeof window === 'undefined') return { volume: 0.65, muted: false }
  try {
    const raw = window.localStorage.getItem(SFX_SETTINGS_KEY)
    if (!raw) return { volume: 0.65, muted: false }
    const parsed = JSON.parse(raw) as Partial<StoredSfxSettings>
    return {
      volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 0.65,
      muted: parsed.muted ?? false,
    }
  } catch {
    return { volume: 0.65, muted: false }
  }
}

function writeStoredSfxSettings(settings: StoredSfxSettings): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SFX_SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable; session-only.
  }
}

export interface SfxChannel {
  play: (id: SfxId) => void
  stop: (id: SfxId) => void
  stopAll: () => void
  setVolume: (value: number) => void
  setMuted: (value: boolean) => void
  volume: number
  muted: boolean
}

export function useSfxManager(): SfxChannel {
  const [initialSettings] = useState(readStoredSfxSettings)
  const [volume, setVolumeState] = useState(initialSettings.volume)
  const [muted, setMutedState] = useState(initialSettings.muted)
  const volumeRef = useRef(initialSettings.volume)
  const mutedRef = useRef(initialSettings.muted)
  const loopInstancesRef = useRef<Map<SfxId, HTMLAudioElement>>(new Map())
  const activeOneShotsRef = useRef<Set<HTMLAudioElement>>(new Set())

  const applyAudioSettings = useCallback((audio: HTMLAudioElement) => {
    audio.volume = volumeRef.current
    audio.muted = mutedRef.current
  }, [])

  const play = useCallback((id: SfxId) => {
    if (mutedRef.current) return

    if (id === 'shake') {
      if (loopInstancesRef.current.has('shake')) return
      const audio = new Audio(SFX_URLS.shake)
      audio.loop = true
      applyAudioSettings(audio)
      loopInstancesRef.current.set('shake', audio)
      audio.play().catch(() => {})
      return
    }

    if (id === 'serve') {
      const audio = new Audio(SFX_URLS.serve)
      applyAudioSettings(audio)
      activeOneShotsRef.current.add(audio)
      audio.addEventListener('ended', () => {
        activeOneShotsRef.current.delete(audio)
      }, { once: true })
      audio.play().catch(() => {
        activeOneShotsRef.current.delete(audio)
      })
    }
  }, [applyAudioSettings])

  const stop = useCallback((id: SfxId) => {
    const audio = loopInstancesRef.current.get(id)
    if (audio) {
      audio.pause()
      audio.src = ''
      loopInstancesRef.current.delete(id)
    }
  }, [])

  const stopAll = useCallback(() => {
    for (const audio of loopInstancesRef.current.values()) {
      audio.pause()
      audio.src = ''
    }
    loopInstancesRef.current.clear()
    for (const audio of activeOneShotsRef.current) {
      audio.pause()
    }
    activeOneShotsRef.current.clear()
  }, [])

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value))
    volumeRef.current = clamped
    setVolumeState(clamped)
    for (const audio of loopInstancesRef.current.values()) {
      audio.volume = clamped
    }
  }, [])

  const setMuted = useCallback((value: boolean) => {
    mutedRef.current = value
    setMutedState(value)
    if (value) {
      stopAll()
    }
  }, [stopAll])

  useEffect(() => {
    writeStoredSfxSettings({ volume, muted })
  }, [volume, muted])

  useEffect(() => () => {
    for (const audio of loopInstancesRef.current.values()) {
      audio.pause()
      audio.src = ''
    }
    loopInstancesRef.current.clear()
    for (const audio of activeOneShotsRef.current) {
      audio.pause()
      audio.src = ''
    }
    activeOneShotsRef.current.clear()
  }, [])

  return useMemo(() => ({
    play,
    stop,
    stopAll,
    setVolume,
    setMuted,
    volume,
    muted,
  }), [muted, play, setMuted, setVolume, stop, stopAll, volume])
}
