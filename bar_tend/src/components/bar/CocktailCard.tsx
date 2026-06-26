import type { CocktailData } from '../../types.js'

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

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-xs text-white/40 mb-1">설명</p>
            <p className="text-sm text-white/70 leading-relaxed">{cocktail.description}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">레시피</p>
            <p className="text-sm text-white/70 leading-relaxed">{cocktail.recipeText}</p>
          </div>
          {cocktail.talkingPoints && cocktail.talkingPoints.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-1">이야깃거리</p>
              <ul className="text-sm text-white/70 leading-relaxed space-y-1">
                {cocktail.talkingPoints.map((point, i) => (
                  <li key={i}>· {point}</li>
                ))}
              </ul>
            </div>
        )}
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
