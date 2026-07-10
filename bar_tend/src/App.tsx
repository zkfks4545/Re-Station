import BarExterior from '@/components/entrance/BarExterior.jsx'
import BarInterior from '@/components/bar/BarInterior.jsx'
import BartenderSprite from '@/components/bar/BartenderSprite.jsx'
import BarCounter from '@/components/bar/BarCounter.jsx'
import DialogueBox from '@/components/bar/DialogueBox.jsx'
import ChatInput from '@/components/bar/ChatInput.jsx'
import CocktailCard from '@/components/bar/CocktailCard.jsx'
import WelcomeDrinkButton from '@/components/bar/WelcomeDrinkButton.jsx'
import Sidebar from '@/components/sidebar/Sidebar.jsx'
import { useAudioManager } from '@/hooks/useAudioManager.js'
import { useRestationController } from '@/hooks/useRestationController.js'
import { useExperimentalWebLLMPreparation } from '@/hooks/useExperimentalWebLLMPreparation.js'


export default function App() {
  useExperimentalWebLLMPreparation()
  const audio = useAudioManager()
  const {
    scene,
    messages,
    expression,
    isBartenderTyping,
    isProcessing,
    isPreparingCocktail,
    activeQuestion,
    actionSessionMode,
    errorMessage,
    servedCocktail,
    lastServedCocktail,
    sidebarOpen,
    screenShake,
    unlockedIds,
    canCardActions,
    handleEnter,
    handleExit,
    handleOrderCocktail,
    handleCardStory,
    handleResetNight,
    handleCancelRecommendation,
    handleViewCocktail,
    handleWelcomeDrink,
    handleStartRecommendation,
    handleSend,
    onTypingComplete,
    welcomeDrinkAvailable,
    setServedCocktail,
    setSidebarOpen,
  } = useRestationController()

  return (
    <>
      <div ref={audio.bgm.playerHostRef} className="music-player-host" aria-hidden />
      {scene === 'outside' ? (
        <BarExterior onEnter={handleEnter} />
      ) : (
        <div
        className={`h-full restation-layout ${screenShake ? 'shake' : ''}`}
        style={{ background: '#0d0a07' }}
        data-theme="restation"
      >
        <div className="restation-main flex flex-col relative overflow-hidden">
          <BarInterior />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 120px 30px rgba(0,0,0,0.5), inset 0 0 200px 40px rgba(80,40,120,0.04)',
              zIndex: 10,
            }}
          />
          <header
            className="relative flex items-center justify-between px-4 z-30 h-[52px]"
            style={{
              borderBottom: '1px solid rgba(196,163,90,0.08)',
              boxShadow: '0 1px 20px rgba(120,80,180,0.03)',
              background: 'linear-gradient(to bottom, rgba(13,10,7,0.95), rgba(13,10,7,0.7))',
            }}
          >
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-expanded={sidebarOpen}
            >
              [ MENU ]
            </button>
            <div
              className="glow-gold text-lg font-bold tracking-widest flex-1 text-center"
              style={{ color: '#C4A35A' }}
            >
              Re:Station
            </div>
            <div className="w-[52px]" aria-hidden />
          </header>
          <div className="flex-1 flex flex-col min-h-0 relative z-20">
            <div className="restation-stage">
              <BartenderSprite
                expression={expression}
                isPreparingCocktail={isPreparingCocktail}
                isBartenderTyping={isBartenderTyping}
              />
              {/*{RapportDebugDisplay && (
                <Suspense fallback={null}>
                  <RapportDebugDisplay rapport={rapport} />
                </Suspense>
              )}*/}
              <BarCounter />
            </div>
            <div
              className="restation-chat-dock flex flex-col"
              style={{
                background:
                  'linear-gradient(to top, rgba(13,10,7,0.9), rgba(13,10,7,0.3))',
                boxShadow: '0 -10px 30px rgba(80,40,120,0.03), inset 0 1px 0 rgba(196,163,90,0.04)',
                borderTop: '1px solid rgba(196,163,90,0.05)',
              }}
            >
              <DialogueBox
                messages={messages}
                isTyping={isBartenderTyping}
                onTypingComplete={onTypingComplete}
                activeQuestion={activeQuestion}
                onSend={handleSend}
                onCancelRecommendation={handleCancelRecommendation}
                disabled={isProcessing || isBartenderTyping}
              />
              <div
                className="flex flex-col max-md:flex-row max-md:items-center gap-0 chat-input-wrap"
                style={{
                  background:
                    'linear-gradient(to top, rgba(13,10,7,0.95), rgba(13,10,7,0.5))',
                }}
              >
                <div className="max-md:flex-1 min-w-0 chat-input-wrap__field">
                  <ChatInput
                    onSend={handleSend}
                    disabled={isProcessing || isBartenderTyping}
                  />
                </div>
                <div
                  className="flex justify-end gap-2"
                  style={{
                    padding: 'clamp(2px, 0.6vh, 8px) 16px clamp(6px, 1.5vh, 14px)',
                  }}
                >
                  <button
                    type="button"
                    className={`session-mode-btn text-xs transition-all duration-200 cursor-pointer select-none flex items-center gap-1 ${actionSessionMode === 'recommendation' ? 'session-mode-btn--active' : ''}`}
                    onClick={handleStartRecommendation}
                    disabled={isProcessing || isBartenderTyping}
                    aria-pressed={actionSessionMode === 'recommendation'}
                  >
                    <span className="opacity-60">[</span>
                    추천받기
                    <span className="opacity-60">]</span>
                  </button>
                  <WelcomeDrinkButton
                    disabled={isProcessing || isBartenderTyping}
                    hidden={!welcomeDrinkAvailable}
                    onClick={handleWelcomeDrink}
                  />
                  <button
                    onClick={handleExit}
                    className="exit-btn text-xs transition-all duration-200 cursor-pointer select-none flex items-center gap-1"
                    disabled={isProcessing || isBartenderTyping}
                  >
                    <span className="opacity-60">[</span>
                    나가기
                    <span className="opacity-60">]</span>
                  </button>
                </div>
              </div>
              {errorMessage && (
                <p className="px-6 pb-3 text-xs text-red-300" role="alert">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
          {servedCocktail && (
            <CocktailCard
              cocktail={servedCocktail}
              onClose={() => setServedCocktail(null)}
              onOrder={canCardActions ? () => handleOrderCocktail(servedCocktail) : undefined}
              onStory={canCardActions ? () => handleCardStory(servedCocktail) : undefined}
            />
          )}
        </div>

        <Sidebar
          unlockedIds={unlockedIds}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          onResetNight={handleResetNight}
          lastServedCocktail={lastServedCocktail}
          onViewCocktail={handleViewCocktail}
          onOrderCocktail={handleOrderCocktail}
          audio={audio}
        />
      </div>
      )}
    </>
  )
}
