import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCocktailResponseFromClassified } from '../bartender/engine.js'
import { IntentClassifier, type DialogueContext } from '../bartender/intent-classifier.js'
import { cocktails } from '../cocktails/database.js'
import { pickDialogue } from './dialogue-loader.js'

const classifier = new IntentClassifier(cocktails)
const context: DialogueContext = {
  mentionedCocktails: [],
  sessionPhase: 'conversation',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('phase 7 dialogue response sources', () => {
  it('serves character questions from the dedicated character dialogue pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const classified = classifier.classify('너는 누구야?', context)
    const response = getCocktailResponseFromClassified('너는 누구야?', [], classified)

    expect(classified.intent).toBe('character-query')
    expect(response.response).toBe(pickDialogue('character-query')?.text)
    expect(response.response).toContain('카루아')
    expect(response.response).toContain('바텐더')
  })

  it('asks for a story target instead of inviting the user to keep talking', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const classified = classifier.classify('흔들어서 만들었겠죠?', context)
    const response = getCocktailResponseFromClassified('흔들어서 만들었겠죠?', [], classified)

    expect(classified.intent).toBe('lore-followup')
    expect(response.response).toBe(pickDialogue('story-unresolved')?.text)
    expect(response.response).toMatch(/어느 잔|칵테일 이름|어떤 칵테일/)
    expect(response.response).not.toMatch(/듣고 있어요|계속 하셔도|그다음은요/)
  })

  it('keeps bar, character, and unresolved story sources distinct', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const bar = pickDialogue('bar-intro')?.text
    const character = pickDialogue('character-query')?.text
    const unresolvedStory = pickDialogue('story-unresolved')?.text

    expect(bar).toBeTruthy()
    expect(character).toBeTruthy()
    expect(unresolvedStory).toBeTruthy()
    expect(new Set([bar, character, unresolvedStory]).size).toBe(3)
  })
})
