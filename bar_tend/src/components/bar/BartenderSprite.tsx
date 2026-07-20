import { useEffect, useState } from 'react'
import {
  KARUA_SHAKER_FINISH_FRAME,
  KARUA_SHAKER_LOOP_FRAMES,
  KARUA_STATIC_SPRITES,
} from '../../assets/characters/karua/sprites.js'
import {
  getKaruaPresentationLabel,
  getNextKaruaFrameIndex,
  KARUA_SHAKER_FRAME_DURATION_MS,
  shouldCycleKaruaFrames,
  type KaruaPresentationCue,
} from '../../lib/presentation/karua-presentation.js'

function getInitialReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function BartenderSprite({
  cue,
}: {
  cue: KaruaPresentationCue
}) {
  const [shakeFrameIndex, setShakeFrameIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialReducedMotionPreference)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!shouldCycleKaruaFrames(cue.action, prefersReducedMotion)) {
      const resetId = window.setTimeout(() => setShakeFrameIndex(0), 0)
      return () => window.clearTimeout(resetId)
    }

    const intervalId = window.setInterval(() => {
      setShakeFrameIndex((current) => getNextKaruaFrameIndex(current, KARUA_SHAKER_LOOP_FRAMES.length))
    }, KARUA_SHAKER_FRAME_DURATION_MS)
    return () => window.clearInterval(intervalId)
  }, [cue.action, prefersReducedMotion])

  const isActionCue = cue.action !== 'idle'
  let activeImage = KARUA_STATIC_SPRITES[cue.expression]
  if (cue.action === 'mixing') {
    activeImage = KARUA_SHAKER_LOOP_FRAMES[shakeFrameIndex]
  }
  if (cue.action === 'serving') {
    activeImage = KARUA_SHAKER_FINISH_FRAME
  }

  return (
    <div
      className={`bartender-sprite bartender-sprite--${cue.expression} bartender-sprite--${cue.action} ${
        isActionCue ? 'bartender-sprite--preparing' : ''
      }`}
      data-expression={cue.expression}
      data-presentation-action={cue.action}
      data-speaking={cue.speaking ? 'true' : 'false'}
    >
      <div className="mood-indicator">{getKaruaPresentationLabel(cue)}</div>
      <img
        src={activeImage}
        alt="카루아"
        className={`bartender-sprite__image ${
          isActionCue ? 'bartender-sprite__image--action' : 'float'
        }`}
      />
    </div>
  )
}
