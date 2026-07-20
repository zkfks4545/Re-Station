import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createSfxRuntime,
  readSfxSettings,
  writeSfxSettings,
  type SfxId,
  type SfxStorage,
} from '@/lib/audio/sfx-runtime.js'

function getBrowserStorage(): SfxStorage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
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
  const [initialSettings] = useState(() => readSfxSettings(getBrowserStorage()))
  const [volume, setVolumeState] = useState(initialSettings.volume)
  const [muted, setMutedState] = useState(initialSettings.muted)
  const [runtime] = useState(() => createSfxRuntime({
    createAudio: (url) => new Audio(url),
    initialSettings,
  }))

  const play = useCallback((id: SfxId) => {
    runtime.play(id)
  }, [runtime])

  const stop = useCallback((id: SfxId) => {
    runtime.stop(id)
  }, [runtime])

  const stopAll = useCallback(() => {
    runtime.stopAll()
  }, [runtime])

  const setVolume = useCallback((value: number) => {
    const clamped = runtime.setVolume(value)
    setVolumeState(clamped)
  }, [runtime])

  const setMuted = useCallback((value: boolean) => {
    setMutedState(runtime.setMuted(value))
  }, [runtime])

  useEffect(() => {
    writeSfxSettings(getBrowserStorage(), { volume, muted })
  }, [volume, muted])

  useEffect(() => () => runtime.dispose(), [runtime])

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
