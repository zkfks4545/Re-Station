import type { ResponseTone } from './response-pipeline.js'

export type ReactionType =
  | 'positive-feedback'
  | 'negative-feedback'
  | 'another-request'
  | 'agreement'
  | 'confused'

export interface UserReaction {
  type: ReactionType
  reply: string
  tone: ResponseTone
}

const REACTION_PATTERNS: Array<{
  type: ReactionType
  pattern: RegExp
  reply: string
  tone: ResponseTone
}> = [
  {
    type: 'another-request',
    pattern: /(?:다른|딴)\s*(?:걸|거|술|칵테일)|(?:하나|한\s*잔)\s*더|또\s*(?:추천|골라)|다시\s*(?:추천|골라|찾아)/,
    reply: '이번 잔은 빗나갔군요. 다른 쪽으로 다시 골라볼게요.',
    tone: 'thinking',
  },
  {
    type: 'negative-feedback',
    pattern: /별로(?:야|예요|네요)?|마음에\s*안\s*들|취향이\s*아니|실망|기대\s*이하|맛없|안\s*맞(?:아|아요|네요)?/,
    reply: '취향에서는 조금 빗나갔네요. 그 반응은 다음 잔에 반영할게요.',
    tone: 'thinking',
  },
  {
    type: 'confused',
    pattern: /무슨\s*말(?:이야|이에요|인지)|이해(?:가)?\s*안\s*(?:돼|되)|헷갈|잘\s*모르겠|뭔\s*소리/,
    reply: '제가 설명을 꼬아버렸네요. 어느 부분인지 짚어주시면 짧게 다시 말씀드릴게요.',
    tone: 'thinking',
  },
  {
    type: 'positive-feedback',
    pattern: /맛있|마음에\s*들|괜찮(?:아|아요|네요)|좋(?:네|다|아요|았어|았습니다)|훌륭|최고/,
    reply: '입에 맞았다니 다행이네요. 잔이 제 몫은 했군요.',
    tone: 'smirk',
  },
  {
    type: 'agreement',
    pattern: /^(?:네|응|맞아(?:요)?|그렇(?:죠|네요|습니다)?|동의해(?:요)?|그러게(?:요)?)[\s.!?]*$/,
    reply: '그렇죠. 그 정도로 기억해두면 충분해요.',
    tone: 'talk',
  },
]

export function detectUserReaction(input: string): UserReaction | null {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return null

  const match = REACTION_PATTERNS.find((candidate) => candidate.pattern.test(normalized))
  return match
    ? { type: match.type, reply: match.reply, tone: match.tone }
    : null
}
