import idleSprite from './static/Kaura.png'
import annoyedSprite from './static/annoyed.png'
import disappointedSprite from './static/disappointed.png'
import embarrassedSprite from './static/embarrassed.png'
import smirkSprite from './static/smirk.png'
import surprisedSprite from './static/surprised.png'
import sympathySprite from './static/sympathy.png'
import thinkingSprite from './static/thinking.png'
import sternSprite from './static/upset.png'
import shakeFrameUpper from './animations/shaker/S1.png'
import shakeFrameMiddle from './animations/shaker/S2.png'
import shakeFrameLower from './animations/shaker/S3.png'
import shakeFrameFinish from './animations/shaker/S4.png'
import type { Expression } from '../../../types.js'

export const KARUA_STATIC_SPRITES: Record<Expression, string> = {
  idle: idleSprite,
  talk: idleSprite,
  surprised: surprisedSprite,
  smirk: smirkSprite,
  sympathy: sympathySprite,
  thinking: thinkingSprite,
  annoyed: annoyedSprite,
  stern: sternSprite,
  disappointed: disappointedSprite,
  embarrassed: embarrassedSprite,
}

/** Missing artwork resolves through this fixed map, never a runtime path. */
export const KARUA_EXPRESSION_FALLBACKS: Record<Expression, Expression> = {
  idle: 'idle',
  talk: 'idle',
  surprised: 'surprised',
  smirk: 'smirk',
  sympathy: 'sympathy',
  thinking: 'thinking',
  annoyed: 'annoyed',
  stern: 'stern',
  disappointed: 'disappointed',
  embarrassed: 'embarrassed',
}

export const KARUA_SHAKER_LOOP_FRAMES = [
  shakeFrameUpper,
  shakeFrameMiddle,
  shakeFrameLower,
]

export const KARUA_SHAKER_FINISH_FRAME = shakeFrameFinish
