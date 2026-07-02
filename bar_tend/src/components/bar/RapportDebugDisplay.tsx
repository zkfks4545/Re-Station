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

import { useMemo } from 'react'
import { getRapportRange } from '../../lib/relationship/index.js'

interface RapportDebugDisplayProps {
  rapport: number
}

const RANGE_LABELS: Record<string, string> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
  'very-high': '매우 높음',
}

const RANGE_COLORS: Record<string, string> = {
  low: '#ef4444',
  normal: '#f59e0b',
  high: '#22c55e',
  'very-high': '#3b82f6',
}

export function RapportDebugDisplay({ rapport }: RapportDebugDisplayProps) {
  if (!import.meta.env.DEV) return null
  const range = useMemo(() => getRapportRange(rapport), [rapport])
  const label = RANGE_LABELS[range]
  const color = RANGE_COLORS[range]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        left: 8,
        padding: '6px 12px',
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        fontSize: 12,
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
              width: `${rapport}%`,
              height: '100%',
              background: color,
              borderRadius: 3,
              transition: 'width 0.3s',
            }}
          />
        </div>
        <span style={{ color, fontWeight: 'bold' }}>
          {rapport}
        </span>
        <span style={{ color: '#999' }}>
          {label}
        </span>
      </div>
    </div>
  )
}
