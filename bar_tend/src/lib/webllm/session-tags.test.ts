import { describe, expect, it } from 'vitest'
import { SemanticSessionTagStore } from './session-tags.js'

describe('세션 전용 의미 태그', () => {
  it('현재 세션에서만 중복 없이 유지하고 reset 시 삭제한다', () => {
    const store = new SemanticSessionTagStore()
    store.add(['music', 'quiet', 'music'])
    expect(store.snapshot()).toEqual(['music', 'quiet'])

    store.reset()
    expect(store.snapshot()).toEqual([])
  })
})
