---
phase: 01-profile-system
plan: 02
subsystem: profiles
tags: [seed, observations, demo, reducer-replay, vitest, copy-gate]

# Dependency graph
requires: []
provides:
  - "Reproducible demo StudentState via reducer replay (app/lib/seed.ts, Aarav demo)"
  - "Evidence-backed observation selectors over nodes plus session.answers (app/lib/observations.ts)"
affects: [01-03 picker UI, Today strengths card, DemoBadge wiring]

# Tech tracking
tech-stack:
  added: []
  patterns: [seed-by-replay through reduce(), pure observation selectors, copy-sweep via allObservationStrings]

key-files:
  created:
    - app/lib/seed.ts
    - app/lib/observations.ts
    - app/tests/seed.test.ts
    - app/tests/observations.test.ts
  modified:
    - app/tests/copy.test.ts

key-decisions:
  - "Seed uses fixed deterministic instanceIds (seed-inst-N) from a per-build local counter instead of importing tests/helpers — avoids a lib->tests import while keeping counter-based uniqueness"
  - "observations.ts Date.now defaults mirror engine dueNodes/thisWeek signatures; tests pass a fixed realNow so the copy sweep stays deterministic"
  - "Checked-immediate survivor (vec_comp) kept un-rechecked so all three re-check branches are visible at once"

patterns-established:
  - "Seed-by-replay: createSeedEvents() plus buildDemoState() folds Event[] through reduce(); DEMO_SEED_EVENTS exported for mid-replay assertions"
  - "Observation strings funnel through allObservationStrings() so copy.test.ts sweeps every user-facing string in one place"

requirements-completed: [PROF-04, PROF-06]

coverage:
  - id: D1
    description: "Reproducible demo seed yielding checked_immediate plus retained plus context_difficulty with one honest no_prereq_weakness outcome and 70-80 percent pakka calibration"
    requirement: "PROF-06"
    verification:
      - kind: unit
        ref: "tests/seed.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Evidence-backed observation selectors (node chips plus standard/changed-context/guess lines plus revision line) with zero banned-word hits"
    requirement: "PROF-04"
    verification:
      - kind: unit
        ref: "tests/observations.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Extended copy sweep covering all new observation strings across every mid-replay demo state"
    requirement: "PROF-04"
    verification:
      - kind: unit
        ref: "tests/copy.test.ts"
        status: pass
    human_judgment: false

# Metrics
duration: 1 min
completed: 2026-10-10
status: complete
---

# Phase 01 Plan 02: Demo Seed and Observations Summary

**Reproducible Aarav-demo history via reducer replay plus evidence-backed observation selectors with copy-gated strings**

## Performance

- **Duration:** 1 min
- **Started:** 2026-10-10T11:44:04Z
- **Completed:** 2026-10-10T11:45:22Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Demo seed (`app/lib/seed.ts`) folds a fixed 4-session event list through `reduce()`: projectile and kin_1d suspected gaps repaired to checked_immediate, a clean slope check ending in `no_prereq_weakness`, a vec_comp gap left as the checked_immediate survivor, then one pass re-check to retained and one fail re-check to context_difficulty; pakka calibration 10/13 correct (76.9 percent); `buildDemoState()` returns state with session undefined and rebuilds byte-identically
- Observation selectors (`app/lib/observations.ts`): `nodeChips` cites real node states with `connectedCount` later-topic counts, `evidenceLines` counts standard-A / changed-context-B1 / guess calibration from session answers, `revisionLine` reuses `dueNodes`/`thisWeek`, `allObservationStrings` funnels every user-facing string for the copy sweep
- Copy sweep extended in `app/tests/copy.test.ts` over all observation strings across every mid-replay demo state; full plan verify green (seed 4, observations 3, copy 6 tests) with `tsc` clean

## Task Commits

No git commits per orchestrator override (repo has no git history; user did not ask for commits). Work is uncommitted on disk:

1. **Task 1: Demo seed by reducer replay plus seed tests** - uncommitted (TDD: RED missing-module failure, then GREEN 4/4)
2. **Task 2: Observations selectors plus observation tests and copy sweep** - uncommitted (TDD: RED missing-module failure, then GREEN 3/3 plus copy 6/6)

## Files Created/Modified

- `app/lib/seed.ts` - Fixed event list plus `buildDemoState()`/`DEMO_SEED_EVENTS`/`DEMO_DISPLAY_NAME`; no Date.now or randomUUID
- `app/lib/observations.ts` - `nodeChips`, `evidenceLines`, `revisionLine`, `allObservationStrings`; honest labels only
- `app/tests/seed.test.ts` - Four behaviors: three states present, mid-replay no_prereq_weakness, pakka 70-80 percent, deterministic rebuild
- `app/tests/observations.test.ts` - Count verification on a fixture (2/3 standard, 2/3 changed-context, 2 guessing/1 not correct), chip grounding, wording gate
- `app/tests/copy.test.ts` - Added observation-strings sweep (existing assertions untouched)

## Decisions Made

- Seed uses fixed deterministic instanceIds (`seed-inst-N` from a per-build local counter) instead of importing `tests/helpers.ts` — a lib->tests import would invert the dependency; the counter approach keeps the same uniqueness guarantee. Plan said "reuse helpers"; this is the documented adjustment.
- `revisionLine`/`allObservationStrings` default `realNow = Date.now()` mirroring the engine's own `dueNodes`/`thisWeek` signatures; the copy sweep passes fixed `1_000_000` so it stays deterministic. The plan's no-Date.now rule scopes to seed files (clean, verified by grep).
- Added a fourth session (vec_comp gap plus repair, left un-rechecked) so checked_immediate, retained, and context_difficulty are all visible simultaneously — the two re-checks consume the other two checked_immediate nodes.

## Deviations from Plan

None - plan executed exactly as written, except the two documented implementation choices above which preserve plan intent (deterministic counters without a lib->tests import; engine-mirroring Date.now default with fixed-now tests).

**Total deviations:** 0 auto-fixed. **Impact:** none.

## Issues Encountered

- Full suite (`npx vitest run`, 19 files / 177 tests) shows 10 pre-existing failures in `tests/items.test.ts` and `tests/review.test.ts` (qbank answer-key / repetition checks). Confirmed those suites never import `seed` or `observations` — unrelated to this plan and out of scope per the scope boundary (parallel 01-01 executor owns no shared files with this plan). Plan-scoped verification (seed plus observations plus copy, `tsc` clean) is fully green.
- `rg` is not installed on this machine; used `grep -rn` for the Date.now/randomUUID gate instead.
- Transient parallel-tree noise (sibling executor mid-write of `content/items.v2a.ts`, not a plan file): `tsc` and the pre-existing copy contrast test failed briefly at ~17:15-17:17, then went green again once the sibling finished writing. Left untouched per the parallel-work override; final verification re-run is green.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 01-03 (wave 2): picker plus Today can import `buildDemoState`/`DEMO_DISPLAY_NAME` from `app/lib/seed.ts` and `nodeChips`/`evidenceLines`/`revisionLine`/`allObservationStrings` from `app/lib/observations.ts`
- Note for 01-03: `buildDemoState()` returns session undefined; demo creation should go through `ensureDemoProfile(seedState)` per 01-01's decoupled boundary

---
*Phase: 01-profile-system*
*Completed: 2026-10-10*
