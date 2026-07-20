import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  KARUA_SHAKER_FINISH_FRAME,
  KARUA_SHAKER_LOOP_FRAMES,
  KARUA_STATIC_SPRITES,
} from '@/assets/characters/karua/sprites.js'
import { createKaruaPresentationCue } from '@/lib/presentation/karua-presentation.js'
import BartenderSprite from './BartenderSprite.js'

describe('BartenderSprite presentation cue rendering', () => {
  it('renders an expression sprite for an idle cue', () => {
    const markup = renderToStaticMarkup(
      <BartenderSprite cue={createKaruaPresentationCue({ expression: 'thinking' })} />,
    )

    expect(markup).toContain('data-expression="thinking"')
    expect(markup).toContain('data-presentation-action="idle"')
    expect(markup).toContain('THINKING')
    expect(markup).toContain(KARUA_STATIC_SPRITES.thinking)
    expect(markup).toContain('alt="카루아"')
  })

  it('renders the first shaker frame from a structured mixing cue', () => {
    const markup = renderToStaticMarkup(
      <BartenderSprite cue={createKaruaPresentationCue({
        action: 'mixing', expression: 'smirk', speaking: true,
      })} />,
    )

    expect(markup).toContain('data-presentation-action="mixing"')
    expect(markup).toContain('SHAKING')
    expect(markup).toContain(KARUA_SHAKER_LOOP_FRAMES[0])
    expect(markup).not.toContain(KARUA_SHAKER_FINISH_FRAME)
  })

  it('renders only the finish frame from a structured serving cue', () => {
    const markup = renderToStaticMarkup(
      <BartenderSprite cue={createKaruaPresentationCue({ action: 'serving', expression: 'smirk' })} />,
    )

    expect(markup).toContain('data-presentation-action="serving"')
    expect(markup).toContain('SERVE')
    expect(markup).toContain(KARUA_SHAKER_FINISH_FRAME)
    expect(markup).toContain('bartender-sprite__image--action')
  })
})
