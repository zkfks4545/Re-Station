import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import CocktailBookTab from './CocktailBookTab.jsx'
import { publicCocktails } from '@/lib/cocktails/database.js'
import type { CocktailData } from '@/types.js'
import type { AudioManager } from '@/hooks/useAudioManager.js'

export type SidebarTab = 'codex' | 'recipe' | 'music' | 'reset'

const RecipeInfoTab = lazy(() => import('./RecipeInfoTab.jsx'))
const BarMusicTab = lazy(() => import('./BarMusicTab.jsx'))

const TABS: { id: SidebarTab; label: string; sub: string }[] = [
  { id: 'codex', label: '도감', sub: 'COCKTAIL BOOK' },
  { id: 'recipe', label: '레시피', sub: 'RECIPE INFO' },
  { id: 'music', label: 'BGM', sub: 'BAR MUSIC' },
  { id: 'reset', label: '리셋', sub: 'NEW NIGHT' },
]

export default function Sidebar({
  unlockedIds,
  mobileOpen,
  onMobileClose,
  onResetNight,
  lastServedCocktail,
  onViewCocktail,
  onOrderCocktail,
  audio,
}: {
  unlockedIds: Set<string>
  mobileOpen: boolean
  onMobileClose: () => void
  onResetNight: () => void
  lastServedCocktail?: CocktailData | null
  onViewCocktail?: (cocktail: CocktailData) => void
  onOrderCocktail?: (cocktail: CocktailData) => void
  audio: AudioManager
}) {
  const [tab, setTab] = useState<SidebarTab>('codex')
  const [confirmReset, setConfirmReset] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onMobileCloseRef = useRef(onMobileClose)
  const totalCocktails = publicCocktails.length
  const publicUnlockedCount = publicCocktails.filter((cocktail) => unlockedIds.has(cocktail.id)).length

  useEffect(() => {
    onMobileCloseRef.current = onMobileClose
  }, [onMobileClose])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)')
    const sync = () => setIsMobile(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!isMobile || !mobileOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onMobileCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return
      const focusable = [...sidebarRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )]
      if (focusable.length === 0) return
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
      previouslyFocused?.focus()
    }
  }, [isMobile, mobileOpen])

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    onResetNight()
    setConfirmReset(false)
    setTab('codex')
    onMobileClose()
  }

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'sidebar-backdrop--open' : ''}`}
        onClick={onMobileClose}
        aria-hidden={!mobileOpen}
      />
      <aside
        ref={sidebarRef}
        id="bar-terminal-menu"
        className={`restation-sidebar ${mobileOpen ? 'restation-sidebar--open' : ''}`}
        aria-label="바 메뉴"
        aria-hidden={isMobile ? !mobileOpen : undefined}
        aria-modal={isMobile && mobileOpen ? true : undefined}
        role={isMobile && mobileOpen ? 'dialog' : undefined}
        inert={isMobile && !mobileOpen}
      >
        <div className="sidebar-glitch-border" />
        <button
          ref={closeButtonRef}
          type="button"
          className="sidebar-close"
          onClick={onMobileClose}
          aria-label="바 메뉴 닫기"
        >
          ×
        </button>
        <nav className="sidebar-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`sidebar-tab-${t.id}`}
              aria-controls={`sidebar-panel-${t.id}`}
              aria-selected={tab === t.id}
              className={`sidebar-tab ${tab === t.id ? 'sidebar-tab--active' : ''}`}
              onClick={() => {
                setTab(t.id)
                if (t.id !== 'reset') setConfirmReset(false)
              }}
            >
              <span className="sidebar-tab__sub">{t.sub}</span>
              <span className="sidebar-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>

        <div
          id={`sidebar-panel-${tab}`}
          className="sidebar-panel"
          role="tabpanel"
          aria-labelledby={`sidebar-tab-${tab}`}
        >
          {tab === 'codex' && (
            <>
              <h2 className="sidebar-title">칵테일 도감</h2>
              <p className="sidebar-muted">
                대화 중 추천받은 칵테일만 해제됩니다. ({publicUnlockedCount}/
                {totalCocktails})
              </p>
              <CocktailBookTab
                unlockedIds={unlockedIds}
                featuredCocktail={lastServedCocktail}
                onSelect={onViewCocktail}
              />
            </>
          )}
          {tab === 'recipe' && (
            <>
              <h2 className="sidebar-title">레시피 정보</h2>
              <p className="sidebar-muted">모든 칵테일 레시피를 열람</p>
              <Suspense fallback={<p className="sidebar-muted">레시피 정보를 불러오는 중입니다.</p>}>
                <RecipeInfoTab onOrderCocktail={onOrderCocktail} />
              </Suspense>
            </>
          )}
          {tab === 'music' && (
            <>
              <h2 className="sidebar-title">유튜브 주크박스</h2>
              <Suspense fallback={<p className="sidebar-muted">주크박스를 불러오는 중입니다.</p>}>
                <BarMusicTab bgm={audio.bgm} sfx={audio.sfx} />
              </Suspense>
            </>
          )}
          {tab === 'reset' && (
            <div className="reset-panel">
              <h2 className="sidebar-title">새로운 밤</h2>
              <p className="sidebar-muted">
                현재 세션의 맛 선호 가중치, AI 아이돌 메모리 슬롯, 채팅 기록을
                초기화합니다. 도감 해제는 유지됩니다.
              </p>
              <button
                type="button"
                className={`reset-btn ${confirmReset ? 'reset-btn--confirm' : ''}`}
                onClick={handleReset}
              >
                {confirmReset ? '정말 초기화할까요? (다시 클릭)' : '[ 새로운 밤 시작 ]'}
              </button>
              {confirmReset && (
                <button
                  type="button"
                  className="reset-cancel"
                  onClick={() => setConfirmReset(false)}
                >
                  취소
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
