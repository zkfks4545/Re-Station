import { describe, expect, it } from 'vitest'
import {
  createKaruaPresentationCue,
  getKaruaPresentationLabel,
  getNextKaruaFrameIndex,
  shouldCycleKaruaFrames,
} from './karua-presentation.js'

describe('Karua presentation cue contract', () => {
  it('keeps expression and speaking metadata independent from action', () => {
    expect(createKaruaPresentationCue({ expression: 'smirk', speaking: true })).toEqual({
      action: 'idle',
      expression: 'smirk',
      speaking: true,
    })
    expect(createKaruaPresentationCue({ action: 'serving', expression: 'smirk' })).toEqual({
      action: 'serving',
      expression: 'smirk',
      speaking: false,
    })
  })

  it('gives structured action labels priority over speech and expression labels', () => {
    expect(getKaruaPresentationLabel(createKaruaPresentationCue({
      action: 'mixing', expression: 'thinking', speaking: true,
    }))).toBe('SHAKING')
    expect(getKaruaPresentationLabel(createKaruaPresentationCue({
      action: 'serving', expression: 'thinking', speaking: true,
    }))).toBe('SERVE')
    expect(getKaruaPresentationLabel(createKaruaPresentationCue({
      expression: 'thinking', speaking: true,
    }))).toBe('TALK')
    expect(getKaruaPresentationLabel(createKaruaPresentationCue({ expression: 'thinking' }))).toBe('THINKING')
  })

  it('cycles only mixing frames and stops the JavaScript loop for reduced motion', () => {
    const mixing = createKaruaPresentationCue({ action: 'mixing', expression: 'smirk' })
    const serving = createKaruaPresentationCue({ action: 'serving', expression: 'smirk' })

    expect(shouldCycleKaruaFrames(mixing.action, false)).toBe(true)
    expect(shouldCycleKaruaFrames(mixing.action, true)).toBe(false)
    expect(shouldCycleKaruaFrames(serving.action, false)).toBe(false)
    expect(getNextKaruaFrameIndex(2, 3)).toBe(0)
    expect(getNextKaruaFrameIndex(0, 0)).toBe(0)
  })
})
