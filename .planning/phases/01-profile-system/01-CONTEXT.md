# Phase 01: Profile system - Context

**Gathered:** 10 Oct 2026
**Status:** Ready for planning
**Source:** Builder spec (plan-phase invocation) + EXECUTION.md WP3. No discuss-phase run — deadline 20:00; invocation text treated as locked input.

<domain>
## Phase Boundary

App opens on a login (profile picker). The active profile is remembered forever (no expiry).
Each profile stores its own progress, its own strengths/weaknesses, and its own revision
schedule. A seeded demo account exists for judges/video. Guest mode is unchanged
(sessionStorage, never touches profiles).

</domain>

<decisions>
## Implementation Decisions

### Login and persistence
- D-01: Login is a local profile picker, not server auth. No passwords, no network accounts (idea.md §15: no accounts, no database).
- D-02: Profiles persist under one localStorage key `kadi.profiles.v1`. Active profile id persisted; on launch the active profile resumes directly with a "switch profile" affordance. No login expiry, no timeout.
- D-03: Profile shape per EXECUTION.md WP3 §4.1: `id ("demo" | uuid), displayName, classLabel, targetExam, language, register, mentor, isDemo, createdAt, state: StudentState`.

### Per-profile data
- D-04: Each profile owns a full engine `StudentState`. The existing `useStudent` hook becomes profile-scoped (`useProfile`, reads/writes `profiles[activeId].state`). Engine/reducer untouched.
- D-05: Strengths & weaknesses computed from real state only: per-node state + 2–3 evidence lines from answer logs (e.g. standard vs changed-context counts, Guess calibration). No trait labels, no career verdicts (idea.md §5.5 honesty rules).
- D-06: Revision framework = existing spaced re-check engine (+1/+7/+30, `checked_immediate` → `retained` → `context_difficulty` on fail) surfaced per profile on Today (due re-checks max 3, weekly counts, student-chosen commitment day per idea.md §9). No new scheduling logic.

### Demo seed
- D-07: Demo profile (`isDemo: true`) seeded by replaying real engine events through the reducer (reproducible, same code paths): suspected-gap sessions on `projectile`/`kin_1d`, repairs to `checked_immediate`, one `no_prereq_weakness` session, one pass re-check (→ `retained`), one fail re-check (→ `context_difficulty`).
- D-08: Every screen showing demo history carries the **"simulated data"** badge.

### Guest mode (untouched)
- D-09: Guest sessions stay in sessionStorage, never read/write profiles, remount independently.

### the agent's Discretion
- Picker UI layout, profile creation fields beyond (name/class/target), exact seed event list, observation copy wording, where strengths card lives (Today section vs tab).

### Deferred Ideas
- Server accounts, passwords, cloud sync, multiple browsers, study-buddy sharing, teacher view.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product constraints (do not violate)
- `idea.md` §5.4–5.5 (transition table, six honest outcomes) — engine states seed must produce
- `idea.md` §9 (revision/accountability: commitment, check, reply; no streaks-as-motivation)
- `idea.md` §15 (privacy: no accounts/database/analytics; guest mode; delete-my-data)
- `EXECUTION.md` §4 WP3 (acceptance, data model, seed plan, screens, verify block)
- `Finals/app/.clinerules/project.md` — read before touching product code

### Code to reuse/extend
- `app/lib/store.ts` — `useStudent(guest)` hook to become profile-scoped
- `app/lib/state.ts` — `initialState()`, `Event` union (`load` included), `setNode`
- `app/lib/engine.ts` — `reduce(state, event)` pure reducer for seed replay
- `app/lib/types.ts` — `StudentState`, `NodeState`, `SessionOutcome`
- `app/lib/importer.ts` — import validation pattern (self-reported flag)
- `app/components/` — `App.tsx`, `Today.tsx`, `Shell.tsx` wiring points
- `app/tests/helpers.ts` — `start/give/ans` seed-test helpers

</canonical_refs>

<specifics>
## Specific Ideas

- Storage key: `kadi.profiles.v1` → `{ activeId, profiles: Record<id, Profile> }`.
- Demo display name "Aarav (demo)". Calibration believability: 70–80% of "Pakka" answers correct.
- Verify block (WP3): new `tests/seed.test.ts` asserting seed yields `checked_immediate`, `retained`, `context_difficulty`, one `no_prereq_weakness` session; `tsc` clean.

</specifics>

<deferred>
## Deferred Ideas

Server accounts, passwords, sync, study buddy, teacher/coach view (idea.md §17 SLIDES ONLY).
</deferred>

---

*Phase: 01-profile-system*
*Context gathered: 10 Oct 2026 via invocation spec + EXECUTION.md WP3*
