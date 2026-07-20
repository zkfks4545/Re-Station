import { describe, expect, it } from 'vitest'
import {
  createSessionAffect,
  expressionForSessionAffect,
  transitionSessionAffect,
} from './session-affect.js'

describe('SessionAffect transition policy', () => {
  it('uses deterministic priority: safety, control, candidate, existing', () => {
    expect(transitionSessionAffect(createSessionAffect('warm'), {
      route: 'safety', input: 'anything', candidate: 'playful',
    }).sessionAffect).toBe('firm')
    expect(transitionSessionAffect(createSessionAffect('concerned'), {
      route: 'recommendation', input: 'recommend', candidate: 'playful',
    }).sessionAffect).toBe('concerned')
    expect(transitionSessionAffect(createSessionAffect('neutral'), {
      route: 'general', input: 'tired', candidate: 'concerned',
    }).sessionAffect).toBe('concerned')
  })

  it('decays temporary affects and keeps guarded until explicit repair', () => {
    expect(transitionSessionAffect({ ...createSessionAffect('warm'), affectTurnsRemaining: 1 }, {
      route: 'general', input: 'ordinary',
    }).sessionAffect).toBe('neutral')
    const guarded = createSessionAffect('guarded')
    expect(transitionSessionAffect(guarded, { route: 'general', input: 'ordinary', candidate: 'warm' }).sessionAffect).toBe('guarded')
    const repaired = transitionSessionAffect(guarded, { route: 'general', input: '미안해', candidate: 'warm' })
    expect(transitionSessionAffect(repaired, { route: 'general', input: '죄송해', candidate: 'warm' }).sessionAffect).toBe('neutral')
  })

  it('limits expressions without forcing response text', () => {
    expect(expressionForSessionAffect('smirk', 'concerned')).toBe('sympathy')
    expect(expressionForSessionAffect('talk', 'guarded')).toBe('annoyed')
    expect(expressionForSessionAffect('stern', 'firm')).toBe('stern')
  })
})
