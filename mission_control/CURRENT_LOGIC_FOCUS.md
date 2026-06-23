# Current Logic Focus

> Updated: 2026-06-23
> Purpose: Temporarily hold Siesta event work and tighten the current product logic around Karua, recommendation, and serving flow.

## Temporary Scope

Siesta is not removed from the project, but she is temporarily excluded from active runtime planning.

- Runtime Siesta banter is disabled by `SIESTA_EVENTS_ENABLED = false` in `bar_tend/src/hooks/useRestationController.ts`.
- Existing Siesta event code and tests remain as parked assets.
- New Siesta sprite, event staging, or banter expansion work should wait until the Karua-only flow is stable.

## Current Core Loop

The product loop should be judged in this order:

1. User enters from the exterior screen.
2. Karua greets the user and establishes the bar tone.
3. User input is routed by priority: safety, exit, active recommendation cancel, random recommendation, explicit cocktail, recommendation intent, unknown cocktail, general dialogue.
4. Recommendation state collects only useful signals: taste, aroma/body, alcohol strength, carbonation, base, preferred ingredients, excluded ingredients, mood/context.
5. The recommendation engine chooses the cocktail and structured reason.
6. Dialogue rendering expresses the decision through Karua's route, dialogue state, and affect state.
7. Cocktail preparation animation plays before the recommendation reply/card appears.
8. The user can ask again, continue talking, or exit/reset.

## Logic Boundaries

- Recommendation logic decides the cocktail. Character dialogue must not change the result.
- Input route decides why Karua says something. Cocktail ID alone must not decide tone.
- `dialogueState` controls the scene rhythm: asking, recommending, serving, safety, error, exiting.
- `affectState` controls expression and emotional color, not business logic.
- JSON question data should stay neutral and structural. Karua voice belongs in dialogue/preset layers.
- Safety input always wins over recommendation, exit, banter, and humor.

## Near-Term Planning Priority

1. Lock Karua's forbidden patterns and allowed tone.
2. Normalize dialogue categories and preset blocks.
3. Ensure each input route has a clear response goal.
4. Keep recommendation output explainable without overclaiming mood/context data.
5. Verify the serving rhythm: user input -> route -> decision -> preparation -> reply -> card.

## Deferred Until After This Pass

- Siesta runtime events.
- Siesta sprite display and stage directions.
- New character event systems.
- WebLLM expansion.
- New recommendation algorithms.
