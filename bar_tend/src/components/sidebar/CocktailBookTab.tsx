import { useState } from 'react'
import { cocktails } from '@/lib/cocktails/database.js'
import type { CocktailData } from '@/types.js'

function CocktailDetail({
  cocktail,
  onBack,
}: {
  cocktail: CocktailData
  onBack: () => void
}) {
  return (
    <div className="codex-detail">
      <button className="codex-detail__back" onClick={onBack}>← 도감으로</button>
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
          <ul className="codex-detail__talking-points">
            {cocktail.talkingPoints.map((tp, i) => (
              <li key={i}>{tp}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function CocktailBookTab({
  unlockedIds,
  onSelect,
}: {
  unlockedIds: Set<string>
  onSelect?: (cocktail: CocktailData) => void
}) {
  const [selected, setSelected] = useState<CocktailData | null>(null)

  if (selected) {
    return <CocktailDetail cocktail={selected} onBack={() => setSelected(null)} />
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
