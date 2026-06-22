import keywordRulesData from '../../data/keyword-rules.json'
import type { KeywordRule } from '../../types.js'

interface KeywordRuleData {
  patterns: string[]
  expression: KeywordRule['expression']
  response: string
  dialogueCategory?: string
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
}))
