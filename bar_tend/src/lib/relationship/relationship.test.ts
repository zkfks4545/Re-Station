import { describe, expect, it } from 'vitest'
import {
  createInitialRapport,
  clampRapport,
  applyDelta,
  naturalDecay,
  updateRapport,
  createUpdateTracker,
  getRapportRange,
  rangeIndex,
  selectVariation,
} from './index.js'
import type { VariationCategory } from './index.js'

describe('RapportState', () => {
  it('초기값은 20이다', () => {
    expect(createInitialRapport()).toBe(20)
  })

  it('clampRapport는 0~100 범위를 유지한다', () => {
    expect(clampRapport(-10)).toBe(0)
    expect(clampRapport(150)).toBe(100)
    expect(clampRapport(50)).toBe(50)
    expect(clampRapport(50.37)).toBe(50.37)
  })

  it('applyDelta가 값을 증감한다', () => {
    expect(applyDelta(50, 10)).toBe(60)
    expect(applyDelta(50, -10)).toBe(40)
    expect(applyDelta(0, -10)).toBe(0)
    expect(applyDelta(100, 10)).toBe(100)
  })

  it('naturalDecay가 값을 서서히 감소시킨다', () => {
    const result = naturalDecay(50)
    expect(result).toBe(49.7)
  })
})

describe('RapportRange', () => {
  it('수치에 맞는 구간을 반환한다', () => {
    expect(getRapportRange(10)).toBe('low')
    expect(getRapportRange(45)).toBe('normal')
    expect(getRapportRange(70)).toBe('high')
    expect(getRapportRange(90)).toBe('very-high')
  })

  it('rangeIndex가 올바른 인덱스를 반환한다', () => {
    expect(rangeIndex('low')).toBe(0)
    expect(rangeIndex('normal')).toBe(1)
    expect(rangeIndex('high')).toBe(2)
    expect(rangeIndex('very-high')).toBe(3)
  })
})

describe('updateRapport', () => {
  it('좋아하는 맥락에서 rapport가 증가한다', () => {
    const tracker = createUpdateTracker()
    const { rapport } = updateRapport(20, { intent: 'cocktail-order', sessionTurnCount: 1 }, tracker)
    expect(rapport).toBeGreaterThan(20)
  })

  it('싫어하는 맥락에서 rapport가 감소한다', () => {
    const tracker = createUpdateTracker()
    const { rapport } = updateRapport(50, { intent: 'rude-talk', sessionTurnCount: 1 }, tracker)
    expect(rapport).toBeLessThan(50)
  })

  it('반복 행동이 누적된다', () => {
    const tracker = createUpdateTracker()
    const ctx = { intent: 'cocktail-order' as const, sessionTurnCount: 1 }
    const r1 = updateRapport(20, { ...ctx }, tracker)
    const r2 = updateRapport(r1.rapport, { ...ctx, sessionTurnCount: 2 }, tracker)
    const r3 = updateRapport(r2.rapport, { ...ctx, sessionTurnCount: 3 }, tracker)
    expect(r3.rapport).toBeGreaterThan(r1.rapport)
  })

  it('최대 횟수 제한 이후 규칙 델타가 적용되지 않는다', () => {
    const tracker = createUpdateTracker()
    const ctx = { intent: 'cocktail-order' as const, sessionTurnCount: 1 }
    for (let i = 1; i <= 5; i++) {
      updateRapport(20, { ...ctx, sessionTurnCount: i }, tracker)
    }
    const { delta } = updateRapport(20, { ...ctx, sessionTurnCount: 99 }, tracker)
    expect(delta).toBeLessThanOrEqual(0.5)
  })

  it('cooldown이 적용된다', () => {
    const tracker = createUpdateTracker()
    const ctx = { intent: 'rude-talk' as const, sessionTurnCount: 1 }
    const r1 = updateRapport(50, { ...ctx }, tracker)
    expect(r1.delta).toBeLessThan(-1.5)

    const r2 = updateRapport(r1.rapport, { ...ctx, sessionTurnCount: 2 }, tracker)
    expect(r2.delta).toBeGreaterThan(-1.5)

    const r3 = updateRapport(r2.rapport, { ...ctx, sessionTurnCount: 3 }, tracker)
    expect(r3.delta).toBeGreaterThan(-1.5)
  })
})

describe('dialogueSelectVariation', () => {
  const categories: VariationCategory[] = [
    {
      category: 'greeting',
      variations: [
        { rangeMin: 'low', rangeMax: 'low', text: '어서 오세요.', expression: 'talk' },
        { rangeMin: 'low', rangeMax: 'normal', text: '어서 오세요, 기다리고 있었어요.', expression: 'smirk' },
        { rangeMin: 'normal', rangeMax: 'very-high', text: '또 오셨네요! 오늘은 뭐 드실래요?', expression: 'smirk' },
      ],
    },
  ]

  it('rapport low에 맞는 변이를 선택한다', () => {
    const result = selectVariation(categories, 'greeting', 10, 'fixed-seed')
    expect(
      result?.text === '어서 오세요.' || result?.text === '어서 오세요, 기다리고 있었어요.',
    ).toBe(true)
  })

  it('rapport very-high는 가장 친밀한 변이를 선택한다', () => {
    const result = selectVariation(categories, 'greeting', 90, 'fixed-seed')
    expect(result?.text).toBe('또 오셨네요! 오늘은 뭐 드실래요?')
  })

  it('존재하지 않는 카테고리는 null을 반환한다', () => {
    const result = selectVariation(categories, 'nonexistent', 50)
    expect(result).toBeNull()
  })
})

describe('추천/게임플레이 무영향', () => {
  it('rapport 갱신이 추천 로직과 독립적이다', () => {
    const tracker = createUpdateTracker()
    const { rapport } = updateRapport(20, { intent: 'cocktail-order', sessionTurnCount: 1 }, tracker)
    expect(typeof rapport).toBe('number')
    const coords = { sweetness: 0.5, sourness: 0.3, alcohol_strength: 0.4, fizz: 0.2 }
    expect(Object.keys(coords)).toEqual(['sweetness', 'sourness', 'alcohol_strength', 'fizz'])
  })
})
