import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Message } from '../../types.js'
import { detectSafetyConcern, getCocktailResponse } from './engine.js'

const DIRECT_COMFORT_OR_ALCOHOL_SOLUTION = [
  /술.*(잊|나아|풀)/,
  /(한\s*잔|마시).*(잊|나아|해결|풀)/,
  /다\s*괜찮아/,
  /분명.*잘/,
  /내려놓는 게 답/,
]

function expectKahluaBoundary(response: string) {
  for (const forbidden of DIRECT_COMFORT_OR_ALCOHOL_SOLUTION) {
    expect(response).not.toMatch(forbidden)
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('neutral runtime dialogue contract', () => {
  it('responds to a difficult mood naturally, not with an alcohol solution', () => {
    const response = getCocktailResponse('오늘 너무 힘들어', []).response

    expect(response).toContain('힘드셨나 봐요')
    expect(response).not.toMatch(/농담|알바|잔/)
    expectKahluaBoundary(response)
  })

  it('keeps every contextual sad-response variant inside the boundary', () => {
    const history: Message[] = [{ role: 'user', text: '오늘 너무 우울해' }]

    for (const random of [0, 0.4, 0.8]) {
      vi.spyOn(Math, 'random').mockReturnValue(random)
      const response = getCocktailResponse('그냥 그렇네', history).response
      expectKahluaBoundary(response)
      vi.restoreAllMocks()
    }
  })

  it('does not encourage reckless drinking when asked for something strong', () => {
    const response = getCocktailResponse('도수 높은 걸로 세게 줘', []).response

    expect(response).toContain('천천히')
    expectKahluaBoundary(response)
  })
})

describe('Kahlua safety boundary', () => {
  it('detects immediate self-harm language', () => {
    expect(detectSafetyConcern('죽고 싶어')).toBe(true)
    expect(detectSafetyConcern('오늘 너무 피곤해')).toBe(false)
  })

  it('puts a direct safety check before cocktail and character banter', () => {
    const response = getCocktailResponse('죽고 싶으니까 독한 칵테일 추천해줘', []).response

    expect(response).toContain('다칠 위험')
    expect(response).toContain('응급 서비스')
    expect(response).not.toContain('추천')
  })
})
