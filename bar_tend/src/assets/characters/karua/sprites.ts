import idleSprite from './static/Kaura.png'
import embarrassedSprite from './static/embarrassed.png'
import smirkSprite from './static/smirk.png'
import thinkingSprite from './static/thinking.png'
import shakeFrameUpper from './animations/shaker/S1.png'
import shakeFrameMiddle from './animations/shaker/S2.png'
import shakeFrameLower from './animations/shaker/S3.png'
import shakeFrameFinish from './animations/shaker/S4.png'
import type { Expression } from '../../../types.js'

export const KARUA_STATIC_SPRITES: Record<Expression, string> = {
  idle: idleSprite,
  talk: idleSprite,
  surprised: idleSprite,
  smirk: smirkSprite,
  sympathy: idleSprite,
  thinking: thinkingSprite,
  annoyed: idleSprite,
  stern: idleSprite,
  disappointed: embarrassedSprite,
  embarrassed: embarrassedSprite,
}

export const KARUA_SHAKER_LOOP_FRAMES = [
  shakeFrameUpper,
  shakeFrameMiddle,
  shakeFrameLower,
]

export const KARUA_SHAKER_FINISH_FRAME = shakeFrameFinish
