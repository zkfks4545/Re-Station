import type { QueuedInteraction } from './restation-controller-model.js'

const SINGLE_INSTANCE_TYPES = new Set<QueuedInteraction['type']>([
  'welcome-drink',
  'story-from-card',
  'cancel-recommendation',
])

export interface RestationInteractionQueue {
  enqueue(interaction: QueuedInteraction): boolean
  shift(): QueuedInteraction | undefined
  clear(): void
  isScheduled(): boolean
  setScheduled(value: boolean): void
}

export function createRestationInteractionQueue(): RestationInteractionQueue {
  const items: QueuedInteraction[] = []
  let scheduled = false

  return {
    enqueue(interaction) {
      if (
        SINGLE_INSTANCE_TYPES.has(interaction.type) &&
        items.some((item) => item.type === interaction.type)
      ) return false

      items.push(interaction)
      return true
    },
    shift() {
      return items.shift()
    },
    clear() {
      items.splice(0)
      scheduled = false
    },
    isScheduled() {
      return scheduled
    },
    setScheduled(value) {
      scheduled = value
    },
  }
}
