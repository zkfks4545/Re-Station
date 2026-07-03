/**
 * 개발 전용 RapportState 디버그 표시
 *
 * 사용법: import.meta.env.DEV && <RapportDebugDisplay rapport={rapport} />
 * -> 동적 import(lazy) 사용을 권장:
 *   const DebugComp = import.meta.env.DEV ? lazy(() => import('./RapportDebugDisplay')) : null
 *
 * 주의: 최종 빌드 전 반드시 제거해야 한다.
 * 사용자에게 Rapport 값을 노출하는 것은 금지되어 있다.
 *
 * @DEV-ONLY - 제거 대상 컴포넌트
 */

import { getRapportRange, createInitialRapport } from '../../lib/relationship/index.js'

interface RapportDebugDisplayProps {
  rapport?: number
}

const RANGE_LABELS: Record<string, string> = {
  distant: '거리 있음',
  normal: '보통',
  warm: '따뜻함',
  close: '가까움',
}

const RANGE_COLORS: Record<string, string> = {
  distant: '#ef4444',
  normal: '#f59e0b',
  warm: '#22c55e',
  close: '#3b82f6',
}

export default function RapportDebugDisplay({ rapport }: RapportDebugDisplayProps) {
  const current = rapport ?? createInitialRapport()
  const range = getRapportRange(current)
  if (!import.meta.env.DEV) return null
  const label = RANGE_LABELS[range]
  const color = RANGE_COLORS[range]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 4,
        left: 4,
        padding: '4px 10px',
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        fontSize: 11,
        fontFamily: 'monospace',
        borderRadius: 4,
        zIndex: 9999,
        pointerEvents: 'none',
        userSelect: 'none',
        border: `1px solid ${color}`,
      }}
    >
      <div style={{ color: '#aaa', fontSize: 10, marginBottom: 2 }}>
        [DEV] RapportState — 제거 대상
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 80,
            height: 6,
            background: '#333',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${current * 10}%`,
              height: '100%',
              background: color,
              borderRadius: 3,
              transition: 'width 0.3s',
            }}
          />
        </div>
        <span style={{ color, fontWeight: 'bold' }}>
          {current}
        </span>
        <span style={{ color: '#999' }}>
          {label}
        </span>
      </div>
    </div>
  )
}
