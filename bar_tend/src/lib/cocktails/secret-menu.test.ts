import { describe, expect, it } from 'vitest'
import { cocktails } from './database.js'
import { findSecretMenuOrder } from './secret-menu.js'

describe('secret menu passphrases', () => {
  it.each([
    ['여신의 한잔 줘', 'cocktail_signature_042'],
    ['여신의 한잔을', 'cocktail_signature_042'],
    ['달링의 한잔으로', 'cocktail_signature_042'],
    ['악마의 한잔 부탁해', 'cocktail_signature_042'],
    ['비 오는 밤에 어울리는 걸로', 'cocktail_signature_043'],
    ['인생을 바꾸는 한 잔 줘', 'cocktail_signature_043'],
    ['인생을 바꾸는 한잔을', 'cocktail_signature_043'],
    ['인생을 바꿀 한 잔을', 'cocktail_signature_043'],
    ['인생을 바꿀 한잔을', 'cocktail_signature_043'],
    ['오늘은 이야기를 섞어줘', 'cocktail_signature_043'],
  ])('maps %s to its hidden cocktail', (input, cocktailId) => {
    expect(findSecretMenuOrder(input, cocktails)?.cocktail.id).toBe(cocktailId)
  })

  it('does not use 글리치 by itself as a passphrase', () => {
    expect(findSecretMenuOrder('글리치', cocktails)).toBeNull()
  })

  it('does not use a delegated bartender request as a passphrase', () => {
    expect(findSecretMenuOrder('바텐더에게 맡길게', cocktails)).toBeNull()
  })
})
