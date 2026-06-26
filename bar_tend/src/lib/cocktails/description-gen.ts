import type { CocktailFeatures } from '../../types/cocktail-db.js'

interface RecipeInfo {
  baseSpirit?: string
  ingredients: string[]
  features: CocktailFeatures
}

const FLAVOR_MAP: Record<string, string[]> = {
  sweet: ['달콤한', '달고 부드러운'],
  sour: ['상큼한', '산뜻한'],
  bitter: ['쌉싸름한', '깊은'],
  fizz: ['청량한', '톡 쏘는'],
}

const STRENGTH_LABELS: Record<number, string> = {
  0: '가벼운',
  1: '부드러운',
  2: '은은한',
  3: '균형 잡힌',
  4: '진한',
  5: '강렬한',
}

function pickAdjective(key: string, value: number): string {
  const options = FLAVOR_MAP[key]
  if (!options) return ''
  const idx = value >= 0.6 ? 0 : 1
  return options[idx] ?? options[0] ?? ''
}

function inferFlavorWords(features: CocktailFeatures): string[] {
  const words: string[] = []
  if (features.sweetness >= 0.5) words.push(pickAdjective('sweet', features.sweetness))
  if (features.sourness >= 0.5) words.push(pickAdjective('sour', features.sourness))
  if (features.alcohol_strength >= 0.7) words.push(pickAdjective('', features.alcohol_strength))
  if (features.fizz >= 0.35) words.push(pickAdjective('fizz', features.fizz))
  return words.filter(Boolean)
}

function extractKeyIngredients(recipe: string, baseSpirit?: string): string[] {
  const tokens = recipe
    .replace(/\d+(?:\.\d+)?\s*(?:ml|oz|대시|티스푼|개|조각|방울|바\s*스푼)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const excluded = new Set([baseSpirit, '', '약간', '선택', '가니시', '얼음'])
  return tokens.filter((t) => !excluded.has(t)).slice(0, 3)
}

export function generateNeutralDescription(
  recipe: string,
  info: RecipeInfo,
): string {
  const keyIngredients = extractKeyIngredients(recipe, info.baseSpirit)
  const flavors = inferFlavorWords(info.features)
  const strengthWord = info.features.alcohol_strength >= 0.7
    ? STRENGTH_LABELS[5] + ' '
    : info.features.alcohol_strength >= 0.4
      ? STRENGTH_LABELS[3] + ' '
      : ''

  if (keyIngredients.length === 0 && info.baseSpirit) {
    if (flavors.length > 0) {
      return `${info.baseSpirit}의 ${strengthWord}${flavors.join(' ')} 풍미가 특징인 칵테일입니다.`
    }
    return `${info.baseSpirit} 베이스의 깔끔한 맛이 특징인 칵테일입니다.`
  }

  const mainIngredient = info.baseSpirit ?? keyIngredients[0]
  const extras = keyIngredients.length > 1
    ? keyIngredients.slice(1).join('와 ')
    : ''

  if (flavors.length > 0) {
    const flavorDesc = [...new Set(flavors)].join('고 ')
    if (extras) {
      return `${mainIngredient}에 ${extras}을 더한 ${strengthWord}${flavorDesc} 칵테일입니다.`
    }
    return `${mainIngredient}의 ${strengthWord}${flavorDesc} 맛이 특징인 칵테일입니다.`
  }

  if (extras) {
    return `${mainIngredient}와 ${extras}의 조화가 인상적인 칵테일입니다.`
  }
  return `${mainIngredient} 베이스의 클래식한 칵테일입니다.`
}

export function generateDescriptionFromFeatures(
  name: string,
  baseSpirit: string,
  features: CocktailFeatures,
): string {
  const flavors = inferFlavorWords(features)
  if (flavors.length > 0) {
    return `${baseSpirit} 베이스의 ${[...new Set(flavors)].join('고 ')} 맛이 특징인 ${name} 칵테일입니다.`
  }
  return `${baseSpirit} 베이스의 부드러운 맛이 특징인 ${name} 칵테일입니다.`
}
