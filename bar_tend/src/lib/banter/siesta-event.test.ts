import { describe, expect, it } from 'vitest'
import {
  canStartSiestaEvent,
  createSiestaEvent,
  DIALOGUE_POOLS,
  MAX_SIESTA_EVENTS_PER_SESSION,
  SIESTA_EVENT_COOLDOWN_TURNS,
  selectBranch,
  selectDialogueSet,
  type SiestaBranch,
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
  describe('createSiestaEvent', () => {
    it('creates a short interrupt-banter-exit-return sequence with distinct speakers', () => {
      const result = createSiestaEvent(baseContext)
      expect(result).not.toBeNull()
      expect(result!.messages).toHaveLength(4)
      expect(result!.messages[0]).toMatchObject({ role: 'bartender', speaker: 'siesta' })
      expect(result!.messages[1]).toMatchObject({ role: 'bartender', speaker: 'karua' })
      expect(result!.messages[2]).toMatchObject({ role: 'bartender', speaker: 'siesta' })
      expect(result!.messages[3]).toMatchObject({ role: 'bartender', speaker: 'karua' })
      expect(result!.messages[3].text.trim().length).toBeGreaterThan(0)
    })

    it('returns the conversation back to Karua after Siesta exits', () => {
      const result = createSiestaEvent(baseContext)
      expect(result).not.toBeNull()
      expect(result!.messages[result!.messages.length - 1]).toMatchObject({ speaker: 'karua' })
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
      const result = createSiestaEvent({
        ...baseContext,
        inputRoute: 'recommendation',
        userMessageCount: 1,
        recommendedCocktailName: '모히토',
      })
      expect(result).not.toBeNull()
      expect(result!.branch).toBe('recommendation')
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

  describe('selectBranch', () => {
    it('returns recommendation branch when cocktail name is present', () => {
      expect(selectBranch({ ...baseContext, recommendedCocktailName: '모히토' })).toBe('recommendation')
    })

    it('returns strong branch on strong drink keywords', () => {
      expect(selectBranch({ ...baseContext, inputText: '독한 걸로 추천해줘' })).toBe('strong')
      expect(selectBranch({ ...baseContext, inputText: '도수 높은 거' })).toBe('strong')
      expect(selectBranch({ ...baseContext, inputText: '강한 걸로' })).toBe('strong')
      expect(selectBranch({ ...baseContext, inputText: '세게 한잔' })).toBe('strong')
      expect(selectBranch({ ...baseContext, inputText: '쎈 거' })).toBe('strong')
    })

    it('returns tired branch on tired keywords', () => {
      expect(selectBranch({ ...baseContext, inputText: '오늘 너무 피곤해요' })).toBe('tired')
      expect(selectBranch({ ...baseContext, inputText: '지쳤어요' })).toBe('tired')
      expect(selectBranch({ ...baseContext, inputText: '퇴근하고 싶다' })).toBe('tired')
      expect(selectBranch({ ...baseContext, inputText: '요즘 힘들어요' })).toBe('tired')
    })

    it('returns celebration branch on celebration keywords', () => {
      expect(selectBranch({ ...baseContext, inputText: '오늘 생일이에요' })).toBe('celebration')
      expect(selectBranch({ ...baseContext, inputText: '기념일이에요' })).toBe('celebration')
      expect(selectBranch({ ...baseContext, inputText: '축하 좀 해줘' })).toBe('celebration')
      expect(selectBranch({ ...baseContext, inputText: '특별한 날이라서' })).toBe('celebration')
    })

    it('returns sweet branch on sweet keywords', () => {
      expect(selectBranch({ ...baseContext, inputText: '달콤한 거' })).toBe('sweet')
      expect(selectBranch({ ...baseContext, inputText: '달게 먹고 싶어요' })).toBe('sweet')
      expect(selectBranch({ ...baseContext, inputText: '디저트 같은 칵테일' })).toBe('sweet')
      expect(selectBranch({ ...baseContext, inputText: '달달한 게 땡겨' })).toBe('sweet')
      expect(selectBranch({ ...baseContext, inputText: '스위트한 걸로' })).toBe('sweet')
    })

    it('returns sad branch on sad keywords', () => {
      expect(selectBranch({ ...baseContext, inputText: '요즘 좀 슬프네' })).toBe('sad')
      expect(selectBranch({ ...baseContext, inputText: '슬퍼요' })).toBe('sad')
      expect(selectBranch({ ...baseContext, inputText: '우울하다' })).toBe('sad')
      expect(selectBranch({ ...baseContext, inputText: '속상해요' })).toBe('sad')
      expect(selectBranch({ ...baseContext, inputText: '울적하네' })).toBe('sad')
      expect(selectBranch({ ...baseContext, inputText: '기분이 서운해요' })).toBe('sad')
    })

    it('returns default branch when no keywords match', () => {
      expect(selectBranch({ ...baseContext, inputText: '안녕하세요' })).toBe('default')
      expect(selectBranch({ ...baseContext, inputText: '날씨 좋네요' })).toBe('default')
    })
  })

  describe('selectDialogueSet', () => {
    it('returns a valid set from the pool for each branch', () => {
      const branches: SiestaBranch[] = ['recommendation', 'strong', 'tired', 'celebration', 'sweet', 'sad', 'default']
      for (const branch of branches) {
        const { set, key } = selectDialogueSet(branch, new Set())
        expect(set).toHaveLength(4)
        expect(key).toContain(branch)
        expect(DIALOGUE_POOLS[branch]).toContainEqual(set)
      }
    })

    it('avoids recently used keys when alternatives exist', () => {
      const branch: SiestaBranch = 'default'
      const recentKeys = new Set<string>(['default:0', 'default:1', 'default:2'])
      const { key } = selectDialogueSet(branch, recentKeys)
      expect(key).toBe('default:3')
    })

    it('falls back to random pick when all sets are recent', () => {
      const branch: SiestaBranch = 'tired'
      const allKeys = DIALOGUE_POOLS[branch].map((_, i) => `tired:${i}`)
      const { key } = selectDialogueSet(branch, new Set(allKeys))
      expect(key).toMatch(/^tired:/)
    })
  })

  describe('dialogue pool coverage', () => {
    it('each branch has at least 2 dialogue sets for variety', () => {
      for (const pool of Object.values(DIALOGUE_POOLS)) {
        expect(pool.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('each dialogue set has exactly 4 lines with valid speakers', () => {
      for (const pool of Object.values(DIALOGUE_POOLS)) {
        for (const set of pool) {
          expect(set).toHaveLength(4)
          expect(set[0][0]).toBe('siesta')
          expect(set[1][0]).toBe('karua')
          expect(set[2][0]).toBe('siesta')
          expect(set[3][0]).toBe('karua')
          expect(set[0][1].trim().length).toBeGreaterThan(0)
          expect(set[1][1].trim().length).toBeGreaterThan(0)
          expect(set[2][1].trim().length).toBeGreaterThan(0)
          expect(set[3][1].trim().length).toBeGreaterThan(0)
        }
      }
    })
  })
})
