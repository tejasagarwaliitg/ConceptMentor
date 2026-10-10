# Phase 02: youtube-redirection - Pattern Map

**Mapped:** 10 Oct 2026
**Files analyzed:** 14 (3 new, 11 modified)
**Analogs found:** 14 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/content/resources.ts` (NEW) | config (reviewed content) | static-bundled | `app/content/graph.ts` + `app/content/repair.ts` | exact |
| `app/lib/videos.ts` (NEW) | utility (pure ranker + URL builder) | transform | `app/content/graph.ts` (`dependentsOf`/`connectionSummary`, lines 151-195) | role-match |
| `app/tests/resources.test.ts` (NEW) | test | unit | `app/tests/copy.test.ts` + `app/tests/mentor-tools.test.ts` | exact |
| `app/lib/types.ts` (EDIT) | model | CRUD (settings shape) | self (`StudentSettings`, lines 90-92) | exact |
| `app/lib/state.ts` (EDIT) | store (defaults) | CRUD | self (`initialState`, lines 15-18) | exact |
| `app/lib/engine.ts` (EDIT) | reducer | event-driven | self (`load`/`setSettings`, lines 17-22) | exact |
| `app/lib/importer.ts` (EDIT) | utility (validation boundary) | transform | self (full file, 46 lines) | exact |
| `app/lib/profiles.ts` (EDIT) | store | CRUD | self (`loadStore` backfill, lines 96-97) | exact |
| `app/lib/store.ts` (EDIT) | hook (persistence) | CRUD | self (`loadGuest` + write-through, lines 9-22, 45-58) | exact |
| `app/lib/seed.ts` (EDIT) | config (demo seed) | batch | self (full file, 62 lines) | exact |
| `app/lib/copy.ts` (EDIT) | utility (copy centralization) | transform | self (`t()` + outcomes fn, lines 4, 23-31) | exact |
| `app/lib/mentor/run.ts` (EDIT) | service (agent job) | request-response | self (`suggestRepairOrder`, lines 168-170) | exact |
| `app/app/api/mentor/route.ts` (EDIT) | route | request-response | self (`Body` + dispatch, lines 12-21, 57-62) | exact |
| `app/components/Repair.tsx` (EDIT) | component | request-response | self (sections loop + lowData gate + NCERT link, lines 38, 115-152) | exact |
| `app/components/Outcome.tsx` (EDIT) | component | request-response | self (headline fn + action block, lines 22-29, 66-71) | exact |
| `app/components/Settings.tsx` (EDIT) | component | CRUD | self (`Choice` + lowData toggle, lines 24-37, 46) | exact |
| `app/components/App.tsx` (EDIT, minor) | component (wiring) | request-response | self (repair/outcome cases, lines 281-312) | exact |
| `app/components/SettingsScreen.tsx` (NO-CHANGE expected) | component (pass-through) | CRUD | self (`onChange` line 54) | exact |

Note: `SettingsScreen.tsx` needs no edit — `onChange={(s) => send({ type: "setSettings", settings: s })}` already forwards `Partial<StudentSettings>`. Planner should verify, not plan an edit.

## Pattern Assignments

### `app/content/resources.ts` (NEW — config, static-bundled)

**Analog:** `app/content/graph.ts` (lines 1-21, 115) + `app/content/repair.ts` (lines 1-8, 26-27)

**Imports pattern** (`graph.ts` lines 1-2; `repair.ts` lines 5-6):
```typescript
import type { NodeId } from "@/lib/types";
```
Content files import only the `NodeId` type plus sibling content (`repair.ts` line 6: `import { STUCK_CARDS_PART } from "./stuck";`). No zod, no runtime imports — validation lives in tests.

**Core pattern** (`graph.ts` lines 7-21 — interface + Record keyed by NodeId):
```typescript
export interface GraphNode {
  id: NodeId;
  name: string;
  level: 0 | 1 | 2 | 3;
  keystone: boolean;
  /** prerequisites in BUILDER-RECORDED suspect order (most suspect first) */
  prereqs: NodeId[];
  /** short plain-language description for the chapter picker */
  blurb: string;
  /** NCERT reference checked against the official 2026-27 PDFs on 2026-10-10. */
  ncert: string;
  ncertUrl: string;
}

export const GRAPH: Record<NodeId, GraphNode> = { ... };
export const LIVE_NODES = Object.keys(GRAPH) as NodeId[];
```
Copy: `export interface VideoResource {...}` + `export const VIDEO_RESOURCES: Record<NodeId, VideoResource[]>` + `export const CHANNELS = [...]` (15 entries). Header comment marks builder-review status like `repair.ts` lines 1-4 (`Student-facing explanation drafts. Every line still needs educator review...`) and the NCERT verification note (`graph.ts` line 16).

**Partial-coverage pattern** (`repair.ts` line 26):
```typescript
export const READ_INSTEAD: Partial<Record<NodeId, string[]>> = { ... };
```
Uncurated nodes = absent key or `[]` → NCERT read-instead, never blank. `VIDEO_RESOURCES` should be `Record<NodeId, VideoResource[]>` with seeds for `projectile`, `vec_comp`, `trig`, `vec_basics` only (D-03); or `Partial<Record<...>>` — planner picks one, ranker treats both as empty.

**URL pattern** (`graph.ts` lines 30, 50 — store full NCERT URLs as opaque strings):
```typescript
ncertUrl: "https://ncert.nic.in/textbook/pdf/keph103.pdf",
```
Contrast for videos: store IDs only, build URLs in `lib/videos.ts` so the host allowlist is enforced in one place (do NOT store full YouTube URLs in `resources.ts`).

---

### `app/lib/videos.ts` (NEW — utility, transform)

**Analog:** `app/content/graph.ts` pure helpers (lines 151-195)

**Core pattern** — pure functions, no imports, no throws:
```typescript
/** Edges: prerequisite -> dependent */
export function dependentsOf(id: NodeId): NodeId[] {
  return LIVE_NODES.filter((n) => GRAPH[n].prereqs.includes(id));
}

/** Always expose the planned/live split beside a displayed total. */
export function connectionSummary(id: NodeId): { live: number; comingNext: number; total: number } {
  const descendants = mapDescendantsOf(id);
  const live = descendants.filter((node) => LIVE_NODES.includes(node as NodeId)).length;
  return { live, comingNext: descendants.length - live, total: descendants.length };
}
```
Copy: `rankVideos(all, { tag, preferred, feedback })` — pure sort with stable catalog-order tie-break (`all.indexOf(a) - all.indexOf(b)`), `.slice(0, 2)`; `buildVideoUrl(id, startAt)` returning `https://www.youtube.com/watch?v=${id}&t=${startAt}s`. Ranker weights are ordering-only, never displayed (no effectiveness claims).

**No existing `VIDEO_ID_RE`/`ALLOWED_VIDEO_HOSTS` analog** — new constants in this file:
```typescript
export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
export const ALLOWED_VIDEO_HOSTS = ["www.youtube.com", "youtube.com", "youtu.be"] as const;
```
Host check via `new URL(built).hostname` exact-match (catches `youtube.com.evil.com` suffix tricks).

---

### `app/tests/resources.test.ts` (NEW — test, unit)

**Analog:** `app/tests/copy.test.ts` (lines 1-29) + `app/tests/mentor-tools.test.ts` (lines 17-28)

**Imports + walker pattern** (`copy.test.ts` lines 1-13):
```typescript
import { describe, expect, it } from "vitest";
import { t } from "@/lib/copy";
import { containsBanned } from "@/lib/mentor/schemas";
import { CONTRASTS, READ_INSTEAD } from "@/content/repair";
import { STUCK_CARDS_PART } from "@/content/stuck";
```
Copy: import `VIDEO_RESOURCES, CHANNELS, VideoResourceSchema` from `@/content/resources` (or wherever the schema lives) + `rankVideos, buildVideoUrl, ALLOWED_VIDEO_HOSTS` from `@/lib/videos`.

**Ban-sweep pattern** (`copy.test.ts` lines 25-29):
```typescript
it("reviewed content has no banned words", () => {
  for (const s of [...strings(CONTRASTS), ...strings(READ_INSTEAD), ...strings(STUCK_CARDS_PART)]) {
    expect(containsBanned(s), s).toBe(false);
  }
});
```
Copy: iterate every `VIDEO_RESOURCES` entry — `VideoResourceSchema.parse(v)`, `list.length <= 2`, `startAt < lengthSec`, `new URL(buildVideoUrl(...)).hostname ∈ ALLOWED_VIDEO_HOSTS`, title ban-check via `containsBanned`. Ranking tests use seeded fixtures (tag-match first, preferred next, feedback reorders, ties keep catalog order). Render-string assert: `Repair.tsx` source contains no `<iframe` and no `autoplay`.

**No-URL-tool guard** (`mentor-tools.test.ts` lines 17-21) must keep passing unchanged:
```typescript
it("there is no tool that grades, changes progress or returns a URL", () => {
  const names = [...lookups, proposeProbeOrder, chooseStuckCard, composeRepair].map((t) => t.name);
  expect(names.sort()).toEqual(["choose_stuck_card", "compose_repair", "get_node", "get_student_summary", "propose_probe_order"]);
  for (const n of names) expect(n).not.toMatch(/grade|update|mastery|state|url|link|set_/);
});
```

**Validation commands:** per-task `npx vitest run tests/resources.test.ts tests/copy.test.ts tests/mentor-tools.test.ts`; per-wave `npx tsc --noEmit && npx vitest run` (from `Finals/app/`).

---

### `app/lib/types.ts` (EDIT — model, CRUD)

**Analog:** self, lines 90-92:
```typescript
export interface StudentSettings {
  lowData: boolean;
}
```
Extend to:
```typescript
export interface StudentSettings {
  lowData: boolean;
  preferredChannels: string[];            // 1–7 channel ids, validated
  videoFeedback: Record<string, 1 | 2 | 3>; // videoId -> yes/thoda/nahi, reorder-only
}
```
Zod schemas (`PreferredChannelsSchema = z.array(z.string().min(1)).min(1).max(7)`) live with the content schema or in `videos.ts`, mirroring `mentor/schemas.ts` patterns (`z.enum`, array `.max(4)` — see `schemas.ts` lines 18, 32). Keep `NodeId` union (lines 1-10) untouched; `VIDEO_RESOURCES` keys off it.

---

### `app/lib/state.ts` + `app/lib/engine.ts` + `app/lib/importer.ts` (EDIT — defaults, reducer, boundary)

**Defaults pattern** (`state.ts` lines 15-18):
```typescript
export function initialState(): StudentState {
  const settings: StudentSettings = { lowData: false };
  return { version: 1, settings, nodes: {}, seenInstances: [], recentItems: {}, weekly: {}, simulatedDays: 0, flaggedItems: [], activity: [] };
}
```
Add `preferredChannels: []` (or demo-seeded? no — seed applies to the demo profile in `seed.ts`, not the default) + `videoFeedback: {}`.

**Reducer merge pattern** (`engine.ts` lines 21-22) — `setSettings` already shallow-merges, no change needed:
```typescript
case "setSettings":
  return { ...state, settings: { ...state.settings, ...ev.settings } };
```

**BUT `load` case (line 20) rebuilds settings from scratch — MUST extend:**
```typescript
case "load":
  return ev.state && ev.state.version === 1 ? { ...ev.state, settings: { lowData: ev.state.settings.lowData }, recentItems: ev.state.recentItems ?? {}, session: undefined } : state;
```
→ add `preferredChannels` + `videoFeedback` with `??` fallbacks so old exports/imports don't crash (Pitfall 4). Same for `importer.ts` line 19:
```typescript
settings: z.object({ lowData: z.boolean() }),
```
→ add `preferredChannels: z.array(z.string()).min(1).max(7).optional()` + `videoFeedback: z.record(...).optional()`, backfilled with `??` in `parseImport` return (line 45). Optional keeps old exports importable; required rejects them.

---

### `app/lib/profiles.ts` + `app/lib/store.ts` (EDIT — backfill + guest isolation)

**Backfill pattern** (`profiles.ts` lines 94-98):
```typescript
for (const [k, v] of Object.entries(j.profiles)) {
  if (validProfile(v) && v.id === k) {
    v.state.activity ??= [];
    profiles[k] = v;
  }
}
```
Copy: `v.state.settings.preferredChannels ??= []; v.state.settings.videoFeedback ??= {};` in the same loop. `validState` (lines 63-74) stays lenient (`typeof st.settings === "object"`) — do NOT tighten it.

**Guest isolation pattern** (`store.ts` lines 9-22, 45-58): guest loads from `sessionStorage` key `kadi.student.v1` (`loadGuest`), profiles from `localStorage` `kadi.profiles.v1`; write-through splits on `guest` flag. Guest channel picks / Samajh-aaya go to `sessionStorage` only — never write guest state into the profile store. Add `activity ?? []` style backfill for new settings fields in `loadGuest` return and the `useProfile` profile branch (line 41: `{ ...p.state, activity: p.state.activity ?? [] }`).

---

### `app/lib/seed.ts` (EDIT — demo seed)

**Analog:** self, lines 58-62:
```typescript
export function buildDemoState(): StudentState {
  let s = initialState();
  for (const ev of DEMO_SEED_EVENTS) s = reduce(s, ev);
  return s;
}
```
After replay, set `s.settings.preferredChannels = [<2 builder-chosen channel ids>]` (D-06). Keep `DEMO_SEED_EVENTS` untouched (end states: `vec_comp` context_difficulty, `kin_1d` gap — tests in `profiles.test.ts` lines 57-60 assert these). Do NOT seed `videoFeedback` (default = catalog order).

---

### `app/lib/copy.ts` (EDIT — copy centralization)

**Analog:** self, lines 4, 23-31, 37-38:
```typescript
export function t(_legacyPreference?: string) {
  void _legacyPreference;
  return {
    ...
    outcomes: {
      suspected_gap: (name: string, live: number, planned: number) =>
        `Possible contributing gap: ${name}. It connects to ${live} other concepts in this map and ${planned} planned concepts.`,
      ...
    } as Record<SessionOutcome, string | ((name: string, live: number, planned: number) => string)>,
    ...
    watch: "Watch a video",
```
All new strings (nudge line, trace row `ranked 2 from N curated — tag-match + preferred channel`, Samajh-aaya `yes / thoda / nahi` labels, channel section heading, `~X MB` size format) go through `t()` so `copy.test.ts` ban sweeps (lines 16-23, iterating `strings(t(reg))` for all registers) cover them automatically. Nudge wording reuses the `suspected_gap` template shape: name + `connectedLaterCount` total + one start-here action. Never `weak/fail/dumb/bekaar/trick-user/root cause/unblocks/mastered/rank/leaderboard/streak` (line 20 regex).

---

### `app/lib/mentor/run.ts` + `app/app/api/mentor/route.ts` (EDIT — `hasVideo` plumbing)

**Job pattern** (`run.ts` lines 168-170):
```typescript
export function suggestRepairOrder(ctx: MentorContext, nodeId: string, lowData: boolean) {
  const prompt = `Order the repair options for topic ${nodeId}. Low data mode: ${lowData}. If low data is true, do not include video. Call compose_repair.`;
  return runJob<RepairOrder>("repair_order", ctx, composeRepair, prompt, validateRepairOrder);
}
```
Add 4th param `hasVideo: boolean`; prompt gains `Curated videos available: ${hasVideo}. If low data is true or no curated videos exist, do not include video (order read above video).` `compose_repair` tool (`tools.ts` lines 88-97) and `validateRepairOrder` (`schemas.ts` lines 65-72, `check` mandatory) are UNTOUCHED.

**Route pattern** (`route.ts` lines 12-21, 57-62):
```typescript
const Body = z.object({
  accessCode: z.string().max(80),
  adultConfirmed: z.literal(true),
  job: z.enum(["probe_order", "stuck_card", "repair_order"]),
  node: NodeEnum,
  attempt: z.string().max(LIMITS.attempt).nullable().optional(),
  lowData: z.boolean().optional(),
  ...
});
...
  const result =
    b.job === "probe_order"
      ? await suggestProbeOrder(ctx, b.node, attempt)
      : b.job === "stuck_card"
        ? await suggestStuckCard(ctx, b.node, attempt)
        : await suggestRepairOrder(ctx, b.node, Boolean(b.lowData));
```
Add `hasVideo: z.boolean().optional()` to `Body`; pass `Boolean(b.hasVideo)` through. Deterministic fallback when agent off: `hasVideo && !lowData ? ["contrast","check","read","video"] : ["contrast","check","read"]` — computed in code from the same boolean in both paths (Pitfall 6).

---

### `app/components/Repair.tsx` (EDIT — ranked links + Samajh-aaya)

**Analog:** self, lines 38, 132-152.

**Sections default pattern** (line 38):
```typescript
const sections = order ?? ["contrast", "check", "read", "video"];
```

**Review-body + link + lowData-gate pattern** (lines 132-152):
```tsx
<details className="review-panel">
  <summary>{c.moreOptions}</summary>
  <div className="review-body">
    {read && (
      <div>
        <b>{c.readInstead}</b>
        <ul>
          {read.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    )}
    <a className="ncert-link" href={GRAPH[node].ncertUrl} target="_blank" rel="noopener noreferrer">
      <BookOpen size={17}/><span>Read the NCERT reference<small>{GRAPH[node].ncert}</small></span><ArrowRight size={14}/>
    </a>
    {!settings.lowData && sections.includes("video") && (
      <p><CircleSlash size={13}/> Video links are still being reviewed. Nothing plays automatically.</p>
    )}
  </div>
</details>
```
Replace the placeholder `<p>` (lines 148-150) with the ranked list: `{!settings.lowData && sections.includes("video") && hasVideos && (<div><b>{c.watch}</b><ul>{ranked.map((v) => (<li key={v.id}><a href={buildVideoUrl(v.id, v.startAt)} target="_blank" rel="noopener noreferrer">{v.title} · {Math.floor(v.lengthSec/60)} min · ~{v.sizeMB} MB · ...</a>{/* Samajh-aaya yes/thoda/nahi micro-buttons → onFeedback(v.id) */}</li>))}</ul></div>)}`. Empty ranked list → render nothing extra (NCERT block above is the fallback, never blank). `<a target="_blank" rel="noopener noreferrer">` exactly (tab-nabbing). No `<iframe`, no `autoplay`, no embed URLs. Icons from installed `lucide-react` (`BookOpen`, `CircleSlash` already imported line 3); verify any new icon name (`Youtube`, `Play`) at build.

**Props to add:** `ranked: VideoResource[]` (or compute in-card from `node` + settings — planner decides), `onFeedback: (videoId: string, value: 1|2|3) => void`. `App.tsx` repair case (lines 298-312) currently passes `order={null}` — wire ranked data + feedback dispatch (`setSettings` with updated `videoFeedback`) there.

---

### `app/components/Outcome.tsx` (EDIT — nudge line)

**Analog:** self, lines 22-29 (headline fn) + 60-71 (conditional note + action block):
```tsx
const headline = (() => {
  const o = c.outcomes[outcome];
  if (outcome === "suspected_gap" && suspected && typeof o === "function") {
    const counts = connectionSummary(suspected);
    return o(GRAPH[suspected].name, counts.live, counts.comingNext);
  }
  return typeof o === "string" ? o : "";
})();
...
{notChecked.length > 0 && outcome === "suspected_gap" && (
  <p className="note-panel">
    Not checked in this session: {notChecked.map((n) => GRAPH[n].name).join(", ")}. These concepts remain unresolved.
  </p>
)}

<div className="learning-actions">
  {(outcome === "suspected_gap" || outcome === "below_coverage") && suspected && (
    <button onClick={() => onRepair(suspected)} className="button primary">
      Review this concept <ArrowRight size={16}/>
    </button>
  )}
```
Nudge = one `<p className="note-panel">` under the headline (above `.learning-actions`), gated on `(outcome === "suspected_gap" || outcome === "below_coverage") && suspected` — same gate as the existing repair button. Content: `Possible contributing gap: ${GRAPH[suspected].name} — connected to ${connectedLaterCount(suspected)} later topics. Start here: review ...` + inline button `onClick={() => onRepair(suspected)}`. Reuse `connectionSummary`/`connectedLaterCount` import from `@/content/graph` (line 3). Dispute button (lines 82-86) stays untouched. Map/Today unchanged.

---

### `app/components/Settings.tsx` (EDIT — channel multi-pick)

**Analog:** self, lines 24-37 (`Choice`) + line 46 (lowData toggle):
```tsx
function Choice<T extends string>({ label, value, options, onPick }: { label: string; value: T; options: [T, string][]; onPick: (v: T) => void }) {
  return (
    <section className="settings-section">
      <h3>{label}</h3>
      <div className="choice-group">
        {options.map(([v, text]) => (
          <button key={v} aria-pressed={value === v} onClick={() => onPick(v)} className="choice-button">
            {text}
          </button>
        ))}
      </div>
    </section>
  );
}
...
<Choice label="Data use" value={settings.lowData ? "on" : "off"} options={[["off", "Standard"], ["on", "Low data: text only"]]} onPick={(v) => onChange({ lowData: v === "on" })} />
```
New section after the Data-use `Choice`: `<section className="settings-section"><h3>Preferred teachers (pick 1–7)</h3><div className="choice-group">{CHANNELS.map((ch) => (<button key={ch.id} aria-pressed={preferred.includes(ch.id)} onClick={() => toggleChannel(ch.id)} className="choice-button">{ch.name}</button>))}</div></section>`. Toggle clamp: ignore picks beyond 7, ignore deselect below 1 (reducer-never-throws ethos — no error thrown, just no-op). `onChange({ preferredChannels: next })` flows through the existing `Partial<StudentSettings>` prop (line 17) → `SettingsScreen` line 54 → `setSettings` merge — no plumbing changes.

---

## Shared Patterns

### Settings extension (lowData pattern)
**Source:** `app/lib/types.ts:90-92`, `app/components/Settings.tsx:46`, `app/lib/engine.ts:21-22`, `app/components/SettingsScreen.tsx:54`
**Apply to:** `preferredChannels` + `videoFeedback` (types → defaults → toggle UI → `setSettings` merge; all already generic over `Partial<StudentSettings>`)
```typescript
// types.ts:90-92 — shape
export interface StudentSettings {
  lowData: boolean;
}
// Settings.tsx:46 — toggle wiring
<Choice label="Data use" value={settings.lowData ? "on" : "off"} options={[["off", "Standard"], ["on", "Low data: text only"]]} onPick={(v) => onChange({ lowData: v === "on" })} />
// engine.ts:21-22 — merge (no change needed)
case "setSettings":
  return { ...state, settings: { ...state.settings, ...ev.settings } };
// SettingsScreen.tsx:54 — pass-through (no change needed)
onChange={(s) => send({ type: "setSettings", settings: s })}
```

### Store backfill (never-throw migration)
**Source:** `app/lib/profiles.ts:96-97`, `app/lib/store.ts:15,41`
**Apply to:** every reader of stored state after adding settings fields
```typescript
// profiles.ts:96-97 — backfill in load loop
v.state.activity ??= [];
// store.ts:15 — guest load backfill
return { ...parsed, activity: parsed.activity ?? [] };
// store.ts:41 — profile load backfill
setState(p ? { ...p.state, activity: p.state.activity ?? [] } : initialState());
```
Add `preferredChannels ??= []` / `videoFeedback ??= {}` at each of these three sites + `engine.ts:20` `load` case + `importer.ts:45` return.

### External link block
**Source:** `app/components/Repair.tsx:145-147`, `app/components/App.tsx:260`
**Apply to:** every video link in Repair card
```tsx
<a className="ncert-link" href={GRAPH[node].ncertUrl} target="_blank" rel="noopener noreferrer">
  <BookOpen size={17}/><span>Read the NCERT reference<small>{GRAPH[node].ncert}</small></span><ArrowRight size={14}/>
</a>
```

### Validated-suggestion agent job (sections only, no URLs)
**Source:** `app/lib/mentor/tools.ts:88-97`, `app/lib/mentor/schemas.ts:65-72`, `app/lib/mentor/run.ts:168-170`, `app/app/api/mentor/route.ts:57-62`
**Apply to:** `hasVideo` plumbing; `compose_repair` surface unchanged
```typescript
// tools.ts:88-97 — completion tool (UNCHANGED)
export const composeRepair = createTool({
  name: "compose_repair",
  description:
    "FINISH the job: order the repair options for this student from contrast, check, read, video. 'check' must be included. Suggestion only; code validates it.",
  inputSchema: RepairOrderSchema,
  lifecycle: { completesRun: true },
  async execute(input) {
    return input;
  },
});
// schemas.ts:65-72 — check mandatory (UNCHANGED)
export function validateRepairOrder(raw: unknown): RepairOrder | null {
  const p = RepairOrderSchema.safeParse(raw);
  if (!p.success) return null;
  const set = new Set(p.data.order);
  if (set.size !== p.data.order.length) return null; // no duplicates
  if (!set.has("check")) return null; // the immediate check can never be dropped
  return p.data;
}
```

### Copy centralization + ban enforcement
**Source:** `app/lib/copy.ts:4-5`, `app/lib/mentor/schemas.ts:74-78`, `app/tests/copy.test.ts:16-23`
**Apply to:** ALL new user-facing strings (nudge, trace row, Samajh-aaya, channel heading)
```typescript
// copy.ts:4 — every string inside t()
export function t(_legacyPreference?: string) {
// schemas.ts:75-76 — ban list
export const BANNED = ["weak", "fail", "failed", "dumb", "stupid", "bekaar", "trick-user", "loser"];
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | None. Every file maps to an in-tree analog. `rankVideos` scoring weights are planner's discretion (RESEARCH.md A4); `VIDEO_ID_RE`/host-check has no in-tree precedent — use the RESEARCH.md snippet as-is. |

## Metadata

**Analog search scope:** `Finals/app/content/`, `lib/`, `lib/mentor/`, `components/`, `app/api/mentor/`, `tests/` (targeted reads; stopped at full coverage of the 14-file scope)
**Files scanned:** 18 (14 in-scope + `graph-roadmap`/`stuck`/`qbank` excluded by role mismatch)
**Pattern extraction date:** 10 Oct 2026
