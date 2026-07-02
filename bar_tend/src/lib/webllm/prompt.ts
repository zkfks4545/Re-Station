import { KARUA_CHARACTER_PROFILE } from '../character/character-profile.js'
import { WEB_LLM_RUNTIME_CONFIG } from './config.js'
import type { WebLLMPolishRequest } from './types.js'

export function buildExperimentalWebLLMPrompt(request: WebLLMPolishRequest): string {
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
    `규칙 기반 원문: ${request.fallbackResponse}`,
    `금지 표현 범주: ${forbidden}`,
    '규칙:',
    '- 한국어로만 답한다.',
    '- AI 도우미나 상담가처럼 말하지 않는다.',
    '- 1~3문장의 짧은 반존대와 가벼운 능청으로 원문의 의미만 다듬는다.',
    '- 칵테일 정보, 유래, 재료, 레시피, 효능, 추천 이유를 만들지 않는다.',
    '- 추천 결과, 행동, 상태를 바꾸지 않는다.',
    '- 마크다운, 목록, 머리말, 설명을 출력하지 않는다.',
    '카루아의 최종 대사만 출력:',
  ].join('\n')
}
