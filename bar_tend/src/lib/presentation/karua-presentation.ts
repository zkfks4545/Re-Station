import type { Expression } from '@/types.js'

export type KaruaPresentationAction = 'idle' | 'mixing' | 'serving'

export interface KaruaPresentationCue {
  action: KaruaPresentationAction
  expression: Expression
  speaking: boolean
}

export const KARUA_SHAKER_FRAME_DURATION_MS = 95
export const KARUA_SERVING_CUE_DURATION_MS = 600

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

export function createKaruaPresentationCue(input: {
  action?: KaruaPresentationAction
  expression: Expression
  speaking?: boolean
}): KaruaPresentationCue {
  return {
    action: input.action ?? 'idle',
    expression: input.expression,
    speaking: input.speaking ?? false,
  }
}

export function getKaruaPresentationLabel(cue: KaruaPresentationCue): string {
  if (cue.action === 'mixing') return 'SHAKING'
  if (cue.action === 'serving') return 'SERVE'
  if (cue.speaking) return 'TALK'
  return EXPRESSION_LABEL[cue.expression]
}

export function shouldCycleKaruaFrames(
  action: KaruaPresentationAction,
  prefersReducedMotion: boolean,
): boolean {
  return action === 'mixing' && !prefersReducedMotion
}

export function getNextKaruaFrameIndex(current: number, frameCount: number): number {
  if (frameCount <= 0) return 0
  return (current + 1) % frameCount
}
