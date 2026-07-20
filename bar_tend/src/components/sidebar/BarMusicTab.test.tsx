import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { BgmAudioChannel } from '@/hooks/useAudioManager.js'
import type { SfxChannel } from '@/hooks/useSfxManager.js'
import BarMusicTab from './BarMusicTab.js'

function createBgm(overrides: Partial<BgmAudioChannel> = {}): BgmAudioChannel {
  return {
    presets: [],
    selectedPresetId: null,
    selectedPreset: null,
    isReady: false,
    isPlaying: false,
    autoplayBlocked: false,
    volume: 0.65,
    muted: false,
    error: null,
    currentTime: 0,
    duration: 0,
    togglePreset: vi.fn(),
    togglePlayPause: vi.fn(),
    setVolume: vi.fn(),
    toggleMuted: vi.fn(),
    ...overrides,
  }
}

function createSfx(overrides: Partial<SfxChannel> = {}): SfxChannel {
  return {
    play: vi.fn(),
    stop: vi.fn(),
    stopAll: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    volume: 0.4,
    muted: false,
    ...overrides,
  }
}

describe('BarMusicTab audio UX contract', () => {
  it('renders separate labelled BGM and SFX controls with current values', () => {
    const markup = renderToStaticMarkup(<BarMusicTab bgm={createBgm()} sfx={createSfx()} />)

    expect(markup).toContain('BGM 볼륨')
    expect(markup).toContain('효과음 볼륨')
    expect(markup).toContain('65%')
    expect(markup).toContain('40%')
    expect(markup).toContain('[ 효과음 음소거 ]')
    expect(markup.match(/type="range"/g)).toHaveLength(2)
  })

  it('exposes blocked playback, mute, and error states without hiding controls', () => {
    const markup = renderToStaticMarkup(
      <BarMusicTab
        bgm={createBgm({ autoplayBlocked: true, error: '재생 실패' })}
        sfx={createSfx({ muted: true })}
      />,
    )

    expect(markup).toContain('자동재생 차단')
    expect(markup).toContain('[ 효과음 음소거 해제 ]')
    expect(markup).toContain('재생 실패')
    expect(markup).toContain('효과음 볼륨')
  })
})
