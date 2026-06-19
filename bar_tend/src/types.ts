export type Expression = 'idle' | 'talk' | 'surprised' | 'smirk' | 'sympathy' | 'thinking' | 'annoyed' | 'stern' | 'disappointed'

export interface TasteProfile {
  sweet: number
  sour: number
  bitter: number
  savory: number
  alcohol: number
  carbonated: boolean
}

export interface RecipeItem {
  ingredient: string
  measure: string
}

export interface Cocktail {
  id: string
  name: string
  nameEn?: string
  aliases?: string[]
  taste: TasteProfile
  aroma: string[]
  base: string
  ingredients: string[]
  recipe?: RecipeItem[]
  recipeText?: string
  story: string
  vibe: string
  description?: string
  popCulture?: string
  image?: string
  glass?: string
  category?: string
  alcoholic?: string
  apiId?: string
  measures?: string[]
}

export interface CocktailData extends Cocktail {
  description: string
  type: 'CLASSIC' | 'SIGNATURE'
  features: {
    sweetness: number
    alcohol_strength: number
    fizz: number
    sourness: number
  }
  name_en?: string
  name_ko?: string
  base_spirit?: string
  recipe_source_url?: string
  official_category?: string
  bar_id?: string
  bar_name?: string
  bar_location_link?: string
}

export interface Message {
  role: 'user' | 'bartender'
  text: string
  speaker?: 'karua' | 'siesta'
}

export interface BartenderResponse {
  response: string
  expression: Expression
}

export interface KeywordRule {
  pattern: RegExp
  expression: Expression
  response: string
  dialogueCategory?: string
}

export interface DialogueLine {
  text: string
  expression: Expression
}

export interface DialogueCategory {
  description?: string
  lines: DialogueLine[]
}

export interface DialoguesData {
  version: string
  categories: Record<string, DialogueCategory>
}

export interface ConversationContext {
  greeted: boolean
  userMood: 'sad' | 'happy' | null
  lastTopic: string | null
  mentionedCocktail: Cocktail | null
  recommendedCocktail: Cocktail | null
  exchangeCount: number
  lastBartenderWasQuestion: boolean
  totalUserMessages: number
}
