import { describe, expect, it } from 'vitest'
import { resolveContinuation } from './continuation-resolver.js'

describe('continuation resolver', () => {
  it('restores a cocktail story follow-up from the current subject', () => {
    expect(resolveContinuation('더 들려줘', {
      topic: 'cocktail-story', affect: 'neutral', pendingQuestion: null,
      subject: { type: 'cocktail', id: 'paloma' }, recommendationActive: false, safetyLocked: false,
    })).toBe('story-query-followup')
  })

  it('does not infer a continuation without a matching topic', () => {
    expect(resolveContinuation('더 들려줘', {
      topic: 'smalltalk', affect: 'neutral', pendingQuestion: null,
      subject: { type: 'none', id: null }, recommendationActive: false, safetyLocked: false,
    })).toBeNull()
  })

  it('restores a character follow-up after world-building talk', () => {
    expect(resolveContinuation('당신은?', {
      topic: 'world-building', affect: 'neutral', pendingQuestion: null,
      subject: { type: 'none', id: null }, recommendationActive: false, safetyLocked: false,
    })).toBe('character-query')
  })
})
