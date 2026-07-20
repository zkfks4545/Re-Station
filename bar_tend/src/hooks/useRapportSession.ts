import { useCallback, useRef, useState } from 'react'
import {
  createInitialRapport,
  createUpdateTracker,
  updateRapport,
} from '@/lib/relationship/index.js'
import { mapIntentToRapportContext } from './restation-controller-model.js'

export function useRapportSession() {
  const [rapport, setRapport] = useState(createInitialRapport)
  const rapportRef = useRef(rapport)
  const trackerRef = useRef(createUpdateTracker())
  const turnRef = useRef(0)

  const resetRapport = useCallback(() => {
    const initial = createInitialRapport()
    rapportRef.current = initial
    trackerRef.current = createUpdateTracker()
    turnRef.current = 0
    setRapport(initial)
  }, [])

  const applyRapportUpdate = useCallback((intent: string) => {
    turnRef.current += 1
    const result = updateRapport(rapportRef.current, {
      intent: mapIntentToRapportContext(intent),
      sessionTurnCount: turnRef.current,
    }, trackerRef.current)
    if (result.rapport !== rapportRef.current) {
      rapportRef.current = result.rapport
      setRapport(result.rapport)
    }
  }, [])

  return { rapport, resetRapport, applyRapportUpdate }
}
