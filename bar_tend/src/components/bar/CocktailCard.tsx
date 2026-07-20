import { useEffect, useId, useRef } from 'react'
import type { CocktailData } from '../../types.js'

type CocktailCardProps = {
  cocktail: CocktailData
  onClose: () => void
  onOrder?: () => void
  onStory?: () => void
}

function formatType(cocktail: CocktailData): string {
  if (cocktail.official_category) return cocktail.official_category
  return cocktail.type === 'CLASSIC' ? '클래식' : '시그니처'
}

function formatVibe(cocktail: CocktailData): string {
  if (cocktail.vibe === 'Classic cocktail') return '클래식 칵테일'
  if (cocktail.vibe.startsWith('Signature @ ')) return `시그니처 · ${cocktail.vibe.slice(12)}`
  return cocktail.vibe
}

function formatTasteProfile(cocktail: CocktailData): string {
  const tastes = [
    `달콤함 ${cocktail.taste.sweet}/5`,
    `산미 ${cocktail.taste.sour}/5`,
    `쌉쌀함 ${cocktail.taste.bitter}/5`,
    `도수감 ${cocktail.taste.alcohol}/5`,
  ]
  if (cocktail.taste.carbonated) tastes.push('탄산 있음')
  return tastes.join(' · ')
}

export default function CocktailCard({
  cocktail,
  onClose,
  onOrder,
  onStory,
}: CocktailCardProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )]
      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  if (!cocktail) return null

  return (
    <div
      className="cocktail-card-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="cocktail-card-dialog rounded-lg max-w-md w-full p-6 relative overflow-y-auto overscroll-contain"
        style={{
          background: '#0d0a07',
          border: '1px solid rgba(196, 163, 90, 0.2)',
          boxShadow: '0 0 30px rgba(196, 163, 90, 0.08), 0 0 60px rgba(120, 80, 180, 0.04)',
        }}
      >
        <button
          ref={closeButtonRef}
          type="button"
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

        <h2 id={titleId} className="text-2xl font-bold mb-1" style={{ color: '#C4A35A' }}>{cocktail.name}</h2>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-white/55">{formatVibe(cocktail)}</p>
          <div>
            <p className="text-xs text-white/40 mb-1">설명</p>
            <p id={descriptionId} className="text-sm text-white/70 leading-relaxed">{cocktail.description}</p>
          </div>
          <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-white/40">베이스</dt>
            <dd className="text-white/70">{cocktail.base}</dd>
            <dt className="text-white/40">재료</dt>
            <dd className="text-white/70">{cocktail.ingredients.join(', ')}</dd>
            <dt className="text-white/40">잔</dt>
            <dd className="text-white/70">{cocktail.glass ?? '정보 없음'}</dd>
            <dt className="text-white/40">분류</dt>
            <dd className="text-white/70">{formatType(cocktail)}</dd>
            <dt className="text-white/40">맛 프로필</dt>
            <dd className="text-white/70">{formatTasteProfile(cocktail)}</dd>
          </dl>
        </div>
        {(onOrder || onStory) && (
          <div className="flex gap-2">
            {onOrder && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOrder() }}
                className="flex-1 py-2 rounded text-sm transition-all duration-200 cursor-pointer"
                style={{
                  color: '#C4A35A',
                  border: '1px solid rgba(196,163,90,0.3)',
                  background: 'rgba(196,163,90,0.08)',
                  textShadow: '0 0 6px rgba(196,163,90,0.15)',
                }}
              >
                주문하기
              </button>
            )}
            {onStory && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onStory() }}
                className="flex-1 py-2 rounded text-sm transition-all duration-200 cursor-pointer"
                style={{
                  color: '#b088d0',
                  border: '1px solid rgba(180,136,208,0.25)',
                  background: 'rgba(120,80,180,0.08)',
                  textShadow: '0 0 6px rgba(120,80,180,0.15)',
                }}
              >
                이야기하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
