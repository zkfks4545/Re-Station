import characterImg from '../../lib/bartender/character.png'
import type { Expression } from '../../types.js'

const EXPRESSION_LABEL: Record<Expression, string> = {
  idle: '평온',
  talk: '대화 중',
  surprised: '놀람',
  smirk: '흐뭇',
  sympathy: '공감',
  thinking: '생각 중',
  annoyed: '짜증',
  stern: '엄숙',
  disappointed: '실망',
  embarrassed: '당황',
}

export default function BartenderSprite({ expression }: { expression: Expression }) {
  return (
    <div
      className={`bartender-sprite bartender-sprite--${expression}`}
      data-expression={expression}
    >
      <div className="mood-indicator">{EXPRESSION_LABEL[expression]}</div>
      <img
        src={characterImg}
        alt="카루아"
        className="bartender-sprite__image float"
      />
    </div>
  )
}
