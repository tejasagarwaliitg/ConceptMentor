---
phase: 01-profile-system
plan: 03
subsystem: ui
tags: [profiles, picker, demo-badge, today, react, localStorage]

# Dependency graph
requires:
  - phase: 01-profile-system
    provides: "Profile store + useProfile hook (01-01) and demo seed + observation selectors (01-02)"
provides:
  - "First-launch profile picker with demo / fresh / guest entry and App gating with resume"
  - "Per-profile Today card, strengths, revision with commitment control, shared DemoBadge on Today + Map"
affects: [verify-work, phase-2-youtube, manual-QA-journey]

# Tech tracking
tech-stack:
  added: []
  patterns: [picker-gate-on-activeId, isDemo-prop-threading, selector-rendered-strengths]

key-files:
  created:
    - app/components/ProfilePicker.tsx
    - app/components/DemoBadge.tsx
  modified:
    - app/components/App.tsx
    - app/components/Today.tsx
    - app/components/MapView.tsx
    - app/lib/store.ts

key-decisions:
  - "ActiveId lives in the profile store (kadi.profiles.v1); App holds the store snapshot and persists on every select/create/demo/switch"
  - "DemoBadge reuses the existing quiet-tag class — no CSS edits, plan files only"
  - "No streak line anywhere new; weekly counts carry the accountability signal per plan"
  - "Commitment control dispatches setRecheckChoice per due node with at: now(state) so the simulated clock is honoured"

patterns-established:
  - "Picker gate: activeId null (and not guest) renders ProfilePicker, otherwise StudentApp remounts on `profile:activeId` key so reducer state cannot leak across profiles"
  - "isDemo threads from App with default false into Today and MapView; badge renders from that single flag"

requirements-completed: [PROF-01, PROF-04, PROF-05, PROF-06]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "First launch shows profile picker (stored profiles, demo, fresh, guest); select/create enters Today; switch-profile returns to picker; reload resumes"
    requirement: "PROF-01"
    verification:
      - kind: unit
        ref: "tests/profiles.test.ts (6 tests)"
        status: pass
      - kind: unit
        ref: "tests/seed.test.ts (4 tests)"
        status: pass
    human_judgment: true
    rationale: "Storage + seed layers are unit-tested but picker/gating/resume is component wiring with no harness — needs one manual browser pass"
  - id: D2
    description: "Today shows per-profile card, evidence-backed strengths, due re-checks capped at 3 with 1/3/7-day commitment control"
    requirement: "PROF-04"
    verification:
      - kind: unit
        ref: "tests/observations.test.ts (3 tests)"
        status: pass
      - kind: unit
        ref: "tests/copy.test.ts (6 tests)"
        status: pass
    human_judgment: true
    rationale: "Selectors and copy are unit-tested but Today rendering needs one manual visual pass"
  - id: D3
    description: "Demo history on Today and Map carries the shared simulated-data badge whenever profile.isDemo"
    requirement: "PROF-06"
    verification:
      - kind: other
        ref: "npx tsc --noEmit (plan files clean)"
        status: pass
    human_judgment: true
    rationale: "Badge presence on both screens needs one manual visual pass with the demo profile"

# Metrics
duration: ~20min
completed: 2026-10-10
status: complete
---

# Phase 01 Plan 03: Picker, Today Profile Views, Demo Badge Summary

**Profile picker as first screen with demo/fresh/guest entry, App gating with resume and switch-profile, per-profile Today card plus strengths plus capped revision with commitment control, and a shared simulated-data badge on Today and Map.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-10-10
- **Tasks:** 2 / 2
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- `app/components/ProfilePicker.tsx`: lists stored profiles (displayName, classLabel, targetExam), Use demo account button, Start fresh form (name/class/target with maxLength caps matching the zod boundary), Continue-as-guest link; all names render as text nodes only
- `app/components/App.tsx`: loads `kadi.profiles.v1` on boot, gates on `activeId` (null + not guest renders the picker), demo creation via `ensureDemoProfile(buildDemoState())`, `useProfile(activeId, guest)`, remount key `profile:activeId` / `guest` so reducer state cannot leak across profiles or modes, switch-profile returns to the picker without clearing stored profiles
- `app/components/Today.tsx`: profile card (name, class/target detail, This week N checks M passed from `thisWeek`, DemoBadge, switch-profile button; "Guest session" fallback), strengths section rendering `nodeChips` + `evidenceLines` below the weekly card, revision section keeping `due.slice(0, 3)` plus `revisionLine` weekly counts plus per-node 1/3/7-day commitment buttons dispatching `setRecheckChoice` with `at: now(state)`; simulate controls kept; no streak line
- `app/components/DemoBadge.tsx` + `MapView.tsx`: single shared badge reusing the existing `quiet-tag` class, threaded as `isDemo` (default false) from App into Today and MapView
- `app/lib/store.ts`: deprecated `useStudent` compat alias deleted; zero `useStudent` references remain anywhere
- Engine files (`engine.ts`, `probe.ts`, `checks.ts`, `state.ts`) untouched; no new packages

## Task Commits

No commits — repo has no git history and commits were explicitly not requested (plan files implemented + verified, left uncommitted).

1. **Task 1: Profile picker plus App gating and resume** — done (picker + gating + alias deletion; tsc plan-files clean, profiles 6/6 + seed 4/4 green)
2. **Task 2: Today profile card, strengths, revision, and demo badge** — done (Today + MapView + DemoBadge; observations 3/3 + copy 6/6 green)

## Files Created/Modified

- `app/components/ProfilePicker.tsx` (created) — first-screen picker, demo/fresh/guest entry
- `app/components/DemoBadge.tsx` (created) — shared simulated-data badge (D-08)
- `app/components/App.tsx` (modified) — store snapshot, picker gate, `useProfile` rewire, `isDemo` threading, `onCommit` wiring
- `app/components/Today.tsx` (modified) — profile card, strengths, revision + commitment, badge
- `app/components/MapView.tsx` (modified) — `isDemo` prop + badge in heading
- `app/lib/store.ts` (modified) — `useStudent` alias deleted (wave-1 handoff requirement; only change outside plan `files_modified`, explicitly instructed by orchestrator override)

## Decisions Made

- `activeId` persistence lives in the profile store itself: App holds one store snapshot and calls `saveStore` on every select/create/demo/switch, so resume-after-reload falls out of `loadStore` with no extra key.
- Badge reuses the existing `quiet-tag` class instead of new CSS — the plan's `files_modified` excludes stylesheets, and the quiet tag is the established muted-label pattern in both Today and MapView.
- Commitment `at` uses `now(state)` (not `Date.now()`) so choices honour the simulated clock the demo controls advance.
- Fresh-profile inputs carry `maxLength` 80/40/80 matching the zod caps in `profiles.ts`, since `saveStore` does not re-validate and an over-long name would fail the next `loadStore` parse back to a fresh store.

## Deviations from Plan

None - plan executed exactly as written. (The `store.ts` alias deletion is plan-mandated via the wave-1 handoff, not a deviation.)

**Total deviations:** 0 auto-fixed. **Impact:** none.

## Issues Encountered

- **Out of scope, not fixed:** `npx tsc --noEmit` reports only `lib/derive.ts` duplicate-declaration errors (sibling session's concurrent question-bank file, last written 17:20, never touched by this plan). All six plan-touched files are tsc-clean (verified by scoped grep: zero errors in `components/App|Today|MapView|ProfilePicker|DemoBadge` or `lib/store`).
- **Out of scope, not fixed:** full suite is 143/145 — the 2 failures are both in `tests/items.test.ts` (option-shuffle / grading answer-key checks on question-bank content the sibling session is editing). That suite imports nothing from this plan's files; plan-scoped suites (profiles, seed, observations, copy: 19/19) are fully green.
- Threat-model mitigations hold: T-03-01 text-nodes-only verified by grep (no `dangerouslySetInnerHTML` in any touched component); T-03-02 badge renders on both history screens from the single `isDemo` flag; T-03-SC no packages installed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for verify-work: manual browser pass needed for D1 (picker → create/select → reload resumes → switch-profile), D2 (Today strengths/revision rendering), D3 (badge visible on Today + Map with demo profile) — see coverage block.
- Guest-mode Today shows the "Guest session" card with weekly counts and the existing guest toggle is untouched.

---
*Phase: 01-profile-system*
*Completed: 2026-10-10*

## Self-Check: PASSED

- `app/components/ProfilePicker.tsx`, `app/components/DemoBadge.tsx` present; `App.tsx`, `Today.tsx`, `MapView.tsx`, `lib/store.ts` edited in place
- `npx vitest run tests/profiles.test.ts tests/seed.test.ts tests/observations.test.ts tests/copy.test.ts` 19/19 green; full suite 143/145 with only out-of-scope `items.test.ts` failures
- Scoped `tsc` grep: zero errors in all touched files; `lib/derive.ts` errors confirmed pre-existing/concurrent and untouched
- `useStudent` grep: zero references; `dangerouslySetInnerHTML` grep: zero hits in touched components
- No files modified outside plan scope except the orchestrator-mandated `store.ts` alias deletion; engine/probe/checks/state untouched; sibling-owned content/test files untouched
