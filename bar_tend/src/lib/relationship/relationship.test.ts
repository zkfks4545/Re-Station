import { describe, expect, it } from 'vitest'
import {
  applyDelta,
  clampRapport,
  createInitialRapport,
  createUpdateTracker,
  getRapportRange,
  naturalDecay,
  rangeIndex,
  selectVariation,
  updateRapport,
} from './index.js'
import type { VariationCategory } from './index.js'

function update(intent: string, rapport = 4, turn = 1) {
  return updateRapport(rapport, { intent, sessionTurnCount: turn }, createUpdateTracker())
}

describe('RapportState', () => {
  it('초기값은 4다', () => {
    expect(createInitialRapport()).toBe(4)
  })

  it('0~10 정수 범위로 반올림하고 clamp한다', () => {
    expect(clampRapport(-10)).toBe(0)
    expect(clampRapport(15)).toBe(10)
    expect(clampRapport(5.49)).toBe(5)
    expect(clampRapport(5.5)).toBe(6)
  })

  it('delta와 decay 뒤에도 정수 범위를 유지한다', () => {
    expect(applyDelta(9, 2)).toBe(10)
    expect(applyDelta(1, -2)).toBe(0)
    expect(naturalDecay(4)).toBe(4)
  })
})

describe('RapportRange', () => {
  it('새 구간 경계를 정확히 매핑한다', () => {
    expect(getRapportRange(0)).toBe('distant')
    expect(getRapportRange(2)).toBe('distant')
    expect(getRapportRange(3)).toBe('normal')
    expect(getRapportRange(5)).toBe('normal')
    expect(getRapportRange(6)).toBe('warm')
    expect(getRapportRange(8)).toBe('warm')
    expect(getRapportRange(9)).toBe('close')
    expect(getRapportRange(10)).toBe('close')
  })

  it('rangeIndex가 distant → normal → warm → close 순서를 유지한다', () => {
    expect(rangeIndex('distant')).toBe(0)
    expect(rangeIndex('normal')).toBe(1)
    expect(rangeIndex('warm')).toBe(2)
    expect(rangeIndex('close')).toBe(3)
  })
})

describe('updateRapport', () => {
  it.each([
    'general-chat',
    'taste-statement',
    'mood-expression',
    'cocktail-order',
    'story-query',
    'recipe-query',
    'positive-feedback',
  ])('%s는 +1을 적용한다', (intent) => {
    expect(update(intent)).toEqual({ rapport: 5, delta: 1 })
  })

  it.each(['welcome-positive', 'secret-event-success'])('%s는 +2를 적용한다', (intent) => {
    expect(update(intent)).toEqual({ rapport: 6, delta: 2 })
  })

  it.each([
    'recommendation-cancel',
    'negative-feedback',
    'confused',
    'minor-rude',
  ])('%s는 -1을 적용한다', (intent) => {
    expect(update(intent)).toEqual({ rapport: 3, delta: -1 })
  })

  it.each(['severe-rude', 'troll-disruptive'])('%s는 -2를 적용한다', (intent) => {
    expect(update(intent)).toEqual({ rapport: 2, delta: -2 })
  })

  it('SafetyLocked용 safety-alert는 Rapport delta가 아니다', () => {
    expect(update('safety-alert')).toEqual({ rapport: 4, delta: 0 })
  })

  it('max-count 보호를 유지한다', () => {
    const tracker = createUpdateTracker()
    let rapport = 0
    for (let turn = 1; turn <= 6; turn += 1) {
      rapport = updateRapport(rapport, { intent: 'general-chat', sessionTurnCount: turn }, tracker).rapport
    }
    expect(updateRapport(rapport, { intent: 'general-chat', sessionTurnCount: 7 }, tracker)).toEqual({
      rapport: 6,
      delta: 0,
    })
  })

  it('cooldown 보호를 유지한다', () => {
    const tracker = createUpdateTracker()
    const first = updateRapport(5, { intent: 'recommendation-cancel', sessionTurnCount: 1 }, tracker)
    const blocked = updateRapport(first.rapport, { intent: 'recommendation-cancel', sessionTurnCount: 2 }, tracker)
    const resumed = updateRapport(blocked.rapport, { intent: 'recommendation-cancel', sessionTurnCount: 3 }, tracker)
    expect(first.delta).toBe(-1)
    expect(blocked.delta).toBe(0)
    expect(resumed.delta).toBe(-1)
  })
})

describe('dialogueSelectVariation', () => {
  const categories: VariationCategory[] = [
    {
      category: 'greeting',
      variations: [
        { rangeMin: 'distant', rangeMax: 'distant', text: '어서 오세요.', expression: 'talk' },
        { rangeMin: 'distant', rangeMax: 'normal', text: '어서 오세요. 기다리고 있었어요.', expression: 'smirk' },
        { rangeMin: 'normal', rangeMax: 'close', text: '또 오셨네요! 오늘은 뭐 드실래요?', expression: 'smirk' },
      ],
    },
  ]

  it('distant 구간 변이를 선택한다', () => {
    const result = selectVariation(categories, 'greeting', 1, 'fixed-seed')
    expect(['어서 오세요.', '어서 오세요. 기다리고 있었어요.']).toContain(result?.text)
  })

  it('close 구간 변이를 선택한다', () => {
    expect(selectVariation(categories, 'greeting', 10, 'fixed-seed')?.text)
      .toBe('또 오셨네요! 오늘은 뭐 드실래요?')
  })

  it('존재하지 않는 카테고리는 null을 반환한다', () => {
    expect(selectVariation(categories, 'nonexistent', 4)).toBeNull()
  })
})

describe('Rapport 경계 독립성', () => {
  it('Rapport 갱신은 입력 context와 tracker 외의 도메인 상태를 받거나 반환하지 않는다', () => {
    const result = update('general-chat')
    expect(Object.keys(result).sort()).toEqual(['delta', 'rapport'])
  })
})
