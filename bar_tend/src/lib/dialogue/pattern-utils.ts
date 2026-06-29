export function kf(patterns: string[], caseSensitive?: boolean): RegExp {
  if (patterns.length === 0) return /(?!)/;
  return new RegExp(
    patterns.map((p) => (/^[a-z]/i.test(p) ? `\\b${p}\\b` : p)).join('|'),
    caseSensitive ? undefined : 'i',
  )
}

export const SHAKE_REFERENCE = /젓지\s*말고\s*흔들|젓지말고\s*흔들|본드식|007처럼|shaken\s*,?\s*not\s*stirred|shaken\s+not\s+stirred/i
