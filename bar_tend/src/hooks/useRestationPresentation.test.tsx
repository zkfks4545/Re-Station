import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CocktailData } from '@/types.js'
import type { TimerRegistry } from '@/lib/timing/timer-registry.js'
import { KARUA_SERVING_CUE_DURATION_MS } from '@/lib/presentation/karua-presentation.js'
import {
  COCKTAIL_PREPARATION_DELAY_MS,
  COCKTAIL_PREPARATION_DURATION_MS,
} from './restation-controller-model.js'
import { useRestationPresentation } from './useRestationPresentation.js'

describe('useRestationPresentation cue scheduling', () => {
  it('orders mixing audio, serving cue, and reply without reading dialogue text', () => {
    const scheduled: Array<{ callback: () => void; delay: number }> = []
    const timerRegistry: TimerRegistry = {
      schedule: vi.fn((callback: () => void, delay: number) => {
        scheduled.push({ callback, delay })
        return 1 as unknown as ReturnType<typeof setTimeout>
      }),
      clearAll: vi.fn(),
      size: () => scheduled.length,
    }
    const sfx = {
      play: vi.fn(),
      stop: vi.fn(),
      stopAll: vi.fn(),
      setVolume: vi.fn(),
      setMuted: vi.fn(),
      volume: 0.65,
      muted: false,
    }
    const appendMessage = vi.fn()
    let bartenderReply: ReturnType<typeof useRestationPresentation>['bartenderReply'] | undefined

    function Harness() {
      ({ bartenderReply } = useRestationPresentation({
        sfx,
        timerRegistry: { current: timerRegistry },
        appendMessage,
      }))
      return null
    }

    renderToStaticMarkup(<Harness />)
    bartenderReply?.('이 잔으로 가죠.', 'smirk', { id: 'test' } as CocktailData)

    expect(sfx.stopAll).toHaveBeenCalledOnce()
    expect(scheduled[0].delay).toBe(COCKTAIL_PREPARATION_DELAY_MS)

    scheduled[0].callback()
    expect(sfx.play).toHaveBeenCalledWith('shake')
    expect(scheduled[1].delay).toBe(COCKTAIL_PREPARATION_DURATION_MS)

    scheduled[1].callback()
    expect(sfx.stop).toHaveBeenCalledWith('shake')
    expect(appendMessage).toHaveBeenCalledWith({ role: 'bartender', text: '이 잔으로 가죠.', speaker: 'karua' })
    expect(scheduled.some(({ delay }) => delay === KARUA_SERVING_CUE_DURATION_MS)).toBe(true)
  })
})
