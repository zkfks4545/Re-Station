import type { BartenderResponse, Expression } from '../../types.js'
import type { AffectState } from '../../types/recommendation.js'

export type ResponseTone = Expression | AffectState

export interface ResponseDraft {
  text: string
  tone?: ResponseTone
  preferredExpression?: Expression
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
  return {
    response: draft.text,
    expression: draft.preferredExpression ?? expressionForTone(draft.tone),
  }
}

export function expressionForTone(tone: ResponseTone = 'talk'): Expression {
  return TONE_EXPRESSIONS[tone]
}
