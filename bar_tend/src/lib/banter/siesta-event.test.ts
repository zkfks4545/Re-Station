import { describe, expect, it } from 'vitest'
import {
  canStartSiestaEvent,
  createSiestaEvent,
  MAX_SIESTA_EVENTS_PER_SESSION,
  SIESTA_EVENT_COOLDOWN_TURNS,
  type SiestaEventContext,
} from './siesta-event.js'

const baseContext: SiestaEventContext = {
  inputText: '오늘 피곤해요',
  replyText: '괜찮으신 만큼만 편하게 말씀해 주세요.',
  inputRoute: 'general',
  userMessageCount: 3,
  eventCount: 0,
  cooldownTurns: 0,
  recommendationActive: false,
}

describe('Siesta banter event engine', () => {
  it('creates a short interrupt-banter-exit sequence with distinct speakers', () => {
    const event = createSiestaEvent(baseContext)

    expect(event).not.toBeNull()
    expect(event).toHaveLength(3)
    expect(event![0]).toMatchObject({ role: 'bartender', speaker: 'siesta' })
    expect(event![1]).toMatchObject({ role: 'bartender', speaker: 'karua' })
    expect(event![2]).toMatchObject({ role: 'bartender', speaker: 'siesta' })
    expect(event![2].text).toMatch(/창고|바닥|재고|잔/)
  })

  it('does not start during active recommendation questions or protected routes', () => {
    expect(createSiestaEvent({ ...baseContext, recommendationActive: true })).toBeNull()
    expect(createSiestaEvent({ ...baseContext, inputRoute: 'safety' })).toBeNull()
    expect(createSiestaEvent({ ...baseContext, inputRoute: 'exit' })).toBeNull()
    expect(createSiestaEvent({ ...baseContext, inputRoute: 'recommendation-cancel' })).toBeNull()
    expect(createSiestaEvent({
      ...baseContext,
      inputRoute: 'safety',
      recommendedCocktailName: '모히토',
    })).toBeNull()
  })

  it('allows a banter event right after a recommendation is completed', () => {
    const event = createSiestaEvent({
      ...baseContext,
      inputRoute: 'recommendation',
      userMessageCount: 1,
      recommendedCocktailName: '모히토',
    })

    expect(event?.[0].text).toBe('잘 골랐네.')
    expect(event?.[event.length - 1]?.text).toContain('재고')
  })

  it('respects per-session frequency and cooldown limits', () => {
    expect(canStartSiestaEvent({
      ...baseContext,
      eventCount: MAX_SIESTA_EVENTS_PER_SESSION,
    })).toBe(false)
    expect(canStartSiestaEvent({
      ...baseContext,
      cooldownTurns: SIESTA_EVENT_COOLDOWN_TURNS,
    })).toBe(false)
  })

  it('keeps early general conversation quiet before enough user turns', () => {
    expect(createSiestaEvent({
      ...baseContext,
      userMessageCount: 1,
    })).toBeNull()
  })
})
