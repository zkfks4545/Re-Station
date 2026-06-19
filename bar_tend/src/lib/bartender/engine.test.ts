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
  it('explains the virtual bar setting without pretending to be a real venue', () => {
    const response = getCocktailResponse('여기 뭐하는 곳이야?', []).response

    expect(response).toContain('Re:Station')
    expect(response).toMatch(/가상의 바|취향|한 잔/)
  })

  it('handles real venue questions as virtual bar limitations', () => {
    const response = getCocktailResponse('예약이랑 결제는 어떻게 해?', []).response

    expect(response).toContain('실제')
    expect(response).not.toMatch(/예약.*가능|결제.*가능|주소/)
  })

  it('introduces Siesta as a background bar worker, not a constant speaker', () => {
    const response = getCocktailResponse('시에스타는 어디 있어?', []).response

    expect(response).toContain('시에스타')
    expect(response).toMatch(/뒤쪽|일|가끔|사장/)
  })

  it('responds to a difficult mood naturally, not with an alcohol solution', () => {
    const response = getCocktailResponse('오늘 너무 힘들어', []).response

    expect(response.length).toBeGreaterThan(0)
    expect(response).not.toMatch(/농담|알바|잔/)
    expectKahluaBoundary(response)
  })

  it('routes tired mood to tired-specific dialogue variants', () => {
    const result = getCocktailResponse('오늘 너무 피곤하고 지쳤어', [])

    expect(result.response).toMatch(/피곤|지친|천천히|부담|쉬|가볍게/)
    expect(result.expression).toBe('sympathy')
    expectKahluaBoundary(result.response)
  })

  it('keeps every contextual sad-response variant inside the boundary', () => {
    const history: Message[] = [{ role: 'user', text: '오늘 너무 우울해' }]

    for (let i = 0; i < 8; i++) {
      const result = getCocktailResponse('그냥 그렇네', history)
      expect(result).toBeDefined()
      expect(result.response.length).toBeGreaterThan(0)
      expect(result.expression).toBe('sympathy')
      expectKahluaBoundary(result.response)
    }
  })

  it('does not encourage reckless drinking when asked for something strong', () => {
    const response = getCocktailResponse('도수 높은 걸로 세게 줘', []).response

    expect(response.length).toBeGreaterThan(0)
    expectKahluaBoundary(response)
  })

  it('stops offering alcohol when the guest says they are already drunk', () => {
    const response = getCocktailResponse('나 너무 취했어', []).response

    expect(response).toContain('권하지 않을게요')
    expect(response).toContain('물')
    expectKahluaBoundary(response)
  })

  it('does not suggest alcohol to minors or guests who cannot drink', () => {
    const response = getCocktailResponse('나 미성년자인데 술 못 마셔', []).response

    expect(response).toContain('알코올은 안내하지 않을게요')
    expect(response).toContain('무알코올')
  })

  it('asks for exact excluded ingredients for allergy-like constraints', () => {
    const response = getCocktailResponse('알레르기 있어서 견과류 빼고', []).response

    expect(response).toMatch(/피해서|제외/)
    expect(response).toContain('재료')
  })

  it('returns expanded expressions for rude or boundary-crossing language', () => {
    expect(getCocktailResponse('시끄러 닥쳐', []).expression).toBe('annoyed')
    expect(getCocktailResponse('당장 가져와', []).expression).toBe('stern')
    expect(getCocktailResponse('별로야 마음에 안 들어', []).expression).toBe('disappointed')
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
    expect(response).toContain('1393')
    expect(response).not.toContain('추천')
  })
})
