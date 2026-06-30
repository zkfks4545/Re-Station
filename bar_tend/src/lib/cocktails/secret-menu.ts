import type { CocktailData } from '../../types.js'

export interface SecretMenuOrderMatch {
  cocktail: CocktailData
  passphrase: string
}

export function findSecretMenuOrder(
  input: string,
  cocktails: CocktailData[],
): SecretMenuOrderMatch | null {
  const normalizedInput = normalize(input)
  if (!normalizedInput) return null

  for (const cocktail of cocktails) {
    if (!cocktail.secret) continue
    for (const passphrase of cocktail.secretPhrases ?? []) {
      if (normalizedInput.includes(normalize(passphrase))) {
        return { cocktail, passphrase }
      }
    }
  }

  return null
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '')
}
