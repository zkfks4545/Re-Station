import { useEffect, useRef, useState } from 'react'
import { cocktails } from '@/lib/cocktails/database.js'
import type { CocktailData } from '@/types.js'

function CocktailDetail({
  cocktail,
  source,
  onBack,
}: {
  cocktail: CocktailData
  source: 'served' | 'codex'
  onBack: () => void
}) {
  return (
    <div className="codex-detail">
      <button className="codex-detail__back" onClick={onBack}>← 도감으로</button>
      {source === 'served' && (
        <p className="sidebar-muted" style={{ marginBottom: 10 }}>
          최근 서빙된 칵테일
        </p>
      )}
      <div className="codex-detail__head">
        {cocktail.image && (
          <img src={cocktail.image} alt="" className="codex-detail__img" />
        )}
        <div>
          <h3 className="codex-detail__name">{cocktail.name}</h3>
          {cocktail.nameEn && (
            <span className="codex-detail__name-en">{cocktail.nameEn}</span>
          )}
        </div>
      </div>
      <p className="codex-detail__desc">{cocktail.description}</p>
      <div className="codex-detail__section">
        <h4 className="codex-detail__section-title">레시피</h4>
        <ul className="codex-detail__ingredients">
          {cocktail.ingredients.map((ing, i) => (
            <li key={i}>{ing}</li>
          ))}
        </ul>
        {cocktail.recipeText && (
          <p className="codex-detail__recipe-text">{cocktail.recipeText}</p>
        )}
      </div>
      {cocktail.talkingPoints && cocktail.talkingPoints.length > 0 && (
        <div className="codex-detail__section">
          <h4 className="codex-detail__section-title">이야깃거리</h4>
          <ul className="codex-detail__ingredients">
            {cocktail.talkingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function CocktailBookTab({
  unlockedIds,
  featuredCocktail,
  onSelect,
}: {
  unlockedIds: Set<string>
  featuredCocktail?: CocktailData | null
  onSelect?: (cocktail: CocktailData) => void
}) {
  const [selected, setSelected] = useState<CocktailData | null>(null)
  const [isBrowsingCodex, setIsBrowsingCodex] = useState(false)
  const featuredCocktailIdRef = useRef(featuredCocktail?.id ?? null)

  useEffect(() => {
    if (featuredCocktail && featuredCocktail.id !== featuredCocktailIdRef.current) {
      featuredCocktailIdRef.current = featuredCocktail.id
      setSelected(null)
      setIsBrowsingCodex(false)
    }
  }, [featuredCocktail])

  const detailCocktail = selected ?? (!isBrowsingCodex ? featuredCocktail : null)

  if (detailCocktail) {
    return (
      <CocktailDetail
        cocktail={detailCocktail}
        source={selected ? 'codex' : 'served'}
        onBack={() => {
          setSelected(null)
          setIsBrowsingCodex(true)
        }}
      />
    )
  }

  return (
    <div className="codex-grid">
      {cocktails.map((c) => {
        const unlocked = unlockedIds.has(c.id)
        return (
          <button
            key={c.id}
            type="button"
            className={`codex-slot ${unlocked ? 'codex-slot--unlocked' : 'codex-slot--locked'}`}
            onClick={() => {
              if (unlocked) {
                setSelected(c)
                setIsBrowsingCodex(false)
                onSelect?.(c)
              }
            }}
            disabled={!unlocked}
            title={unlocked ? c.name : '???'}
          >
            {unlocked ? (
              <>
                {c.image ? (
                  <img src={c.image} alt="" className="codex-slot__img" />
                ) : (
                  <span className="codex-slot__glyph">{c.name.charAt(0)}</span>
                )}
                <span className="codex-slot__name">{c.name}</span>
              </>
            ) : (
              <>
                <span className="codex-slot__silhouette">?</span>
                <span className="codex-slot__name codex-slot__name--locked">???</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
