import type { BartenderResponse, Expression } from '../../types.js'
import type { AffectState } from '../../types/recommendation.js'
import { applyCharacterLayer } from '../character/character-layer.js'
import type { CharacterId } from '../character/character-profile.js'

export type ResponseTone = Expression | AffectState

export interface ResponseDraft {
  text: string
  tone?: ResponseTone
  preferredExpression?: Expression
  character?: {
    speaker?: CharacterId
    intent?: string
    recommendationExpected?: boolean
    safetyCritical?: boolean
  }
}

const TONE_EXPRESSIONS: Record<ResponseTone, Expression> = {
  idle: 'idle',
  talk: 'talk',
  surprised: 'surprised',
  smirk: 'smirk',
  sympathy: 'sympathy',
  thinking: 'thinking',
  annoyed: 'annoyed',
  stern: 'stern',
  disappointed: 'disappointed',
  embarrassed: 'embarrassed',
  concerned: 'sympathy',
  tired: 'sympathy',
  curious: 'thinking',
  awkward: 'thinking',
  confident: 'smirk',
  playful: 'smirk',
  warm: 'smirk',
  neutral: 'smirk',
}

export function assembleResponse(draft: ResponseDraft): BartenderResponse {
  return applyCharacterLayer({
    text: draft.text,
    expression: draft.preferredExpression ?? expressionForTone(draft.tone),
    ...draft.character,
  })
}

export function expressionForTone(tone: ResponseTone = 'talk'): Expression {
  return TONE_EXPRESSIONS[tone]
}
