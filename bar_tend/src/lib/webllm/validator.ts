import {
  CONVERSATION_STANCES,
  RAPPORT_HINTS,
  RESPONSE_BLOCK_SUGGESTIONS,
  SEMANTIC_TOPICS,
  SESSION_TAGS,
  type ConversationStance,
  type RapportHint,
  type ResponseBlockSuggestion,
  type SemanticSessionTag,
  type SemanticTopic,
  type WebLLMSemanticAnalysis,
} from './types.js'

export interface SemanticValidationResult {
  valid: boolean
  analysis: WebLLMSemanticAnalysis | null
  warnings: string[]
}

export function validateSemanticAnalysis(raw: string): SemanticValidationResult {
  if (!raw.trim()) return invalid('의미 분석 결과가 비어 있습니다.')
  if (/```|(^|\n)\s*[-*#>]/.test(raw)) return invalid('JSON 이외의 형식이 포함되었습니다.')

  let parsed: Record<string, unknown>
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid('JSON 객체가 아닙니다.')
    parsed = value as Record<string, unknown>
  } catch {
    return invalid('유효한 JSON이 아닙니다.')
  }

  const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : Number.NaN
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return invalid('confidence가 0부터 1 사이 숫자가 아닙니다.')
  }

  const analysis: WebLLMSemanticAnalysis = {
    topic: allowedValue(parsed.topic, SEMANTIC_TOPICS) as SemanticTopic | undefined,
    stance: allowedValue(parsed.stance, CONVERSATION_STANCES) as ConversationStance | undefined,
    responseBlocks: allowedArray(parsed.responseBlocks, RESPONSE_BLOCK_SUGGESTIONS) as ResponseBlockSuggestion[],
    rapportHint: allowedValue(parsed.rapportHint, RAPPORT_HINTS) as RapportHint | undefined,
    sessionTags: allowedArray(parsed.sessionTags, SESSION_TAGS) as SemanticSessionTag[],
    confidence,
  }
  return { valid: true, analysis, warnings: [] }
}

function allowedValue(value: unknown, allowed: readonly string[]): string | undefined {
  return typeof value === 'string' && allowed.includes(value) ? value : undefined
}

function allowedArray(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && allowed.includes(item)))]
    .slice(0, 3)
}

function invalid(warning: string): SemanticValidationResult {
  return { valid: false, analysis: null, warnings: [warning] }
}
