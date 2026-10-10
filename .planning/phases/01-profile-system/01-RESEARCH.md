# Phase 1: Profile system - Research

**Researched:** 10 Oct 2026
**Domain:** Device-local multi-profile identity + per-profile engine state (Next.js 16 + React 19 + TS + localStorage)
**Confidence:** HIGH

## Summary

Phase 1 adds a local profile picker as the app's first screen. One localStorage key (`kadi.profiles.v1`) holds `{ activeId, profiles }`; each profile owns a full engine `StudentState`; the existing `useStudent` hook becomes profile-scoped; the engine/reducer is untouched; the demo profile is seeded by replaying real graded events through `reduce()`; strengths/weaknesses and revision are computed views over real state (no new scheduling logic).

The codebase already contains every pattern this phase needs: `store.ts` (load/save/guest isolation), `state.ts` + `engine.ts` (pure reducer, never throws), `checks.ts` (`dueNodes`, `thisWeek`), `importer.ts` (zod boundary + `selfReported` flag), `tests/helpers.ts` (`start/give/ans`), and `Today.tsx` (due ≤3, weekly card, simulate controls). No new npm packages are needed.

**Primary recommendation:** Build `lib/profiles.ts` (zod-validated store) + `lib/seed.ts` (reducer replay) + refactor `useStudent` to `useProfile`, reusing `store.ts`/`importer.ts`/`helpers.ts` patterns verbatim; compute strengths/revision from `nodes` + `session.answers` + `dueNodes`/`thisWeek`.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Login is a local profile picker, not server auth. No passwords, no network accounts (idea.md §15: no accounts, no database).
- D-02: Profiles persist under one localStorage key `kadi.profiles.v1`. Active profile id persisted; on launch the active profile resumes directly with a "switch profile" affordance. No login expiry, no timeout.
- D-03: Profile shape per EXECUTION.md WP3 §4.1: `id ("demo" | uuid), displayName, classLabel, targetExam, language, register, mentor, isDemo, createdAt, state: StudentState`.
- D-04: Each profile owns a full engine `StudentState`. The existing `useStudent` hook becomes profile-scoped (`useProfile`, reads/writes `profiles[activeId].state`). Engine/reducer untouched.
- D-05: Strengths & weaknesses computed from real state only: per-node state + 2–3 evidence lines from answer logs (e.g. standard vs changed-context counts, Guess calibration). No trait labels, no career verdicts (idea.md §5.5 honesty rules).
- D-06: Revision framework = existing spaced re-check engine (+1/+7/+30, `checked_immediate` → `retained` → `context_difficulty` on fail) surfaced per profile on Today (due re-checks max 3, weekly counts, student-chosen commitment day per idea.md §9). No new scheduling logic.
- D-07: Demo profile (`isDemo: true`) seeded by replaying real engine events through the reducer (reproducible, same code paths): suspected-gap sessions on `projectile`/`kin_1d`, repairs to `checked_immediate`, one `no_prereq_weakness` session, one pass re-check (→ `retained`), one fail re-check (→ `context_difficulty`).
- D-08: Every screen showing demo history carries the **"simulated data"** badge.
- D-09: Guest sessions stay in sessionStorage, never read/write profiles, remount independently.

### The agent's Discretion
- Picker UI layout, profile creation fields beyond (name/class/target), exact seed event list, observation copy wording, where strengths card lives (Today section vs tab).

### Deferred Ideas (OUT OF SCOPE)
- Server accounts, passwords, cloud sync, multiple browsers, study-buddy sharing, teacher view.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROF-01 | Login: app asks who is using it on entry — profile picker with demo account + fresh profile creation (name, class, target exam) | Profile store shape + `useProfile` refactor + picker-as-first-screen pattern (see Architecture Patterns 1–2) |
| PROF-02 | Remember the user with no login expiry — active profile persists across restarts indefinitely | `kadi.profiles.v1` `{activeId, profiles}` shape; resume-active-on-launch; save-after-every-change pattern from `store.ts` |
| PROF-03 | Per-profile progress — each profile owns a full engine `StudentState` (nodes, weekly, re-checks) | `state: StudentState` nested per profile; reducer untouched; `load` event swaps state |
| PROF-04 | Per-profile strengths & weaknesses — evidence-backed view computed from real engine state and answer logs | Strengths computation pattern (node states + standard/changed-context counts + Guess calibration from `session.answers`) |
| PROF-05 | Per-profile revision framework — spaced re-checks (+1/+7/+30) and due items surfaced per profile, student-chosen commitment | `dueNodes`/`thisWeek` selectors + `setRecheckChoice` event; Today already renders due ≤3 + weekly + simulate |
| PROF-06 | Seeded demo account with reproducible history and visible "simulated data" badge | Seed-by-replay pattern (`lib/seed.ts` runs `reduce()` over fixed event list); `isDemo` badge rule; `tests/seed.test.ts` assertions |

## Project Constraints (from AGENTS.md)

Root `AGENTS.md` (binding) + `app/.clinerules/project.md` (binding). `app/AGENTS.md` is the auto-generated Next.js block — leave it alone [VERIFIED: codebase read].

- Only shippable code is `Finals/app/` (Next.js 16 + React 19 + TS + Tailwind 4 + zod + KaTeX + `@cline/sdk`). Do not edit `idea.md` (locked spec) [CITED: Finals/AGENTS.md].
- Run from `Finals/app/`: `npm run dev` (:3000), `npm run build` / `npm run lint`. **No `npm test` script exists** — verify with `npx tsc --noEmit && npx vitest run` (tests in `tests/`, run via `vitest.config.ts`) [VERIFIED: package.json read — scripts are dev/build/start/lint only].
- `Finals/app/AGENTS.md` auto-generated by `next dev` — leave its block alone [CITED: Finals/AGENTS.md].
- Env: public app works with no env (no-AI mode). `SERVE_UNAPPROVED=true` serves draft items for local dev only, ignored in production. Nothing unapproved ever served in prod. Node 22+ required (machine has Node 24 — verified 24.16.0 below) [CITED: Finals/AGENTS.md].
- Engine is a pure reducer (`lib/probe.ts`, `lib/engine.ts`, `lib/checks.ts`, `lib/state.ts`): `(state, event) -> state`. Only graded server events change node states. Reducer never throws — invalid events return state unchanged [VERIFIED: engine.ts try/catch + `state.ts`].
- Grading is server-only: `lib/items.ts` imports `server-only`; answers/tags never reach the browser [CITED: Finals/AGENTS.md].
- Wording bans (enforced + tested): never `weak/fail/dumb/bekaar/trick-user/root cause/unblocks/mastered`. Use `suspected contributing gap`, `connected to N later topics`, `Immediate check passed; retention untested` [VERIFIED: `lib/mentor/schemas.ts` BANNED list + `tests/copy.test.ts`].
- `lib/safety.ts` distress gate runs before any free-text processing in both modes; zod at every boundary [VERIFIED: safety.ts read].
- `idea.md` §5 (evidence policy, transition table, 6-item budget) is the spec for engine + copy + bank + demo — change them together with `tests/` [CITED: Finals/AGENTS.md].
- Repo has no git history yet (all files untracked). Don't init/commit unless asked [CITED: Finals/AGENTS.md].

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Profile picker / login screen | Browser / Client | — | Identity is device-local; no server, no auth backend (D-01) |
| Profile persistence (`kadi.profiles.v1`) | Browser / Client | — | localStorage only; guest stays in sessionStorage (D-09) |
| Engine state per profile | Browser / Client | — | `StudentState` already lives in localStorage; reducer is client-side pure |
| Strengths/weaknesses computation | Browser / Client | — | Pure derived view over `nodes` + `session.answers`; no server call |
| Revision surfacing (due, weekly, commitment) | Browser / Client | — | `dueNodes`/`thisWeek` selectors already exist client-side |
| Demo seed generation | Browser / Client (build-time/static) | — | Fixed event list replayed through `reduce()`; result is static seed data |

## Standard Stack

### Core
No new packages. Everything this phase needs is already installed [VERIFIED: package.json read]:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.0 | App Router, client screens | Already the app framework |
| react / react-dom | 19.3.0 | Picker, profile card, strengths card UI | Already the UI layer |
| zod | ^4.6.5 | Profile/store/import validation at every boundary | Project rule: zod at every boundary; `importer.ts` pattern to copy |
| typescript | ^5 | Types for `Profile` / `ProfileStore` | Already enforced via `tsc --noEmit` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^5.0.3 | `tests/seed.test.ts` + profile store tests | New tests follow `tests/helpers.ts` + `recheck.test.ts` patterns |
| `crypto.randomUUID` | built-in (Node 24 / browsers) | Fresh profile `id` | Already used in `App.tsx` for `sessionId`; reuse for profile ids [VERIFIED: App.tsx] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| localStorage profiles | IndexedDB / server DB | Rejected — D-01/D-02 lock localStorage; idea.md §15 forbids accounts/database |
| New state library (zustand/redux) | `useReducer` + `useState` | Rejected — `store.ts` `useReducer(reduce, …)` pattern works; no new dependency |
| UUID package | `crypto.randomUUID()` | Use built-in; one fewer dependency [ASSUMED: all target browsers support `crypto.randomUUID` — verify on the 320px/390px phone test devices] |

**Installation:**
```bash
# No installs required for this phase.
```

**Version verification:** `zod ^4.6.5`, `next 16.4.0`, `react 19.3.0`, `vitest ^5.0.3` confirmed in `app/package.json` [VERIFIED: package.json read 10 Oct 2026]. Node `v24.16.0`, npm `11.13.0` confirmed on machine [VERIFIED: `node --version` / `npm --version` this session].

## Package Legitimacy Audit

No external packages are installed by this phase. Protocol steps 1–3 (legitimacy check, registry verification, postinstall scan) are N/A — there is nothing to check.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| *(none — no new packages)* | — | — | — |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

## Architecture Patterns

### System Architecture Diagram

```
App launch
  │
  ▼
Read `kadi.profiles.v1` ── corrupt/missing? ──► fresh store { activeId: null, profiles: {} }
  │                                                        │
  │ activeId set?                                          │ no (first run)
  ▼                                                        ▼
Resume active profile ──► Today (profile card,        Profile picker:
(state → useProfile)      strengths, due ≤3,           [Demo] [You/fresh] [Guest]
                          weekly, badge if isDemo)            │
                                                     select/create
                                                        │
                                                        ▼
                                              ┌── demo → seeded state (replay)
                                              ├── fresh → initialState()
                                              └── guest → sessionStorage, remount
                                                        │
                                                        ▼
                                              All writes: profiles[activeId].state
                                              (save after EVERY change)
```

### Recommended Project Structure
```
app/
├── lib/
│   ├── profiles.ts      # NEW: Profile/ProfileStore types + zod schemas + load/save
│   ├── seed.ts          # NEW: fixed event list → demo StudentState via reduce()
│   ├── observations.ts  # NEW (or fold into Today): strengths/weaknesses selectors
│   ├── store.ts         # REFACTOR: useStudent → useProfile (profile-scoped)
│   ├── state.ts         # UNTOUCHED (initialState, Event, setNode)
│   ├── engine.ts        # UNTOUCHED (reduce)
│   ├── checks.ts        # UNTOUCHED (dueNodes, thisWeek)
│   └── importer.ts      # REUSE pattern (zod boundary + selfReported)
├── components/
│   ├── ProfilePicker.tsx# NEW: first screen (list, demo, fresh, guest link)
│   ├── Today.tsx        # EXTEND: profile card + strengths card + badge
│   └── App.tsx          # EXTEND: gate on activeId (picker vs Today)
└── tests/
    ├── seed.test.ts     # NEW: asserts checked_immediate/retained/context_difficulty + no_prereq_weakness
    └── profiles.test.ts # NEW: store round-trip, corrupt→fresh, guest isolation
```

### Pattern 1: Profile store shape (single key, zod at boundary)
**What:** One localStorage key holds `{ activeId, profiles }`. Every load parses through zod; corrupt → fresh store. Save after every change (patchy networks, shared phones).
**When to use:** All profile persistence in this phase.
**Example:**
```typescript
// Source: app/lib/store.ts (existing) + app/lib/importer.ts (zod pattern) — VERIFIED
const KEY = "kadi.profiles.v1"; // NEW key; old "kadi.student.v1" retired/migrated

type Profile = {
  id: string; displayName: string; classLabel: string; targetExam: string;
  language: "en" | "hi" | "ta" | "te" | "bn" | "mr";
  register: "aap" | "tum" | "tu"; mentor: "bhaiya" | "didi";
  isDemo: boolean; createdAt: number; state: StudentState;
};
type ProfileStore = { activeId: string | null; profiles: Record<string, Profile> };

// Load: try/catch + zod, corrupt → fresh (copy store.ts lines 14-30)
let saved: ProfileStore = { activeId: null, profiles: {} };
try {
  const raw = window.localStorage.getItem(KEY);
  if (raw) { const p = ProfileStoreSchema.safeParse(JSON.parse(raw)); if (p.success) saved = p.data; }
} catch { /* Start fresh if storage is unavailable or corrupt. */ }

// Save after EVERY change (copy store.ts lines 32-41)
// storage().setItem(KEY, JSON.stringify(store));
```

### Pattern 2: Hook refactor (`useStudent` → `useProfile`)
**What:** Keep the `useReducer(reduce, …)` + `ready` gate + `queueMicrotask` load exactly as-is; scope reads/writes to `profiles[activeId].state`. Guest keeps the existing `key={guest?…}` remount so it never touches profiles.
**When to use:** The single state hook for the whole app.
**Example:**
```typescript
// Source: app/lib/store.ts + app/components/App.tsx — VERIFIED
export function useProfile(activeId: string | null) {
  const [state, dispatch] = useReducer(reduce, undefined, initialState);
  const [ready, setReady] = useState(false);
  // load: dispatch({ type: "load", state: profiles[activeId].state })
  // send wrapper: dispatch(ev) then persist profiles[activeId].state = next
  // NOTE: engine.ts "load" clears session and requires version===1 — VERIFIED (engine.ts line 19)
}
// App.tsx already remounts on guest toggle: <StudentApp key={guest ? "guest" : "saved"} …/>
// Add the same remount on activeId change so stale sessions can't leak across profiles.
```

### Pattern 3: Seed-by-replay (reproducible demo history)
**What:** Build the demo `StudentState` by folding a fixed event list through `reduce()` — never by hand-writing node states. Same code paths as real play, deterministic, testable with `tests/helpers.ts` (`start/give/ans`).
**When to use:** `lib/seed.ts` demo profile construction.
**Example:**
```typescript
// Source: app/tests/helpers.ts + app/tests/recheck.test.ts — VERIFIED
import { initialState, reduce } from "@/lib/engine";
let s = reduce(initialState(), { type: "startSession", entry: "projectile", at: T0, sessionId: "seed-1" });
s = reduce(s, { type: "graded", answer: ans("projectile", "B1", false, "shayad", T0) });
s = reduce(s, { type: "graded", answer: ans("projectile", "A", true, "pakka", T0) });
// … repairs (B2 pass → checked_immediate), re-checks after simulateDays (+1d pass → retained; fail → context_difficulty)
// Calibration believability per D-07/CONTEXT specifics: 70–80% of "pakka" answers correct.
```

### Pattern 4: Strengths computation (evidence-backed, honest)
**What:** Per-node state from `state.nodes` + 2–3 observation lines counted from `session.answers` / node history (standard-A vs changed-context-B1 split, Guess calibration). No trait labels, no career verdicts.
**When to use:** Strengths card on Today (section or tab — agent's discretion).
**Example:**
```typescript
// Source: derived from app/lib/types.ts GradedAnswer + app/lib/checks.ts selectors — VERIFIED
const answers = state.session?.answers ?? [];
const std = answers.filter(a => a.type === "A" && a.correct === true).length;
const changedMiss = answers.filter(a => a.type === "B1" && a.correct === false).length;
const guesses = answers.filter(a => a.confidence === "guess");
const guessWrong = guesses.filter(a => a.correct === false).length;
// Render: "correct on {std} standard, {changedMiss} changed-context difficult" + "Guess × {n}, {m} wrong"
// Node chips: state.nodes → icon + "connected to N later topics" via connectedCount(node) (checks.ts)
```

### Pattern 5: Revision surfacing (existing engine, no new scheduling)
**What:** Reuse `dueNodes(state)` (due ≤3 on Today — already implemented), `thisWeek(state)` weekly counts, `setRecheckChoice` for the student-chosen commitment day (idea.md §9). Simulate controls already exist in Today.
**When to use:** Per-profile Today revision section.
**Example:**
```typescript
// Source: app/components/Today.tsx + app/lib/checks.ts — VERIFIED
const due = dueNodes(state), week = thisWeek(state);
// {due.slice(0, 3).map(n => <button onClick={() => onRecheck(n)}>…)}  — keep the slice(0,3)
// week.done / week.passed → "Is hafte: N checks kiye" line
// send({ type: "setRecheckChoice", node, days: 1|3|7, at: now(state) }) — commitment (engine.ts validates node is checked_immediate/retained)
```

### Anti-Patterns to Avoid
- **Hand-writing seed node states:** bypasses the transition table; seed must go through `reduce()` or `tests/seed.test.ts` can't prove the states are reachable.
- **Storing `session` in a profile:** `load` already strips `session` (`session: undefined`, engine.ts line 19) — persisting a live session across profiles/launches resurrects stale probes.
- **Per-profile keys (`kadi.profile.<id>`):** fragments storage, breaks atomic activeId switching; D-02 locks one key.
- **Computing strengths from counts alone:** counts without node states are unverified claims; every line must cite `nodes[x].state` or an answer-log count.
- **Inventing scheduling intervals:** +1/+7/+30 lives in `RECHECK_INTERVAL_DAYS` (state.ts); Today only surfaces it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation at storage boundary | Custom `if (parsed?.version === 1 …)` checks for profiles | zod `ProfileStoreSchema.safeParse` (extend `importer.ts` pattern) | Importer already handles version literal, nested records, array caps; custom checks silently accept new fields and drift |
| Demo history | Hand-written `StudentState` fixture | `reduce()` replay over fixed events (`seed.ts`) | Only replay exercises idempotency (`seenInstances`), budget (6), invalid-transition rejection; hand state can encode unreachable combinations |
| Test answers | Ad-hoc `GradedAnswer` literals | `tests/helpers.ts` `start/give/ans` | Counter-based unique `instanceId`s prevent accidental idempotency collisions; `repaired()` gives the canonical suspected-gap state |
| Due/weekly display | Custom date math | `dueNodes` / `thisWeek` / `now` from `lib/engine.ts` | `simulatedDays` offset and `weekKey` edge cases already handled and tested |
| Display names in UI | `dangerouslySetInnerHTML` or interpolation without escaping | React default escaping (text nodes only) | `displayName` is user input rendered on every screen — default JSX escaping is the stored-XSS mitigation |
| IDs | `Date.now()` / `Math.random()` ids | `crypto.randomUUID()` | Already used for `sessionId` in App.tsx; collision-safe across profiles |

**Key insight:** This phase is pure composition — store pattern + reducer + selectors + zod boundary all exist. The only new logic is the `Profile` wrapper type and the fixed seed event list. Anything that looks like new state machinery is a sign the plan drifted into engine changes (forbidden by D-04).

## Common Pitfalls

### Pitfall 1: localStorage corruption / schema drift bricks the app
**What goes wrong:** A half-written `kadi.profiles.v1` (killed mid-save, old shape after a code change) throws on launch → blank screen on stage.
**Why it happens:** `JSON.parse` throws; zod-unvalidated shapes pass `undefined` into the reducer.
**How to avoid:** Copy `store.ts` exactly: `try/catch` around parse + zod `safeParse`, fall back to fresh store. Gate render on `ready` (`if (!ready) return …`). Never bump stored `version` without a migration branch.
**Warning signs:** Any plan that reads `localStorage.getItem` without `try/catch` + `safeParse`.

### Pitfall 2: Guest session leaks into / reads from profiles
**What goes wrong:** Judge taps guest mode, answers, and the demo profile's history changes (or guest sees demo data).
**Why it happens:** Shared hook/storage key, or missing remount so the old reducer state survives the mode switch.
**How to avoid:** Keep `sessionStorage` + separate key for guest (existing `store.ts` `storage()` switch); keep `key={guest?…}` remount in `App.tsx` and extend to `activeId`; guest code path must never reference `kadi.profiles.v1`.
**Warning signs:** A plan with one hook reading both storages, or no `key=` remount on identity switch.

### Pitfall 3: Demo badge missing on one screen
**What goes wrong:** Video/screenshot shows seeded history without the "simulated data" badge → honesty violation (idea.md: anything seeded is labelled simulated).
**Why it happens:** Badge added to Today but not to Map/strengths/revision views that also render `nodes` history.
**How to avoid:** Derive badge from `profile.isDemo` in one shared component (e.g. `DemoBadge`) rendered wherever `state.nodes` history or observations appear; add a test asserting every history-rendering component includes it.
**Warning signs:** Badge implemented as copy-pasted JSX per screen instead of one component.

### Pitfall 4: Non-deterministic seed (timestamps / random ids)
**What goes wrong:** `seed.ts` produces different states per run → `seed.test.ts` flakes, video history unreproducible.
**Why it happens:** `Date.now()` inside the event list or `crypto.randomUUID()` for `instanceId`s.
**How to avoid:** Fixed `at` constants (helpers default `at = 1_000_000`) and counter-based `instanceId`s (`inst-${counter}`); wall-clock only via `simulateDays` with fixed offsets.
**Warning signs:** `Date.now()` or `randomUUID` anywhere in `seed.ts` or its tests.

### Pitfall 5: Banned wording in new copy (profile/observations/seed labels)
**What goes wrong:** Picker or strengths card says "weak", "fail", "mastered", "root cause", "unblocks" → `copy.test.ts`-style gate fails, honesty violation.
**Why it happens:** Natural synonyms for strengths/weaknesses ("your weak topics", "mastered ✓").
**How to avoid:** Route ALL new strings through `containsBanned` (`lib/mentor/schemas.ts`) + the `copy.test.ts` regex (`/root cause|unblock|mastered|trick-user|rank|leaderboard|streak/`); use "solid / needs another look / not checked yet" style labels. Extend `copy.test.ts` to cover the new observation strings.
**Warning signs:** Adjectives describing the student rather than observations describing evidence.

### Pitfall 6: `load` event / engine untouched violated
**What goes wrong:** Plan modifies `engine.ts`/`probe.ts`/`checks.ts` to "support profiles".
**Why it happens:** Confusing per-profile state with per-node state machine.
**How to avoid:** D-04 locks the engine. Profiles only change *which* `StudentState` is loaded into the existing reducer. Note: EXECUTION.md WP1 fix #1 claims `load` is missing from the `Event` union — it is **already present** (`state.ts` line 42: `{ type: "load"; state: StudentState }`) [VERIFIED: state.ts read]. No engine fix needed for this phase.
**Warning signs:** Any diff touching `lib/engine.ts`, `lib/probe.ts`, `lib/checks.ts`, `lib/state.ts` in a profile plan.

### Pitfall 7: Active-profile resume loop / picker trap
**What goes wrong:** Launch resumes active profile but "switch profile" is unreachable (or picker re-asks every launch despite D-02).
**Why it happens:** Resume logic and picker gating in the same component without a `switchProfile` affordance on Today.
**How to avoid:** `App.tsx` gates: `activeId == null → <ProfilePicker/>`, else Today with a visible "switch profile" button that sets `activeId = null` (or opens picker overlay) without clearing stored profiles.
**Warning signs:** No explicit "switch profile" UI element in the Today plan.

## Code Examples

Verified patterns from the actual codebase:

### Persist + resume (profile-scoped adaptation of store.ts)
```typescript
// Source: app/lib/store.ts — VERIFIED
const [state, dispatch] = useReducer(reduce, undefined, initialState);
const [ready, setReady] = useState(false);

useEffect(() => {
  let alive = true;
  queueMicrotask(() => {
    if (!alive) return;
    let saved = initialState();
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StudentState;
        if (parsed?.version === 1 && /* …field checks… */) saved = { ...parsed, /* … */ };
      }
    } catch { /* Start fresh if storage is unavailable or corrupt. */ }
    dispatch({ type: "load", state: saved });
    setReady(true);
  });
  return () => { alive = false; };
}, [guest]);

// save after EVERY change (patchy networks, shared phones)
useEffect(() => {
  if (!ready) return;
  try { storage().setItem(KEY, JSON.stringify(state)); }
  catch { /* storage full or blocked */ }
}, [state, ready]);
```

### Import boundary (copy for ProfileStore validation)
```typescript
// Source: app/lib/importer.ts — VERIFIED
const Schema = z.object({
  version: z.literal(1),
  settings: z.object({ lowData: z.boolean() }),
  nodes: z.record(z.string(), NodeRecord),
  seenInstances: z.array(z.string().max(80)).max(200),
  recentItems: z.record(z.string().max(40), z.array(z.string().max(80)).max(12)).optional(),
  weekly: z.record(z.string(), z.object({ done: z.number().int().min(0), passed: z.number().int().min(0) })),
  simulatedDays: z.number().int().min(0).max(400),
  flaggedItems: z.array(z.string().max(80)).max(200),
});
const LIVE = new Set<string>(LIVE_NODES);
// Unknown nodes are dropped; imported nodes flagged selfReported: true
```

### Seed replay test skeleton (extend for seed.test.ts)
```typescript
// Source: app/tests/recheck.test.ts + app/tests/helpers.ts — VERIFIED
import { describe, expect, it } from "vitest";
import { dueNodes, now, reduce } from "@/lib/engine";
import { ans, give, repaired } from "./helpers";

let s = repaired();
s = give(s, ans("vec_comp", "B2", true, "pakka", 1_000_000));
expect(s.nodes.vec_comp!.state).toBe("checked_immediate");       // repair pass
s = reduce(s, { type: "simulateDays", days: 1 });
const t = now(s, 1_000_000);
s = give(s, ans("vec_comp", "R", true, "pakka", t));
expect(s.nodes.vec_comp!.state).toBe("retained");                // re-check pass → retained, +7d
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single implicit student (`kadi.student.v1`) | Profile map (`kadi.profiles.v1`, D-02) | This phase | Returning student recognised; multi-user shared device |
| Heuristic strengths copy | Evidence-counted observations from `nodes` + `answers` (D-05) | This phase | Honest, testable, no trait labels |
| Ad-hoc revision display | `dueNodes`/`thisWeek` selectors + `setRecheckChoice` surfaced per profile (D-06) | This phase (selectors pre-exist) | No new scheduling logic to test |

**Deprecated/outdated:**
- `kadi.student.v1` single-student key: retired by this phase (plan must include migration-or-fresh-start handling, not silent dual-key reads).
- EXECUTION.md WP1 fix #1 ("`load` missing from Event union"): stale — `load` is present in `state.ts` [VERIFIED]. Skip that fix.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `crypto.randomUUID()` available on all test/judge devices for profile ids | Standard Stack | Low — fallback is counter + timestamp id; planner should add fallback if old WebViews are in scope |
| A2 | Old `kadi.student.v1` data can be discarded (fresh start) rather than migrated into a profile | Pitfalls / State of Art | Medium — if the builder has real local progress worth keeping, planner needs a one-shot migration task; default per deadline pressure is discard |
| A3 | Per-profile `simulatedDays` offset lives inside each profile's `StudentState` (no shared clock) | Architecture | Low — matches "each profile owns full StudentState" (D-04); shared clock would leak demo time-travel into fresh profiles |

**If this table is empty:** n/a — 3 assumptions above need planner/user awareness (A2 is the one user-visible decision).

## Open Questions

1. **Migrate or discard `kadi.student.v1`?**
   - What we know: Current builds store one implicit student; CONTEXT/ECUTION don't specify migration.
   - What's unclear: Whether any device holds progress worth preserving.
   - Recommendation: Default to fresh start (deadline 20:00); planner adds a best-effort one-shot import (via `parseImport`, flagged `selfReported`) only if time permits.

2. **Where does the strengths card live — Today section vs tab?**
   - What we know: Explicitly agent's discretion (CONTEXT.md).
   - What's unclear: Screen budget on 320px phones.
   - Recommendation: Today section below the accountability band (one fewer nav state to build/test); planner decides.

## Environment Availability

Pure localStorage + React phase — no external services, no network, no CLIs beyond build/test [VERIFIED: CONTEXT D-01/D-02 + codebase].

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | vitest / build | ✓ | 24.16.0 | — |
| npm | install/run | ✓ | 11.13.0 | — |
| Browser localStorage | `kadi.profiles.v1` | ✓ [ASSUMED: judge devices allow storage] | — | In-memory store (session lost on reload; flag for human) |
| Browser sessionStorage | Guest mode | ✓ [ASSUMED: same as above] | — | Guest falls back to in-memory ephemeral state |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** browser storage denial → in-memory fallback (planner notes it; unlikely on judge devices)

## Validation Architecture

No `.planning/config.json` exists [VERIFIED: read attempt → not found], so treat Nyquist validation as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^5.0.3 |
| Config file | `app/vitest.config.ts` (node env, `tests/**/*.test.ts`, `@` alias) |
| Quick run command | `npx vitest run tests/seed.test.ts tests/profiles.test.ts` |
| Full suite command | `npx tsc --noEmit && npx vitest run` |

Baseline just run: **11 files / 101 tests green** [VERIFIED: `npx vitest run` this session].

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Picker lists demo + fresh; create profile enters app | unit (store) + manual (UI tap) | `npx vitest run tests/profiles.test.ts` | ❌ Wave 0 |
| PROF-02 | activeId persists; relaunch resumes; no expiry | unit (round-trip through localStorage mock) | `npx vitest run tests/profiles.test.ts` | ❌ Wave 0 |
| PROF-03 | Writes land in `profiles[activeId].state`; other profiles untouched | unit | `npx vitest run tests/profiles.test.ts` | ❌ Wave 0 |
| PROF-04 | Observations count real answers; no banned words | unit | `npx vitest run tests/observations.test.ts` + extend `copy.test.ts` | ❌ Wave 0 |
| PROF-05 | Due ≤3, weekly counts, commitment sets nextRecheck | unit (existing selectors) + new | `npx vitest run tests/seed.test.ts` | ❌ Wave 0 (partial cover via `recheck.test.ts` ✅ exists) |
| PROF-06 | Seed yields checked_immediate + retained + context_difficulty + one no_prereq_weakness; badge on demo screens | unit | `npx vitest run tests/seed.test.ts` | ❌ Wave 0 |

Manual-only (with justification): picker tap flow + badge visibility + 320px/390px no-clip — DOM rendering, no component-test harness installed; cover in WP7-style journey checklist instead.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit && npx vitest run tests/seed.test.ts tests/profiles.test.ts`
- **Per wave merge:** `npx tsc --noEmit && npx vitest run`
- **Phase gate:** Full suite green (≥101 + new tests) before verify.

### Wave 0 Gaps
- [ ] `tests/seed.test.ts` — asserts seed produces `checked_immediate`, `retained`, `context_difficulty`, one `no_prereq_weakness` session (WP3 verify block)
- [ ] `tests/profiles.test.ts` — store round-trip, corrupt→fresh, guest isolation (never reads/writes profiles key), activeId resume
- [ ] `tests/observations.test.ts` (or fold into seed test) — counts + banned-word scan on new strings
- [ ] Extend `tests/copy.test.ts` string sweep to cover new picker/observation copy

## Security Domain

No auth backend; device-local only (D-01, idea.md §15). No secrets in scope for this phase.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A — no passwords/accounts by design (D-01); picker is not auth, never present it as such |
| V3 Session Management | Partial | `activeId` is a local preference, not a session token; no expiry per D-02; guest isolation via sessionStorage + remount |
| V4 Access Control | No | Single-device trust model; client can edit its own localStorage (accepted, idea.md §11.3) |
| V5 Input Validation | Yes | `displayName`/`classLabel`/`targetExam` via zod (length caps e.g. ≤80 chars); render as text nodes only (stored-XSS) |
| V6 Cryptography | No | No tokens/secrets in this phase (HMAC receipts belong to grading, untouched) |

### Known Threat Patterns for localStorage-profile stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via `displayName` rendered on picker/Today/card | Tampering / Elevation | zod length caps + React text-node rendering (never `dangerouslySetInnerHTML`); treat name as untrusted on every render |
| Corrupt/tampered profile JSON crashes app or forges states | Tampering | zod `safeParse` + fresh-start fallback; forged states are self-harm only (accepted per idea.md §11.3) but must never throw |
| Guest/demo cross-contamination on shared phones | Information disclosure | Separate keys + storage areas + `key=` remount; test both directions |

## Sources

### Primary (HIGH confidence)
- `app/lib/store.ts`, `state.ts`, `engine.ts`, `checks.ts`, `probe.ts`, `types.ts`, `importer.ts`, `safety.ts` — read directly, patterns quoted above
- `app/tests/helpers.ts`, `tests/recheck.test.ts`, `tests/copy.test.ts` — read directly
- `app/content/graph.ts` (9 nodes, suspect-order prereqs, ENTRY_NODES) — read directly
- `app/components/App.tsx`, `Today.tsx` — read directly (guest remount, due≤3, weekly, simulate)
- `app/package.json`, `app/vitest.config.ts` — read directly (versions, no test script)
- Live `npx vitest run`: 11 files / 101 passed; `node --version` 24.16.0 / npm 11.13.0 — ran this session

### Secondary (MEDIUM confidence)
- `Finals/AGENTS.md`, `app/.clinerules/project.md` — project constraints (taken as authoritative repo docs)
- `idea.md` §§5.4/5.5/9/15, `EXECUTION.md` §4 WP3 — product constraints via CONTEXT-specified sections

### Tertiary (LOW confidence)
- Browser `crypto.randomUUID` + storage availability on judge devices [ASSUMED — flagged in Assumptions Log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package.json + runtime versions verified, no new packages
- Architecture: HIGH — all five patterns are verbatim reuses of read, tested code
- Pitfalls: HIGH — each maps to a concrete line/pattern in the codebase (key names, remount, badge, banned-word test)

**Research date:** 10 Oct 2026
**Valid until:** 30 days (stable domain; engine locked by idea.md §5)

## RESEARCH COMPLETE

**Phase:** 1 - Profile system
**Confidence:** HIGH

### Key Findings
- Zero new packages: store + reducer + selectors + zod + helpers cover the whole phase
- Seed-by-replay through `reduce()` is the only honest demo path; hand-written state is the top risk
- `load` event already exists in `state.ts` — EXECUTION.md WP1 fix #1 is stale, skip it
- Guest isolation = separate storage + `key=` remount; extend remount to `activeId`
- Demo badge must be one shared component, not per-screen copy

### File Created
`.planning/phases/01-profile-system/01-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Verified package.json + node/npm versions; nothing to install |
| Architecture | HIGH | Five patterns quoted from read, tested source files |
| Pitfalls | HIGH | Each tied to a specific codebase line/pattern |

### Open Questions
- Migrate vs discard `kadi.student.v1` (default: discard; see Open Questions)
- Strengths card placement (agent's discretion; recommend Today section)

### Ready for Planning
Research complete. Planner can now create PLAN.md files.
