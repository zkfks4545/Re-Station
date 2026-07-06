import { KARUA_CHARACTER_PROFILE } from '../character/character-profile.js'
import { WEB_LLM_RUNTIME_CONFIG } from './config.js'
import {
  CONVERSATION_STANCES,
  RAPPORT_HINTS,
  RESPONSE_BLOCK_SUGGESTIONS,
  SEMANTIC_TOPICS,
  SESSION_TAGS,
  type WebLLMSemanticRequest,
} from './types.js'

export function buildSemanticAnalysisPrompt(request: WebLLMSemanticRequest): string {
  const history = (request.history ?? [])
    .slice(-WEB_LLM_RUNTIME_CONFIG.maximumHistoryMessages)
    .map((message) => `${message.role === 'user' ? '손님' : '카루아'}: ${message.text}`)
    .join('\n')
  const forbidden = KARUA_CHARACTER_PROFILE.forbiddenExpressions
    .map((rule) => rule.description)
    .join(', ')

  return [
    '역할: Re:Station의 바텐더 카루아',
    `현재 경로: ${request.route}`,
    `화자: ${request.speaker ?? 'karua'}`,
    `최근 대화:\n${history || '없음'}`,
    `손님 입력: ${request.input}`,
    `금지 표현 범주: ${forbidden}`,
    '대사를 작성하지 말고 아래 허용값만 사용한 JSON 객체를 출력한다.',
    `topic: ${SEMANTIC_TOPICS.join(', ')}`,
    `stance: ${CONVERSATION_STANCES.join(', ')}`,
    `responseBlocks: ${RESPONSE_BLOCK_SUGGESTIONS.join(', ')}`,
    `rapportHint: ${RAPPORT_HINTS.join(', ')}`,
    `sessionTags: ${SESSION_TAGS.join(', ')}`,
    'confidence: 0부터 1 사이 숫자',
    '알 수 없는 값은 생략한다. 마크다운과 설명은 출력하지 않는다.',
  ].join('\n')
}
