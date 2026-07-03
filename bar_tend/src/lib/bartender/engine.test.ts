import { afterEach, describe, expect, it, vi } from 'vitest'
import dialoguesData from '../../data/dialogues.json'
import type { DialoguesData, Message } from '../../types.js'
import { cocktails, findCocktailByName } from '../cocktails/database.js'
import { detectSafetyConcern, getCocktailResponse, getCocktailResponseFromClassified } from './engine.js'
import { IntentClassifier, type DialogueContext } from './intent-classifier.js'

const DIRECT_COMFORT_OR_ALCOHOL_SOLUTION = [
  /술.*(잊|나아|풀)/,
  /(한\s*잔|마시).*(잊|나아|해결|풀)/,
  /다\s*괜찮아/,
  /분명.*잘/,
  /내려놓는 게 답/,
  /괜찮아질 거예요/,
]

const MOOD_TIRED_TEXTS = (dialoguesData as DialoguesData).categories['mood-tired'].lines
  .map((line) => line.text)
const BAR_INTRO_TEXTS = (dialoguesData as DialoguesData).categories['bar-intro'].lines
  .map((line) => line.text)
const CHARACTER_QUERY_TEXTS = (dialoguesData as DialoguesData).categories['character-query'].lines
  .map((line) => line.text)
const SIESTA_MENTION_TEXTS = (dialoguesData as DialoguesData).categories['siesta-mention'].lines
  .map((line) => line.text)

function expectKahluaBoundary(response: string) {
  for (const forbidden of DIRECT_COMFORT_OR_ALCOHOL_SOLUTION) {
    expect(response).not.toMatch(forbidden)
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('neutral runtime dialogue contract', () => {
  it('uses a supplied unified classification without classifying the input again', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const context: DialogueContext = { mentionedCocktails: [], sessionPhase: 'conversation' }
    const classified = new IntentClassifier(cocktails).classify('여기 분위기 좋다', context)
    const result = getCocktailResponseFromClassified('오늘 너무 피곤해', [], classified)

    expect(classified.intent).toBe('bar-atmosphere')
    expect(result.response).toContain('분위기')
  })

  it('uses a referenced cocktail for an omitted-name story follow-up', () => {
    const context: DialogueContext = { mentionedCocktails: [], sessionPhase: 'conversation' }
    const classified = new IntentClassifier(cocktails).classify('그 이야기 더 들려줘', context)
    const mojito = findCocktailByName('모히토')!
    const result = getCocktailResponseFromClassified('그 이야기 더 들려줘', [], classified, mojito)

    expect(result.response).toContain(mojito.name)
    expect(mojito.talkingPoints?.some((point) => result.response.includes(point))).toBe(true)
  })

  it('explains the virtual bar setting without pretending to be a real venue', () => {
    const response = getCocktailResponse('여기 뭐하는 곳이야?', []).response

    expect(BAR_INTRO_TEXTS).toContain(response)
  })

  it.each([
    '여긴 뭐죠',
    '여긴 뭐하는 곳인가요',
    '여긴 뭐하는 바인가요',
    'Re:Station이 뭐예요',
  ])('routes bar-setting variant "%s" to bar-intro', (input) => {
    const context: DialogueContext = { mentionedCocktails: [], sessionPhase: 'conversation' }
    const classified = new IntentClassifier(cocktails).classify(input, context)
    const response = getCocktailResponseFromClassified(input, [], classified).response

    expect(classified.intent).toBe('bar-setting')
    expect(BAR_INTRO_TEXTS).toContain(response)
  })

  it.each([
    '당신은 누구예요',
    '카루아는 뭐하는 사람이에요',
    '여기 직원은 누구예요',
  ])('routes character variant "%s" to character-query', (input) => {
    const context: DialogueContext = { mentionedCocktails: [], sessionPhase: 'conversation' }
    const classified = new IntentClassifier(cocktails).classify(input, context)
    const response = getCocktailResponseFromClassified(input, [], classified).response

    expect(classified.intent).toBe('character-query')
    expect(CHARACTER_QUERY_TEXTS).toContain(response)
  })

  it('keeps Siesta identity questions on the dedicated character path', () => {
    const input = '시에스타는 누구예요'
    const context: DialogueContext = { mentionedCocktails: [], sessionPhase: 'conversation' }
    const classified = new IntentClassifier(cocktails).classify(input, context)
    const response = getCocktailResponseFromClassified(input, [], classified).response

    expect(classified.intent).toBe('siesta-setting')
    expect(SIESTA_MENTION_TEXTS).toContain(response)
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

    expect(result.response).toMatch(/분위기|조명|음악|공기|잔|어둡|느리|수상|좋은 곳/)
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

    expect(MOOD_TIRED_TEXTS).toContain(result.response)
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

  it('responds to happy mood with smirk expression', () => {
    for (let i = 0; i < 8; i++) {
      const result = getCocktailResponse('오늘 진짜 행복해', [])
      expect(result).toBeDefined()
      expect(result.response.length).toBeGreaterThan(0)
      expect(result.expression).toBe('smirk')
      expectKahluaBoundary(result.response)
    }
  })

  it('detects all mood keywords from MOOD_KEYWORD_MAP correctly through the engine pipeline', () => {
    const tiredCases = ['오늘 너무 지쳤어', '오늘 너무 피곤하고 지쳤어']
    for (const input of tiredCases) {
      const result = getCocktailResponse(input, [])
      expect(result.expression, `tired case: "${input}"`).toBe('sympathy')
    }
    const sadCases = ['요즘 너무 우울해', '오늘 왜 이렇게 슬퍼']
    for (const input of sadCases) {
      const result = getCocktailResponse(input, [])
      expect(result.expression, `sad case: "${input}"`).toBe('sympathy')
    }
    const happyCase = '오늘 진짜 행복해'
    const result = getCocktailResponse(happyCase, [])
    expect(result.expression, `happy case: "${happyCase}"`).toBe('smirk')
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

  it('does not use dedicated minor or non-alcoholic service replies', () => {
    const minorResponse = getCocktailResponse('나 미성년자인데 술 못 마셔', []).response
    const nonAlcoholicResponse = getCocktailResponse('무알코올로 마실래', []).response

    expect(minorResponse).not.toMatch(/미성년|무알코올|알코올은 안내/)
    expect(nonAlcoholicResponse).not.toMatch(/무알코올 쪽|논알코올|알코올 없이/)
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

  describe('order-cocktail with shake reference', () => {
    const context: DialogueContext = { mentionedCocktails: [], sessionPhase: 'conversation' }

    it('"마티니한잔 젓지말고 흔들어서" → order-cocktail, not cocktail-info', () => {
      const classified = new IntentClassifier(cocktails).classify('마티니한잔 젓지말고 흔들어서', context)
      expect(classified.intent).toBe('order-cocktail')
    })

    it('"마티니 한 잔 본드식으로" → order-cocktail with shake response', () => {
      const classified = new IntentClassifier(cocktails).classify('마티니 한 잔 본드식으로', context)
      expect(classified.intent).toBe('order-cocktail')
    })

    it('order-cocktail + shake reference → acknowledges 제조방식 in response', () => {
      const classified = new IntentClassifier(cocktails).classify('마티니한잔 젓지말고 흔들어서', context)
      const result = getCocktailResponseFromClassified('마티니한잔 젓지말고 흔들어서', [], classified)
      expect(result.response).toContain('본드식')
      expect(result.response).toContain('흔들')
      expect(result.response).toContain('마티니')
      expect(result.response).toContain('준비할게요')
    })
  })

  describe('lore-followup regression', () => {
    const context: DialogueContext = { mentionedCocktails: [], sessionPhase: 'conversation' }

    it('Martini + lore-followup intent → 007 response', () => {
      const classified = new IntentClassifier(cocktails).classify('젓지말고 흔들어서 만들었겠죠?', context)
      expect(classified.intent).toBe('lore-followup')

      const martini = findCocktailByName('마티니')!
      const result = getCocktailResponseFromClassified('젓지말고 흔들어서 만들었겠죠?', [], classified, martini)

      expect(result.response).toContain('007')
      expect(result.response).toContain('본드')
      expect(result.response).toContain('흔들')
      expect(result.expression).toBe('smirk')
    })

    it('no prior cocktail + lore-followup → asks for a cocktail target', () => {
      const classified = new IntentClassifier(cocktails).classify('흔들어서 만들었겠죠?', context)
      expect(classified.intent).toBe('lore-followup')

      const result = getCocktailResponseFromClassified('흔들어서 만들었겠죠?', [], classified)

      expect(result.response).toBeTruthy()
      expect(result.response).not.toContain('007')
      expect(result.response).not.toContain('본드')
      expect(result.response).toMatch(/잔|칵테일|이름|실마리/)
      expect(result.response).not.toMatch(/듣고 있어요|계속 하셔도/)
    })
  })
})
