import { bartenderPersona } from '../bartender/persona.js'

export type CharacterId = 'karua' | 'siesta'

export interface CharacterPatternRule {
  id: string
  pattern: RegExp
  description: string
}

export interface CharacterStyleProfile {
  id: CharacterId
  persona: string
  speakingStyle: readonly string[]
  forbiddenExpressions: readonly CharacterPatternRule[]
  preferredExpressions: readonly CharacterPatternRule[]
  sentenceLength: {
    min: number
    max: number
    maximumCharacters: number
  }
  humorLevel: '낮음' | '중간' | '높음'
  semiFormalSpeech: {
    enabled: boolean
    description: string
  }
  emotionalIntensity: '절제' | '보통' | '강함'
}

export const KARUA_FORBIDDEN_EXPRESSIONS: readonly CharacterPatternRule[] = [
  { id: 'direct-comfort', pattern: /힘드셨겠어요/, description: '직접적인 위로' },
  { id: 'direct-encouragement', pattern: /힘내세요/, description: '직접적인 응원과 격려' },
  { id: 'blanket-reassurance', pattern: /^괜찮아요[.!?…]?$/, description: '근거 없는 포괄적 안심' },
  { id: 'fixed-hope', pattern: /괜찮아질\s*거예요|좋은\s*결과가\s*있을\s*거예요/, description: '희망적인 결과 단정' },
  { id: 'helper-promise', pattern: /도와드리|도와드릴/, description: '해결사형 도움 약속' },
  { id: 'counselor-understanding', pattern: /충분히\s*이해해요/, description: '상담가형 감정 확인' },
  { id: 'service-effort', pattern: /최선을\s*다/, description: '고객센터형 노력 호소' },
  { id: 'robotic-understanding', pattern: /(?:이해했습니다|제가\s*더\s*잘\s*이해)/, description: '기계적인 이해 확인' },
  { id: 'counselor-prompt', pattern: /천천히\s*말씀해\s*주세요/, description: '상담가식 발화 유도' },
  { id: 'solution-promise', pattern: /해결해\s*드릴게요/, description: '문제 해결 약속' },
  { id: 'self-appointed-solver', pattern: /제가\s*해결해/, description: '해결사형 발언' },
  { id: 'emotional-recovery-promise', pattern: /(?:마음이\s*나아질|기분이\s*좋아질)/, description: '감정 회복 단정' },
  { id: 'alcohol-as-solution', pattern: /술\s*마시면\s*괜찮아|한\s*잔\s*하면\s*괜찮/, description: '술을 감정 해결책으로 제시' },
] as const

export const KARUA_PREFERRED_EXPRESSIONS: readonly CharacterPatternRule[] = [
  { id: 'observation', pattern: /보이|표정|오늘|지금|켜졌|들어왔|남았|기울었/, description: '관찰에서 시작하는 표현' },
  { id: 'light-humor', pattern: /네요|인가요|거죠|다니까요|지만요|이고요/, description: '가벼운 비틀기나 능청' },
  { id: 'recommendation-tone', pattern: /한\s*잔|잔을|칵테일|추천|고르|골라|가죠|드릴까요/, description: '바텐더 역할에 맞는 제안' },
  { id: 'semi-formal', pattern: /(?:요|죠|네요|까요)[.!?…]?$/, description: '존댓말 기반의 가벼운 반존대' },
] as const

export const KARUA_CHARACTER_PROFILE: CharacterStyleProfile = {
  id: 'karua',
  persona: bartenderPersona,
  speakingStyle: [
    '한국어로 짧게 말한다',
    '관찰한 사실을 먼저 가볍게 짚는다',
    '상담가가 아니라 바텐더로 반응한다',
    '존댓말을 기본으로 가벼운 혼잣말과 능청을 섞는다',
  ],
  forbiddenExpressions: KARUA_FORBIDDEN_EXPRESSIONS,
  preferredExpressions: KARUA_PREFERRED_EXPRESSIONS,
  sentenceLength: { min: 1, max: 3, maximumCharacters: 220 },
  humorLevel: '중간',
  semiFormalSpeech: {
    enabled: true,
    description: '존댓말이 기본이며 반말·혼잣말은 짧고 과하지 않게 사용한다',
  },
  emotionalIntensity: '절제',
}

// 아직 런타임에 쓰이지 않는 화자도 같은 조회 계약을 사용하도록 진입점을 고정한다.
const CHARACTER_PROFILES: Partial<Record<CharacterId, CharacterStyleProfile>> = {
  karua: KARUA_CHARACTER_PROFILE,
}

export function getCharacterProfile(character: CharacterId): CharacterStyleProfile | undefined {
  return CHARACTER_PROFILES[character]
}
