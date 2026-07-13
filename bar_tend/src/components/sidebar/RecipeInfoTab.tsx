import { useMemo, useState } from 'react'
import { publicCocktails } from '@/lib/cocktails/index.js'
import { formatTasteRating } from '@/lib/cocktails/taste-format.js'
import type { CocktailData } from '@/types.js'

function normalizeForSearch(s: string): string {
  return s.toLowerCase().replace(/[\s\-_']+/g, '')
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) d[i][0] = i
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      d[i][j] = a[i - 1] === b[j - 1]
        ? d[i - 1][j - 1]
        : Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + 1)
    }
  }
  return d[m][n]
}

function isFuzzyMatch(query: string, target: string): boolean {
  if (query.length < 2 || target.length < 2) return false
  const threshold = Math.max(1, Math.floor(Math.min(query.length, target.length) * 0.3))
  return levenshteinDistance(query, target) <= threshold
}

export default function RecipeInfoTab({
  onOrderCocktail,
}: {
  onOrderCocktail?: (cocktail: CocktailData) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const qNorm = normalizeForSearch(query)
    if (!qNorm) return publicCocktails
    return publicCocktails.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn?.toLowerCase().includes(q) ||
        c.ingredients.some((i) => i.toLowerCase().includes(q)) ||
        c.aroma.some((a) => a.toLowerCase().includes(q)) ||
        c.base.toLowerCase().includes(q) ||
        c.aliases?.some((a) => normalizeForSearch(a).includes(qNorm) || qNorm.includes(normalizeForSearch(a))) ||
        normalizeForSearch(c.name).includes(qNorm) ||
        (c.nameEn && normalizeForSearch(c.nameEn).includes(qNorm)) ||
        qNorm.includes(normalizeForSearch(c.name)) ||
        (c.nameEn && qNorm.includes(normalizeForSearch(c.nameEn))) ||
        c.ingredients.some((i) => normalizeForSearch(i).includes(qNorm)) ||
        c.aroma.some((a) => qNorm.includes(normalizeForSearch(a))) ||
        isFuzzyMatch(qNorm, normalizeForSearch(c.name)) ||
        (c.nameEn && isFuzzyMatch(qNorm, normalizeForSearch(c.nameEn))),
    )
  }, [query])

  return (
    <div className="recipe-panel">
      <input
        type="search"
        className="sidebar-input"
        placeholder="칵테일 / 재료 / 향 / 베이스 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="recipe-list">
        {filtered.length === 0 && (
          <p className="sidebar-muted">검색 결과가 없습니다.</p>
        )}
        {filtered.map((c) => (
          <article key={c.id} className="recipe-card">
            <header className="recipe-card__head">
              <div className="recipe-card__head-left">
                <h3>{c.name}</h3>
                {c.nameEn && <span style={{ fontSize: 10, color: 'rgba(245,230,211,0.4)' }}>{c.nameEn}</span>}
              </div>
              <button
                className="order-btn"
                onClick={() => onOrderCocktail?.(c)}
                title={`${c.name} 주문하기`}
              >
                주문
              </button>
            </header>
            {c.vibe && <p style={{ margin: '2px 0', fontSize: 10, color: '#C4A35A' }}>{c.vibe}</p>}
            <dl className="recipe-card__meta">
              <dt>베이스</dt>
              <dd>{c.base}</dd>
              <dt>재료</dt>
              <dd>{c.ingredients.join(', ')}</dd>
              {c.aroma.length > 0 && (
                <>
                  <dt>향</dt>
                  <dd>{c.aroma.join(' · ')}</dd>
                </>
              )}
              <dt>레시피</dt>
              <dd>{c.recipeText ?? c.ingredients.join(', ')}</dd>
              {c.recipe_source_url && (
                <>
                  <dt>공식 출처</dt>
                  <dd>
                    <a
                      href={c.recipe_source_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#b088d0' }}
                    >
                      IBA {c.official_category ?? 'Official Cocktail'}
                    </a>
                  </dd>
                </>
              )}
            </dl>
            <div className="recipe-features">
              <span className="recipe-feature-pill">단맛 {formatTasteRating(c.taste.sweet)}</span>
              <span className="recipe-feature-pill">신맛 {formatTasteRating(c.taste.sour)}</span>
              <span className="recipe-feature-pill">드라이함 {formatTasteRating(c.taste.bitter)}</span>
              <span className="recipe-feature-pill">도수 {formatTasteRating(c.taste.alcohol)}</span>
              {c.taste.carbonated && <span className="recipe-feature-pill">탄산 ✓</span>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
