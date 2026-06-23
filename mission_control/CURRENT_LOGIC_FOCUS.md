# Current Logic Focus

> Updated: 2026-06-23
> Purpose: Temporarily hold Siesta event work and tighten the current product logic around Karua, recommendation, serving flow, and session closure.

## Temporary Scope

Siesta is not removed from the project, but she is temporarily excluded from active runtime planning.

- Runtime Siesta banter is disabled by `SIESTA_EVENTS_ENABLED = false` in `bar_tend/src/hooks/useRestationController.ts`.
- Existing Siesta event code and tests remain as parked assets.
- New Siesta sprite, event staging, or banter expansion work should wait until the Karua-only flow is stable.

## Current Core Loop

The product loop should be judged in this order:

1. User enters from the exterior screen.
2. Karua offers the welcome drink and establishes the bar tone.
3. User input is routed by priority: safety, exit, active recommendation cancel, random recommendation, explicit cocktail, recommendation intent, unknown cocktail, general dialogue.
4. Free input receives a short reaction, then returns to cocktail or recommendation-related flow.
5. Recommendation state collects only useful signals: taste, aroma/body, alcohol strength, carbonation, base, preferred ingredients, excluded ingredients, mood/context.
6. Choice events may temporarily constrain input when the system needs important preference or intent signals.
7. The recommendation engine chooses the cocktail and structured reason.
8. Dialogue rendering expresses the decision through Karua's route, dialogue state, and affect state.
9. Cocktail preparation animation plays before the recommendation reply/card appears.
10. The session moves through order and aftertalk toward XYZ, Farewell Phase, and return home.

## Logic Boundaries

- Recommendation logic decides the cocktail. Character dialogue must not change the result.
- Input route decides why Karua says something. Cocktail ID alone must not decide tone.
- `dialogueState` controls the scene rhythm: asking, recommending, serving, safety, error, exiting.
- `affectState` controls expression and emotional color, not business logic.
- JSON question data should stay neutral and structural. Karua voice belongs in dialogue/preset layers.
- Safety input always wins over recommendation, exit, banter, and humor.
- Free input is open, but session progression is closed.
- Session mood values such as `trust`, `familiarity`, `playfulness`, and `tension` adjust tone only; they are not affection points or ending branches.
- All sessions end in return home. Differences belong in farewell tone, not route endings.

## Near-Term Planning Priority

1. Lock Karua's forbidden patterns and allowed tone.
2. Normalize dialogue categories and preset blocks.
3. Ensure each input route has a clear response goal.
4. Keep recommendation output explainable without overclaiming mood/context data.
5. Verify the serving rhythm: user input -> route -> decision -> preparation -> reply -> card.
6. Design the future XYZ and Farewell Phase as the required closure after order/aftertalk.

## Deferred Until After This Pass

- Siesta runtime events.
- Siesta sprite display and stage directions.
- New character event systems.
- WebLLM expansion.
- New recommendation algorithms.
- Affection, romance, route ending, or true-ending systems.
