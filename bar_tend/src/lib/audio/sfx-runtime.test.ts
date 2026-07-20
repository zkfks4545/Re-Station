import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SFX_SETTINGS,
  SFX_SETTINGS_KEY,
  SFX_URLS,
  clampSfxVolume,
  createSfxRuntime,
  readSfxSettings,
  writeSfxSettings,
  type SfxAudioInstance,
} from './sfx-runtime.js'

class FakeAudio implements SfxAudioInstance {
  loop = false
  volume = 1
  muted = false
  src: string
  play = vi.fn<() => Promise<void>>(() => Promise.resolve())
  pause = vi.fn()
  private endedListener?: () => void

  constructor(url: string) {
    this.src = url
  }

  addEventListener(_type: 'ended', listener: () => void, options: { once: true }): void {
    void options
    this.endedListener = listener
  }

  finish(): void {
    this.endedListener?.()
  }
}

function createHarness(settings = DEFAULT_SFX_SETTINGS) {
  const instances: FakeAudio[] = []
  const runtime = createSfxRuntime({
    initialSettings: settings,
    createAudio: (url) => {
      const audio = new FakeAudio(url)
      instances.push(audio)
      return audio
    },
  })
  return { runtime, instances }
}

describe('SFX settings contract', () => {
  it('clamps finite volumes and recovers from invalid values', () => {
    expect(clampSfxVolume(-1)).toBe(0)
    expect(clampSfxVolume(2)).toBe(1)
    expect(clampSfxVolume(Number.NaN)).toBe(DEFAULT_SFX_SETTINGS.volume)
  })

  it('reads, validates, and writes persisted settings without throwing', () => {
    const values = new Map<string, string>([[
      SFX_SETTINGS_KEY,
      JSON.stringify({ volume: 2, muted: 'yes' }),
    ]])
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }

    expect(readSfxSettings(storage)).toEqual({ volume: 1, muted: false })
    writeSfxSettings(storage, { volume: 0.4, muted: true })
    expect(JSON.parse(values.get(SFX_SETTINGS_KEY) ?? '')).toEqual({ volume: 0.4, muted: true })
    expect(readSfxSettings({ getItem: () => '{broken', setItem: vi.fn() })).toEqual(DEFAULT_SFX_SETTINGS)
    expect(() => writeSfxSettings({ getItem: vi.fn(), setItem: () => { throw new Error('blocked') } }, DEFAULT_SFX_SETTINGS)).not.toThrow()
  })
})

describe('SFX runtime contract', () => {
  it('keeps one shake loop, applies settings, and releases it on stop', () => {
    const { runtime, instances } = createHarness({ volume: 0.25, muted: false })

    runtime.play('shake')
    runtime.play('shake')

    expect(instances).toHaveLength(1)
    expect(instances[0]).toMatchObject({ src: SFX_URLS.shake, loop: true, volume: 0.25, muted: false })
    expect(runtime.snapshot().loopCount).toBe(1)

    runtime.stop('shake')
    expect(instances[0].pause).toHaveBeenCalledOnce()
    expect(instances[0].src).toBe('')
    expect(runtime.snapshot().loopCount).toBe(0)
  })

  it('releases a rejected shake so a later attempt can retry', async () => {
    const rejectedInstances: FakeAudio[] = []
    const rejectedRuntime = createSfxRuntime({
      createAudio: (url) => {
        const audio = new FakeAudio(url)
        audio.play.mockRejectedValue(new Error('blocked'))
        rejectedInstances.push(audio)
        return audio
      },
    })
    rejectedRuntime.play('shake')
    await Promise.resolve()
    expect(rejectedRuntime.snapshot().loopCount).toBe(0)
    rejectedRuntime.play('shake')
    expect(rejectedInstances).toHaveLength(2)
  })

  it('cleans up serve one-shots after ended, rejection, and stop', async () => {
    const { runtime, instances } = createHarness()

    runtime.play('serve')
    expect(runtime.snapshot().oneShotCount).toBe(1)
    instances[0].finish()
    expect(runtime.snapshot().oneShotCount).toBe(0)
    expect(instances[0].src).toBe('')

    const rejected: FakeAudio[] = []
    const rejectedRuntime = createSfxRuntime({
      createAudio: (url) => {
        const audio = new FakeAudio(url)
        audio.play.mockRejectedValue(new Error('blocked'))
        rejected.push(audio)
        return audio
      },
    })
    rejectedRuntime.play('serve')
    await Promise.resolve()
    expect(rejectedRuntime.snapshot().oneShotCount).toBe(0)
    expect(rejected[0].src).toBe('')

    runtime.play('serve')
    runtime.stop('serve')
    expect(instances[1].pause).toHaveBeenCalledOnce()
    expect(runtime.snapshot().oneShotCount).toBe(0)
  })

  it('updates every active sound and mute stops all playback', () => {
    const { runtime, instances } = createHarness()
    runtime.play('shake')
    runtime.play('serve')

    expect(runtime.setVolume(0.4)).toBe(0.4)
    expect(instances.every((audio) => audio.volume === 0.4)).toBe(true)

    expect(runtime.setMuted(true)).toBe(true)
    expect(instances.every((audio) => audio.pause.mock.calls.length === 1)).toBe(true)
    expect(runtime.snapshot()).toEqual({ volume: 0.4, muted: true, loopCount: 0, oneShotCount: 0 })

    runtime.play('serve')
    expect(instances).toHaveLength(2)
  })
})
