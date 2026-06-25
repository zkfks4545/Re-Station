import type { CocktailData } from '../../types.js'

const tasteLabels = [
  ['sweet', '단맛'],
  ['sour', '신맛'],
  ['bitter', '드라이함'],
  ['alcohol', '도수'],
] as const

type CocktailCardProps = {
  cocktail: CocktailData
  onClose: () => void
  onReRecommend?: () => void
}

export default function CocktailCard({
  cocktail,
  onClose,
  onReRecommend,
}: CocktailCardProps) {
  if (!cocktail) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 fade-in">
      <div
        className="rounded-lg max-w-md w-full mx-4 p-6 relative"
        style={{
          background: '#0d0a07',
          border: '1px solid rgba(196, 163, 90, 0.2)',
          boxShadow: '0 0 30px rgba(196, 163, 90, 0.08), 0 0 60px rgba(120, 80, 180, 0.04)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 text-lg"
          aria-label="닫기"
        >
          ×
        </button>

        {cocktail.image && (
          <div className="flex justify-center mb-3">
            <img
              src={cocktail.image}
              alt={cocktail.name}
              className="w-24 h-24 object-cover rounded-full border-2"
              style={{ borderColor: 'rgba(180, 136, 208, 0.15)' }}
            />
          </div>
        )}

        <h2 className="text-2xl font-bold mb-1" style={{ color: '#C4A35A' }}>{cocktail.name}</h2>
        <p className="text-white/50 text-sm mb-4 italic">{cocktail.vibe}</p>

        <div className="space-y-2 mb-4">
          <p className="text-sm text-white/70 leading-relaxed">{cocktail.description}</p>
          {cocktail.popCulture && (
            <p className="text-xs" style={{ color: 'rgba(180, 136, 208, 0.65)' }}>
              관련 정보: {cocktail.popCulture}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <p className="text-xs text-white/40 mb-1">베이스</p>
            <p className="text-sm text-white/80">{cocktail.base}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">재료</p>
            <p className="text-sm text-white/80">{cocktail.ingredients.join(', ')}</p>
          </div>
          {cocktail.glass && (
            <div>
              <p className="text-xs text-white/40 mb-1">글라스</p>
              <p className="text-sm text-white/80">{cocktail.glass}</p>
            </div>
          )}
          {cocktail.alcoholic && (
            <div>
              <p className="text-xs text-white/40 mb-1">분류</p>
              <p className="text-sm text-white/80">{cocktail.alcoholic}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {tasteLabels.map(([key, label]) => (
            <span
              key={key}
              className="text-xs px-2 py-1 rounded text-white/60"
              style={{ background: 'rgba(120,80,180,0.06)', border: '1px solid rgba(180,136,208,0.12)' }}
            >
              {label} {'★'.repeat(cocktail.taste[key])}{'☆'.repeat(5 - cocktail.taste[key])}
            </span>
          ))}
        </div>
        {onReRecommend && (
          <button
            onClick={(e) => { e.stopPropagation(); onReRecommend() }}
            className="w-full py-2 rounded text-sm transition-all duration-200 cursor-pointer"
            style={{
              color: '#b088d0',
              border: '1px solid rgba(180,136,208,0.25)',
              background: 'rgba(120,80,180,0.08)',
              textShadow: '0 0 6px rgba(120,80,180,0.15)',
            }}
          >
            다시 추천받기
          </button>
        )}
      </div>
    </div>
  )
}
