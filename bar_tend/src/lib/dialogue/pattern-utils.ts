export function kf(patterns: string[], caseSensitive?: boolean): RegExp {
  if (patterns.length === 0) return /(?!)/;
  return new RegExp(
    patterns.map((p) => (/^[a-z]/i.test(p) ? `\\b${p}\\b` : p)).join('|'),
    caseSensitive ? undefined : 'i',
  )
}
