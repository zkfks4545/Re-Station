import { createServingPlan, type ServingPlan } from '@/lib/dialogue/serving-plan.js'
import {
  decideFarewellEntry,
  type DialogueSessionState,
  type FarewellEntryKind,
} from '@/lib/session/dialogue-session.js'
import type { SessionPhase } from '@/lib/session/session-flow.js'
import type { CocktailData } from '@/types.js'

export interface RestationServingDecision {
  plan: ServingPlan
  farewellEntryKind: Exclude<FarewellEntryKind, 'none'> | null
  nextPhase: SessionPhase
}

export function createRestationServingDecision(input: {
  cocktail: CocktailData
  currentPhase: SessionPhase
  alcoholStarTotal: number
  dialogueSession: DialogueSessionState
}): RestationServingDecision {
  const plan = createServingPlan(input)
  const farewellEntryKind = plan.requiresFarewell
    ? decideFarewellEntry(input.dialogueSession, 'alcohol-limit')
    : null
  const nextPhase = plan.requiresFarewell
    ? farewellEntryKind === 'alcohol-xyz' || farewellEntryKind === 'welcome-farewell-xyz'
      ? 'xyz'
      : 'farewell'
    : plan.nextPhase ?? input.currentPhase

  return { plan, farewellEntryKind, nextPhase }
}
