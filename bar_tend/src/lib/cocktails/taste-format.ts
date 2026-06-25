export function formatTasteRating(value: number): string {
  const rounded = Math.round(value * 10) / 10
  const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)

  return `${label}★`
}
