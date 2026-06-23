import { useEffect, useRef, useState } from 'react'
import {
  KARUA_SHAKER_FINISH_FRAME,
  KARUA_SHAKER_LOOP_FRAMES,
  KARUA_STATIC_SPRITES,
} from '../../assets/characters/karua/sprites.js'
import type { Expression } from '../../types.js'

const SHAKER_FRAME_DURATION_MS = 95

const EXPRESSION_LABEL: Record<Expression, string> = {
  idle: 'IDLE',
  talk: 'TALK',
  surprised: 'SURPRISE',
  smirk: 'SMIRK',
  sympathy: 'SYMPATHY',
  thinking: 'THINKING',
  annoyed: 'ANNOYED',
  stern: 'STERN',
  disappointed: 'DISAPPOINTED',
  embarrassed: 'EMBARRASSED',
}

export default function BartenderSprite({
  expression,
  isPreparingCocktail = false,
  isBartenderTyping = false,
}: {
  expression: Expression
  isPreparingCocktail?: boolean
  isBartenderTyping?: boolean
}) {
  const [shakeFrameIndex, setShakeFrameIndex] = useState(0)
  const [isShowingFinishFrame, setIsShowingFinishFrame] = useState(false)
  const wasPreparingCocktail = useRef(isPreparingCocktail)

  useEffect(() => {
    if (!isPreparingCocktail) {
      setShakeFrameIndex(0)
      return
    }

    const intervalId = window.setInterval(() => {
      setShakeFrameIndex((current) => (current + 1) % KARUA_SHAKER_LOOP_FRAMES.length)
    }, SHAKER_FRAME_DURATION_MS)

    return () => window.clearInterval(intervalId)
  }, [isPreparingCocktail])

  useEffect(() => {
    const didFinishMixing = wasPreparingCocktail.current && !isPreparingCocktail
    wasPreparingCocktail.current = isPreparingCocktail

    if (isPreparingCocktail) {
      setIsShowingFinishFrame(false)
      return
    }

    if (!didFinishMixing) {
      return
    }

    setIsShowingFinishFrame(true)
  }, [isPreparingCocktail])

  useEffect(() => {
    if (isShowingFinishFrame && !isPreparingCocktail && !isBartenderTyping) {
      setIsShowingFinishFrame(false)
    }
  }, [isBartenderTyping, isPreparingCocktail, isShowingFinishFrame])

  const isAnimatingCocktail = isPreparingCocktail || isShowingFinishFrame
  let activeImage = KARUA_STATIC_SPRITES.idle
  let activeLabel = EXPRESSION_LABEL[expression]

  if (isPreparingCocktail) {
    activeImage = KARUA_SHAKER_LOOP_FRAMES[shakeFrameIndex]
    activeLabel = 'SHAKING'
  }

  if (isShowingFinishFrame) {
    activeImage = KARUA_SHAKER_FINISH_FRAME
    activeLabel = 'SERVE'
  }

  return (
    <div
      className={`bartender-sprite bartender-sprite--${expression} ${
        isAnimatingCocktail ? 'bartender-sprite--preparing' : ''
      }`}
      data-expression={expression}
    >
      <div className="mood-indicator">{activeLabel}</div>
      <img
        src={activeImage}
        alt="Karua"
        className={`bartender-sprite__image ${
          isAnimatingCocktail ? 'bartender-sprite__image--shaking' : 'float'
        }`}
      />
    </div>
  )
}
