import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Message } from '../../types.js'
import { detectSafetyConcern, getCocktailResponse } from './engine.js'

const DIRECT_COMFORT_OR_ALCOHOL_SOLUTION = [
  /술.*(잊|나아|풀)/,
  /(한\s*잔|마시).*(잊|나아|해결|풀)/,
  /다\s*괜찮아/,
  /분명.*잘/,
  /내려놓는 게 답/,
  /괜찮아질 거예요/,
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

    expect(response).toMatch(/Re:Station|가상의 바|취향|한 잔|카루아|기분|칵테일/)
  })

  it('handles real venue questions as virtual bar limitations', () => {
    const response = getCocktailResponse('예약이랑 결제는 어떻게 해?', []).response

    expect(response).toMatch(/실제|가상|칵테일|매장|공간/)
    expect(response).not.toMatch(/예약.*가능|결제.*가능|주소/)
  })

  it('introduces Siesta as a background bar worker, not a constant speaker', () => {
    const response = getCocktailResponse('시에스타는 어디 있어?', []).response

    expect(response).toMatch(/시에스타|사장/)
    expect(response).toMatch(/뒤쪽|일|가끔|사장|지나가/)
  })

  it('uses atmosphere dialogue for ordinary bar small talk', () => {
    const result = getCocktailResponse('여기 분위기 좋다', [])

    expect(result.response).toMatch(/분위기|조명|음악|공기|잔/)
    expect(['talk', 'smirk', 'thinking']).toContain(result.expression)
    expectKahluaBoundary(result.response)
  })

  it('uses weather dialogue without starting a recommendation loop', () => {
    const result = getCocktailResponse('밖에 비가 오네', [])

    expect(result.response).toMatch(/날씨|비|밖|잔|소리|시원|산뜻|눈|추운|더운|습한|바람/)
    expect(result.response).not.toContain('추천')
    expectKahluaBoundary(result.response)
  })

  it('handles uncertain casual talk as a bar conversation cue', () => {
    const result = getCocktailResponse('뭐 마실지 모르겠고 그냥 왔어', [])

    expect(result.response).toMatch(/정해진|고민|아무 생각|싫은 것|표정|주문|선택지|방향|첫 단추|그냥|충분해요|이유|첫 모금/)
    expectKahluaBoundary(result.response)
  })

  it('keeps quiet solo visit dialogue low pressure', () => {
    const result = getCocktailResponse('오늘은 혼자 조용히 쉬고 싶어', [])

    expect(result.response).toMatch(/조용|혼자|말없이|향|쉬|잔|가만히|천천히/)
    expectKahluaBoundary(result.response)
  })

  it('responds to a difficult mood naturally, not with an alcohol solution', () => {
    const response = getCocktailResponse('오늘 너무 힘들어', []).response

    expect(response.length).toBeGreaterThan(0)
    expect(response).not.toMatch(/농담|알바/)
    expectKahluaBoundary(response)
  })

  it('routes tired mood to tired-specific dialogue variants', () => {
    const result = getCocktailResponse('오늘 너무 피곤하고 지쳤어', [])

    expect(result.response).toMatch(/피곤|지친|천천히|부담|쉬|가볍게|무리|편한|에너지|자리부터/)
    expect(result.expression).toBe('sympathy')
    expectKahluaBoundary(result.response)
  })

  it('does not let an earlier cocktail mention override the current user input', () => {
    const history: Message[] = [
      { role: 'user', text: '모히토 어때?' },
      { role: 'bartender', text: '모히토를 찾으시는군요.' },
    ]

    const result = getCocktailResponse('오늘 너무 피곤하고 지쳤어', history)

    expect(result.expression).toBe('sympathy')
    expect(result.response).not.toContain('모히토')
  })

  it('still responds to a cocktail mention when it is in the current input', () => {
    const result = getCocktailResponse('모히토 어때?', [])

    expect(result.response).toContain('모히토')
  })

  it('responds to sad mood with sympathy variant', () => {
    for (let i = 0; i < 8; i++) {
      const result = getCocktailResponse('오늘 너무 우울해', [])
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

    expect(response).toMatch(/권하지|멈추|물|쉬/)
    expectKahluaBoundary(response)
  })

  it('does not suggest alcohol to minors or guests who cannot drink', () => {
    const response = getCocktailResponse('나 미성년자인데 술 못 마셔', []).response

    expect(response).toMatch(/알코올|무알코올|술을 제외/)
  })

  it('asks for exact excluded ingredients for allergy-like constraints', () => {
    const response = getCocktailResponse('알레르기 있어서 견과류 빼고', []).response

    expect(response).toMatch(/피해서|제외|빼고|재료|제한/)
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

describe('story/lore query integration — intent preserved through engine', () => {
  const RECOMMEND_TRIGGERS = /선호하는 맛|맛의 방향|추천해드릴게요|골라볼게요/

  it('헤밍웨이가 마시던 게 무슨 칵테일이었는지 알아요? → story-query response, no recommend phrases', () => {
    for (let i = 0; i < 8; i++) {
      const result = getCocktailResponse('헤밍웨이가 마시던 게 무슨 칵테일이었는지 알아요?', [])

      expect(result).toBeDefined()
      expect(result.response.length).toBeGreaterThan(0)
      expect(result.response).not.toMatch(RECOMMEND_TRIGGERS)
      expect(result.expression).toMatch(/talk|thinking/)
    }
  })

  it('헤밍웨이가 좋아하던 게 그거 맞나요? → story-query-followup response, no recommend phrases', () => {
    for (let i = 0; i < 8; i++) {
      const result = getCocktailResponse('헤밍웨이가 좋아하던 게 그거 맞나요?', [])

      expect(result).toBeDefined()
      expect(result.response.length).toBeGreaterThan(0)
      expect(result.response).not.toMatch(RECOMMEND_TRIGGERS)
      expect(result.expression).toMatch(/talk|thinking/)
    }
  })

  it('여기 얽힌 이야기 더 들려줘요 → story-query response, no recommend phrases', () => {
    for (let i = 0; i < 8; i++) {
      const result = getCocktailResponse('여기 얽힌 이야기 더 들려줘요', [])

      expect(result).toBeDefined()
      expect(result.response.length).toBeGreaterThan(0)
      expect(result.response).not.toMatch(RECOMMEND_TRIGGERS)
      expect(result.expression).toMatch(/talk|thinking/)
    }
  })

  it('피카소가 좋아하던 칵테일도 있나요? → story-query response, no recommend phrases, no unrelated lore', () => {
    for (let i = 0; i < 8; i++) {
      const result = getCocktailResponse('피카소가 좋아하던 칵테일도 있나요?', [])

      expect(result).toBeDefined()
      expect(result.response.length).toBeGreaterThan(0)
      expect(result.response).not.toMatch(RECOMMEND_TRIGGERS)
      expect(result.response).not.toContain('헤밍웨이')
      expect(result.response).not.toContain('모히토')
      expect(result.expression).toMatch(/talk|thinking/)
    }
  })
})
