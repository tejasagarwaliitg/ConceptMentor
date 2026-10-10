---
phase: 01-profile-system
plan: 01
subsystem: auth
tags: [localStorage, zod, react-hooks, profiles, sessionStorage]

# Dependency graph
requires: []
provides:
  - "Profile store (app/lib/profiles.ts): zod-validated kadi.profiles.v1 load/save, per-profile helpers, guest isolation helpers"
  - "Profile-scoped hook (app/lib/store.ts useProfile): loads/persists profiles[activeId].state, guest stays in sessionStorage"
  - "Store tests (app/tests/profiles.test.ts): 6 tests green covering round-trip, corrupt-fallback, guest isolation, per-profile writes, wording gate"
affects: [01-02-seed, 01-03-picker, App-gating, Today-views]

# Tech tracking
tech-stack:
  added: []
  patterns: [zod-safeParse-storage-boundary, read-modify-write-per-profile-persist]

key-files:
  created:
    - app/lib/profiles.ts
    - app/tests/profiles.test.ts
  modified:
    - app/lib/store.ts

key-decisions:
  - "Guest helpers live in profiles.ts so the isolation contract is unit-testable (node env has no component harness)"
  - "Guest keeps the legacy kadi.student.v1 string but only in sessionStorage; localStorage copy is retired with no dual-key reads"
  - "Explicit Profile/ProfileStore interfaces over StudentState instead of z.infer (zod optional-record inference is incompatible with StudentState Partial)"
  - "Dangling activeId sanitizes to null on load rather than throwing"
  - "Deprecated useStudent alias kept until plan 03 rewires App.tsx (parallel-plan boundary)"

patterns-established:
  - "Storage boundary: try/catch + zod safeParse + fresh fallback, never throws (copied from importer.ts)"
  - "Save after every change via effect; per-profile writes are read-modify-write so siblings stay untouched"

requirements-completed: [PROF-02, PROF-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Profile store with zod boundary: round-trip, corrupt-fallback, guest isolation, per-profile writes"
    requirement: "PROF-02"
    verification:
      - kind: unit
        ref: "tests/profiles.test.ts (6 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "useProfile hook loads and persists profiles[activeId].state; guest stays in sessionStorage"
    requirement: "PROF-03"
    verification:
      - kind: unit
        ref: "tests/profiles.test.ts (loadActiveState/persistActiveState/guest helpers)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Helper logic is unit-tested and tsc is clean, but the React effect wiring (load on mount, persist on change) needs one manual browser resume pass once the plan-03 picker can set an activeId"

# Metrics
duration: ~15min
completed: 2026-10-10
status: complete
---

# Phase 01 Plan 01: Profile Store + Profile-Scoped Hook Summary

**Device-local profile store under `kadi.profiles.v1` with zod boundaries, plus `useStudent` refactored to profile-scoped `useProfile`; 6/6 store tests green, tsc clean.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-10-10
- **Tasks:** 2 / 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `app/lib/profiles.ts`: `Profile` / `ProfileStore` types, `PROFILES_KEY`, zod schemas with length caps on all free-text fields, `loadStore` / `saveStore` (corrupt input returns fresh store, never throws), `createProfile` (randomUUID + counter-timestamp fallback, untouched `initialState()`), `ensureDemoProfile(seedState)` with no seed import, guest helpers (`loadGuestState` / `saveGuestState`) and hook helpers (`loadActiveState` / `persistActiveState`)
- `app/lib/store.ts`: `useProfile(activeId, guest)` keeps the existing `useReducer(reduce, undefined, initialState)` + ready gate + `queueMicrotask` load pattern; profile branch reads/writes `profiles[activeId].state` through profiles.ts, guest branch keeps sessionStorage behavior and never references the profiles key
- `app/tests/profiles.test.ts`: 6 tests green — byte-for-byte round-trip, corrupt/invalid fallback (5 shapes, never throws), guest-never-touches-profiles-key, profile-never-touches-guest-key, unique ids + per-profile write isolation, `containsBanned` on all new user-facing strings
- Engine files (`engine.ts`, `probe.ts`, `checks.ts`, `state.ts`) untouched; no new packages

## Task Commits

No commits — repo has no git history and commits were explicitly not requested (plan files implemented + verified, left uncommitted).

1. **Task 1: Profile store with zod boundary plus store tests** — done (TDD RED then GREEN)
2. **Task 2: Refactor useStudent to profile-scoped useProfile** — done (tsc clean, suite re-run green)

## Files Created/Modified

- `app/lib/profiles.ts` (created) — profile store, zod boundary, guest + active-profile helpers
- `app/tests/profiles.test.ts` (created) — 6 store tests following `tests/helpers.ts` conventions
- `app/lib/store.ts` (modified) — `useProfile(activeId, guest)` + deprecated `useStudent` compat alias

## Decisions Made

- Guest load/save helpers live in `profiles.ts` (not inline in the hook) because vitest runs in node env with no component harness — the guest-isolation contract the plan requires tested would otherwise be untestable without new dependencies.
- Guest keeps the legacy `kadi.student.v1` string but only ever in sessionStorage; the localStorage copy is retired — nothing reads it, no migration, no dual-key reads. Separate keys + separate storage areas per T-01-03.
- Explicit `Profile` / `ProfileStore` interfaces over `StudentState` instead of `z.infer`: zod's optional-record inference (`Record | undefined`) is assignability-incompatible with `StudentState`'s `Partial<Record>` in both directions, so zod validates at the boundary and `toStudentState()` normalizes to the app type.
- Dangling `activeId` (points at a missing profile) sanitizes to `null` on load instead of throwing or bricking launch.
- `send` stays dispatch-only; persistence after every send happens via the existing save-on-every-change effect calling `persistActiveState` — the only correct pattern with `useReducer` (no synchronous post-dispatch state), satisfying the `send -> persistence after every change` key link.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Kept a deprecated `useStudent(guest)` alias in store.ts**
- **Found during:** Task 2 (grep for `useStudent` before renaming — sole consumer is `app/components/App.tsx`, owned by parallel plan 01-03)
- **Issue:** Removing the export breaks `tsc` (App.tsx imports it) and editing App.tsx would collide with the parallel 01-02/01-03 executors on the same tree
- **Fix:** `useStudent(guest)` kept as a thin compat wrapper over `useProfile(null, guest)` with a `ponytail:` delete-note; guest behavior identical, non-guest returns fresh state until plan 03 rewires App to the picker + `useProfile`
- **Files modified:** `app/lib/store.ts`
- **Verification:** `npx tsc --noEmit` clean
- **Committed in:** n/a (no commits per execution overrides)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal compat shim, zero behavior change for guest mode; plan 03 removes the alias when it rewires App.tsx. No scope creep.

## Issues Encountered

- **Pre-existing failures, out of scope (not fixed):** `tests/items.test.ts` (2) and `tests/review.test.ts` (8) fail on item-bank content assertions (derivations, repetition). Neither file imports `lib/store` or `lib/profiles` (only unrelated `lib/qbank/store`, `lib/notify/store`) — pre-existing, unrelated to this plan.
- **Parallel-executor files, not touched:** `tests/seed.test.ts` and `tests/observations.test.ts` (plan 01-02's RED-phase tests) fail to resolve `@/lib/seed` / `@/lib/observations`, which the sibling executor has not created yet. Left alone per the touch-only-my-files boundary.
- **Plan verify scope:** `npx tsc --noEmit` clean; `npx vitest run tests/profiles.test.ts` 6/6 green. Full-suite green is blocked only by the two out-of-scope items above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for plan 01-02 (demo seed feeds `ensureDemoProfile(seedState)`) and plan 01-03 (picker sets `activeId`, App gates on it and calls `useProfile`).
- Plan 03 must delete the `useStudent` compat alias when rewiring `App.tsx`.
- Manual browser resume check (create profile → reload → resumes) still needed once the picker exists — see coverage D2.

---
*Phase: 01-profile-system*
*Completed: 2026-10-10*

## Self-Check: PASSED

- `app/lib/profiles.ts`, `app/tests/profiles.test.ts`, `app/lib/store.ts` all present on disk
- `npx tsc --noEmit` clean; `npx vitest run tests/profiles.test.ts` 6/6 green
- No files modified outside the plan's `files_modified` (engine/probe/checks/state untouched, plan-02 files untouched)
