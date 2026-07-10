import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { BGM_PRESETS, type BgmPreset } from '@/data/bgm-presets.js'
import type { SfxChannel } from './useSfxManager.js'

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          height: string
          width: string
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (e: { target: YtPlayer }) => void
            onStateChange?: (e: { data: number }) => void
            onError?: (e: { data: number }) => void
          }
        },
      ) => YtPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED?: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YtPlayer {
  playVideo: () => void
  pauseVideo: () => void
  loadVideoById: (id: string) => void
  getPlayerState: () => number
  getCurrentTime: () => number
  getDuration: () => number
  setVolume: (volume: number) => void
  mute: () => void
  unMute: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  destroy: () => void
}

interface StoredAudioSettings {
  bgmPresetId: string | null
  bgmVolume: number
  bgmMuted: boolean
}

export interface BgmAudioChannel {
  presets: readonly BgmPreset[]
  selectedPresetId: string | null
  selectedPreset: BgmPreset | null
  isReady: boolean
  isPlaying: boolean
  autoplayBlocked: boolean
  volume: number
  muted: boolean
  error: string | null
  currentTime: number
  duration: number
  togglePreset: (presetId: string) => void
  togglePlayPause: () => void
  setVolume: (volume: number) => void
  toggleMuted: () => void
}

export interface AudioManager {
  bgm: BgmAudioChannel
  sfx: SfxChannel
}

const AUDIO_SETTINGS_KEY = 'restation.audio.settings.v1'
const DEFAULT_AUDIO_SETTINGS: StoredAudioSettings = {
  bgmPresetId: BGM_PRESETS[0]?.id ?? null,
  bgmVolume: 0.65,
  bgmMuted: false,
}

let youtubeApiLoading: Promise<void> | null = null

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_AUDIO_SETTINGS.bgmVolume
  return Math.min(1, Math.max(0, value))
}

function readStoredAudioSettings(): StoredAudioSettings {
  if (typeof window === 'undefined') return DEFAULT_AUDIO_SETTINGS

  try {
    const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY)
    if (!raw) return DEFAULT_AUDIO_SETTINGS
    const parsed = JSON.parse(raw) as Partial<StoredAudioSettings>
    const presetExists = BGM_PRESETS.some((preset) => preset.id === parsed.bgmPresetId)
    return {
      bgmPresetId: presetExists ? parsed.bgmPresetId ?? null : DEFAULT_AUDIO_SETTINGS.bgmPresetId,
      bgmVolume: clampVolume(parsed.bgmVolume ?? DEFAULT_AUDIO_SETTINGS.bgmVolume),
      bgmMuted: parsed.bgmMuted ?? DEFAULT_AUDIO_SETTINGS.bgmMuted,
    }
  } catch {
    return DEFAULT_AUDIO_SETTINGS
  }
}

function writeStoredAudioSettings(settings: StoredAudioSettings): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable in private contexts; audio still works for the session.
  }
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (youtubeApiLoading) return youtubeApiLoading

  youtubeApiLoading = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    document.head.appendChild(tag)
  })

  return youtubeApiLoading
}

export function useAudioManager(
  sfx: SfxChannel,
  playerHostRef: RefObject<HTMLDivElement | null>,
): AudioManager {
  const [initialSettings] = useState(readStoredAudioSettings)
  const playerRef = useRef<YtPlayer | null>(null)
  const pendingPlayRef = useRef(false)
  const volumeRef = useRef(initialSettings.bgmVolume)
  const mutedRef = useRef(initialSettings.bgmMuted)

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(initialSettings.bgmPresetId)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(initialSettings.bgmVolume)
  const [muted, setMuted] = useState(initialSettings.bgmMuted)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const retryCountRef = useRef(0)
  const playingEventRef = useRef(false)
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedPreset = useMemo(
    () => BGM_PRESETS.find((preset) => preset.id === selectedPresetId) ?? null,
    [selectedPresetId],
  )

  const applyBgmOutputSettings = useCallback((player: YtPlayer | null = playerRef.current) => {
    if (!player) return
    player.setVolume(Math.round(volumeRef.current * 100))
    if (mutedRef.current) {
      player.mute()
    } else {
      player.unMute()
    }
  }, [])

  useEffect(() => {
    volumeRef.current = volume
    mutedRef.current = muted
    applyBgmOutputSettings()
    writeStoredAudioSettings({
      bgmPresetId: selectedPresetId,
      bgmVolume: volume,
      bgmMuted: muted,
    })
  }, [applyBgmOutputSettings, muted, selectedPresetId, volume])

  const pauseBgm = useCallback(() => {
    pendingPlayRef.current = false
    playerRef.current?.pauseVideo()
    setIsPlaying(false)
  }, [])

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      clearTimeout(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }
  }, [])

  const playYtVideo = useCallback((player: YtPlayer) => {
    playingEventRef.current = false
    setAutoplayBlocked(false)
    player.playVideo()
    clearAutoplayTimer()
    autoplayTimerRef.current = setTimeout(() => {
      if (!playingEventRef.current) {
        setAutoplayBlocked(true)
      }
    }, 800)
  }, [clearAutoplayTimer])

  const ensurePlayer = useCallback(async (preset: BgmPreset, shouldPlay: boolean) => {
    setError(null)
    pendingPlayRef.current = shouldPlay

    try {
      await loadYouTubeApi()
      if (!playerHostRef.current || !window.YT) return

      if (!playerRef.current) {
        const onPlayerReady = (event: { target: YtPlayer }) => {
          const player = event.target
          playerRef.current = player
          setIsReady(true)
          applyBgmOutputSettings(player)
          if (pendingPlayRef.current) {
            playYtVideo(player)
          }
        }
        const onPlayerStateChange = (event: { data: number }) => {
          if (!window.YT) return
          if (event.data === window.YT.PlayerState.PLAYING) {
            playingEventRef.current = true
            clearAutoplayTimer()
            setAutoplayBlocked(false)
            setIsPlaying(true)
            return
          }
          if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false)
            return
          }
          if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false)
            playerRef.current?.playVideo()
          }
        }
        const onPlayerError = (event: { data: number }) => {
          const code = event.data
          if (code === 2 || code === 100 || code === 101 || code === 150) {
            setError('이 트랙을 재생할 수 없습니다.')
            setIsPlaying(false)
            return
          }
          retryCountRef.current++
          if (retryCountRef.current <= 1 && playerRef.current) {
            playerRef.current.loadVideoById(preset.youtubeId)
            if (pendingPlayRef.current) {
              playerRef.current.playVideo()
            }
            return
          }
          setError('이 트랙을 재생할 수 없습니다.')
          setIsPlaying(false)
        }
        playerRef.current = new window.YT.Player(playerHostRef.current, {
          height: '0',
          width: '0',
          videoId: preset.youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError,
          },
        })
        retryCountRef.current = 0
        return
      }

      retryCountRef.current = 0
      playerRef.current.loadVideoById(preset.youtubeId)
      applyBgmOutputSettings()
      if (shouldPlay) {
        playYtVideo(playerRef.current)
      }
    } catch {
      setError('유튜브 플레이어를 불러오지 못했습니다.')
      setIsPlaying(false)
    }
  }, [applyBgmOutputSettings, clearAutoplayTimer, playerHostRef, playYtVideo])

  const playPreset = useCallback((presetId: string) => {
    const preset = BGM_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    setSelectedPresetId(preset.id)
    void ensurePlayer(preset, true)
  }, [ensurePlayer])

  const playSelectedPreset = useCallback(() => {
    const preset = selectedPreset ?? BGM_PRESETS[0]
    if (!preset) return
    playPreset(preset.id)
  }, [playPreset, selectedPreset])

  const togglePreset = useCallback((presetId: string) => {
    if (selectedPresetId === presetId && playerRef.current) {
      if (isPlaying) {
        pauseBgm()
      } else {
        playerRef.current.playVideo()
        setIsPlaying(true)
      }
      return
    }
    playPreset(presetId)
  }, [isPlaying, pauseBgm, playPreset, selectedPresetId])

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseBgm()
      return
    }
    if (playerRef.current && selectedPresetId) {
      playerRef.current.playVideo()
      setIsPlaying(true)
      return
    }
    playSelectedPreset()
  }, [isPlaying, pauseBgm, playSelectedPreset, selectedPresetId])

  const setVolume = useCallback((nextVolume: number) => {
    setVolumeState(clampVolume(nextVolume))
  }, [])

  const toggleMuted = useCallback(() => {
    setMuted((current) => !current)
  }, [])

  useEffect(() => {
    if (!isPlaying || !playerRef.current) return
    const player = playerRef.current
    const frame = () => {
      setCurrentTime(player.getCurrentTime())
      setDuration(player.getDuration())
    }
    frame()
    const id = setInterval(frame, 1000)
    return () => clearInterval(id)
  }, [isPlaying])

  useEffect(() => () => {
    clearAutoplayTimer()
    playerRef.current?.destroy()
    playerRef.current = null
  }, [clearAutoplayTimer])

  return {
    bgm: {
      presets: BGM_PRESETS,
      selectedPresetId,
      selectedPreset,
      isReady,
      isPlaying,
      autoplayBlocked,
      currentTime,
      duration,
      volume,
      muted,
      error,
      togglePreset,
      togglePlayPause,
      setVolume,
      toggleMuted,
    },
    sfx,
  }
}
