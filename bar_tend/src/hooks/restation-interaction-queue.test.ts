import { describe, expect, it } from 'vitest'
import { createRestationInteractionQueue } from './restation-interaction-queue.js'

describe('Restation interaction queue', () => {
  it('keeps FIFO order for repeatable interactions', () => {
    const queue = createRestationInteractionQueue()

    expect(queue.enqueue({ type: 'send', text: 'first' })).toBe(true)
    expect(queue.enqueue({ type: 'send', text: 'second' })).toBe(true)
    expect(queue.shift()).toEqual({ type: 'send', text: 'first' })
    expect(queue.shift()).toEqual({ type: 'send', text: 'second' })
  })

  it.each(['welcome-drink', 'story-from-card', 'cancel-recommendation'] as const)(
    'deduplicates queued %s interactions',
    (type) => {
      const queue = createRestationInteractionQueue()
      const interaction = type === 'story-from-card'
        ? { type, cocktail: {} as never }
        : { type }

      expect(queue.enqueue(interaction)).toBe(true)
      expect(queue.enqueue(interaction)).toBe(false)
      expect(queue.shift()).toBe(interaction)
      expect(queue.shift()).toBeUndefined()
    },
  )

  it('clears queued work and its scheduled marker together', () => {
    const queue = createRestationInteractionQueue()
    queue.enqueue({ type: 'send', text: 'pending' })
    queue.setScheduled(true)

    queue.clear()

    expect(queue.shift()).toBeUndefined()
    expect(queue.isScheduled()).toBe(false)
  })
})
