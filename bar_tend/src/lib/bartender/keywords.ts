import keywordRulesData from '../../data/keyword-rules.json'
import type { KeywordRule } from '../../types.js'
import type { SessionAffect } from '../session/session-affect.js'

interface KeywordRuleData {
  patterns: string[]
  expression: KeywordRule['expression']
  response: string
  dialogueCategory?: string
  affect?: SessionAffect
}

function koreanFriendly(patterns: string[]): string {
  return patterns.map((p) => {
    if (/^[a-zA-Z]/.test(p)) return `\\b${escapeRegExp(p)}\\b`
    return escapeRegExp(p)
  }).join('|')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const keywordRules: KeywordRule[] = (keywordRulesData as KeywordRuleData[]).map((rule) => ({
  pattern: new RegExp(koreanFriendly(rule.patterns), 'i'),
  expression: rule.expression,
  response: rule.response,
  dialogueCategory: rule.dialogueCategory,
  affect: rule.affect,
}))
