# Phase 02: youtube-redirection - Research

**Researched:** 10 Oct 2026
**Domain:** Curated video redirection (static allowlist + deterministic ranking + per-profile preferences), Next.js App Router + zod
**Confidence:** MEDIUM

## Summary

Phase 2 adds a builder-curated video layer on top of the existing repair flow: a new `content/resources.ts` allowlist keyed by `NodeId` (max 2 entries per node, full metadata per D-02), a deterministic code ranker (weakness-tag match → preferred channel → catalog order), a 1–7 preferred-channel picker in Settings stored per-profile, a one-line weak-topic nudge on the Outcome screen, and a `hasVideo` availability flag plumbed through `suggestRepairOrder` so the agent orders *sections* while code orders *videos*.

The codebase already contains every pattern this phase needs: `content/graph.ts` (reviewed-content keyed by `NodeId`, NCERT URL block), `content/repair.ts` (reviewed text), `Repair.tsx` (`order ?? ["contrast","check","read","video"]` render loop + lowData gate + `target="_blank" rel="noopener noreferrer"` link block), `StudentSettings { lowData }` + `Choice` in Settings, `validateRepairOrder` (`check` mandatory) in schemas, and the `suggestRepairOrder(ctx, nodeId, lowData)` agent job with deterministic fallback. No new packages are required — zod 4.6.5 is installed and verified, and every validation need (video-ID format, allowlisted resource IDs, 1–7 channel picks, built-URL host check) maps to an already-used zod API.

**Primary recommendation:** Build `content/resources.ts` + a pure `rankVideos()` in `lib/` with zero new dependencies; extend `StudentSettings` with `preferredChannels` + `videoFeedback`; link out to `https://www.youtube.com/watch?v=<ID>&t=<s>` (never embed, never autoplay); keep the agent on section-ordering only.

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Video catalog + ordering
- **D-01:** New `app/content/resources.ts` keyed by `NodeId`, max 2 entries per node. Reviewed content file in the `graph.ts`/`repair.ts` pattern; builder-curated entries only, nothing unreviewed served.
- **D-02:** Full spec metadata per entry: allowlisted video ID, title, builder-verified start time, length, approx data size. URLs are built from the ID only with `youtube.com`/`youtu.be` host validation at build time (idea.md §8). No autoplay.
- **D-03:** Seed demo-path nodes first (`projectile`, `vec_comp`, `trig`, `vec_basics`). Uncurated nodes degrade to NCERT read-instead, never blank, never a dead end.
- **D-04:** Slot order: weakness-tag match first, preferred channels first; second slot is best remaining preferred, else catalog default. Ties keep catalog order. Reorder only — never an effectiveness claim.

#### Preferred teacher setting
- **D-05:** Curated list of 15 YouTube channels in Settings; student picks 1–7 preferred. In-app YouTube account search/picker is a future prospect, not this phase (conflicts with idea.md §8 + §17 DEFERRED and the 20:00 freeze).
- **D-06:** Preference stored per-profile in device-local settings (extends the `lowData` pattern); demo seed picks 2 channels; guest choice is session-only.
- **D-07:** Fill rule: weakness-matched video from a preferred channel first; second slot best remaining preferred, else catalog default.

#### Weak-topic nudge
- **D-08:** Nudge lives on the Outcome screen: one next-action line under the suspected-gap verdict. Map and Today stay unchanged.
- **D-09:** Trigger is gap verdicts only (`gap` / `context_difficulty` nodes). A single changed-context slip without a gap stays a plain repair flow — no lecture.
- **D-10:** Honest wording inside the bans: names the suspected contributing gap, its connected-later-topics count, one "start here" action. The "doesn't explain my mistake" dispute button stays.
- **D-11:** Nudge deep-links the weak node's repair card (contrast → check → read → video). No duplicated video lists on the outcome screen.

#### Agent vs code ordering
- **D-12:** Deterministic code ranks the videos (tag → teacher → preference). The mentor agent keeps ordering only the repair *sections* via `compose_repair` (validated, `check` mandatory). Product works with the agent disabled.
- **D-13:** Availability-aware section ordering: the repair-order prompt carries a `hasVideo` flag; uncurated nodes order read above video.
- **D-14:** One honest deterministic trace row for video ranking in the decision panel (ranked N from M curated: tag-match + preferred channel). No fabricated agent activity.
- **D-15:** "Samajh aaya?" (yes/thoda/nahi) after a video is stored per-profile and reorders that student's future video order only. No effectiveness claims, no teacher warnings (idea.md §8).

#### Carried forward (Phase 1 + locked spec, not re-asked)
- Device-local only: no accounts, no database, no analytics (idea.md §15). Engine/reducer untouched; only graded server events change states.
- Wording bans enforced: never `weak/fail/dumb/bekaar/trick-user/root cause/unblocks/mastered`.
- Repair order stays contrast → immediate check → read-instead (NCERT first) → video; low-data toggle hides videos.

### the agent's Discretion
- Exact `resources.ts` entry shape beyond D-02 fields, channel list of 15 names, nudge copy wording, trace-row text, `hasVideo` plumbing detail.

### Deferred Ideas (OUT OF SCOPE)
- In-app YouTube account search/picker (builder's future prospect) — needs API access, quota, review pipeline; belongs in its own phase.
- YouTube Data API, video verification/transcripts, free-text favourite channels (idea.md §17 DEFERRED).
- Teacher-effectiveness claims from local counts (idea.md REJECTED — never build).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| YT-01 | Repair video section shows max 2 curated videos per node with verified start time, length + size, no autoplay | `resources.ts` entry shape + zod schema; `buildVideoUrl` from ID only; link-out pattern (no iframe) |
| YT-02 | Priority order honours preferred teacher first, then student's own "Samajh aaya?" preference; reorder only | `rankVideos()` pure function spec (tag → channel → feedback → catalog order); `preferredChannels` + `videoFeedback` settings shape |
| YT-03 | Model never emits URLs — agent/tools pick allowlist resource IDs only; UI renders links from reviewed file with host validation | `compose_repair` unchanged (sections only); `VIDEO_ID_RE` + `ALLOWED_VIDEO_HOSTS` + build-time test asserting every built URL's host |
| YT-04 | Weak-topic traversal nudge on gap/context_difficulty: one next action, honest wording | Outcome-screen placement (D-08); `connectedLaterCount()` reuse; copy pattern passing `copy.test.ts` bans |
| YT-05 | Low-data toggle hides videos; missing curation degrades to NCERT read-instead | Existing `settings.lowData` gate in `Repair.tsx:148`; `hasVideo` flag for agent section ordering; `READ_INSTEAD` fallback |

## Project Constraints (from AGENTS.md)

- Shippable code is `Finals/app/` only (Next.js 16 + React 19 + TS + Tailwind 4 + zod + KaTeX + `@cline/sdk`); `idea.md` is locked, do not edit.
- Verify with `npx tsc --noEmit && npx vitest run` from `Finals/app/` (no `npm test` script; tests in `tests/` via `vitest.config.ts`).
- Public app works with no env; AI mentor OFF unless `ACCESS_CODE` + `CLINE_API_KEY` + `MENTOR_MODEL` all set. Requires Node 22+ (machine has Node 24).
- Engine is a pure reducer — this phase MUST NOT touch `lib/probe.ts`, `lib/engine.ts`, `lib/checks.ts`, `lib/state.ts` transitions; only graded server events change node states; reducer never throws.
- Mentor agent: new stateless `Agent` per request; input structured only; output validated suggestion; **no tool may grade, set state, or produce URLs**; any failure → deterministic fallback; product works with agent disabled.
- Content: items need `approved: true` + `approvedBy`; `content/graph.ts` is the 9-node source of truth.
- Wording bans (tested): never `weak/fail/dumb/bekaar/trick-user/root cause/unblocks/mastered`; use `suspected contributing gap`, `connected to N later topics`, `Immediate check passed; retention untested`.
- `lib/safety.ts` distress gate runs before any free-text processing; zod at every boundary.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Curated video catalog storage | CDN / Static (bundled content file) | — | Same as `graph.ts`/`repair.ts`: reviewed data ships with the bundle, no server, no fetch |
| Video ranking (tag → channel → feedback) | Browser / Client (pure function) | — | Deterministic, per-student inputs only; must work with agent disabled |
| Preferred-channel + Samajh-aaya storage | Browser / Client (localStorage per-profile, sessionStorage guest) | — | Device-local only per idea.md §15; extends `StudentSettings` |
| Video link rendering | Browser / Client (Repair card) | — | Links built from IDs at render; lowData gate already client-side |
| Repair *section* ordering | API / Backend (`/api/mentor` repair job) | Browser fallback | Agent suggests, code validates (`check` mandatory); `hasVideo` is a prompt input |
| Weak-topic nudge | Browser / Client (Outcome screen) | — | Pure view of existing session state; no new data flow |
| URL/host validation | Build time (test) + Browser (zod boundary) | — | Allowlist is static; validation is code, not a service |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | 4.6.5 (installed, verified in `node_modules`) [VERIFIED: codebase] | Video-ID regex, resource entry schema, `preferredChannels` 1–7 array, built-URL host check | Already the boundary-validation standard (`schemas.ts`, `route.ts`); v4 APIs needed (`z.enum`, `.min/.max`, `.regex`, `z.url({hostname})`) confirmed in official docs [CITED: https://zod.dev/api] |
| `next` | 16.4.0 | External link rendering (`<a target="_blank" rel="noopener noreferrer">`) | Existing pattern in `Repair.tsx:145`, `App.tsx:260` — copy it, no new API to learn [VERIFIED: codebase] |
| `react` | 19.3.0 | Channel multi-pick UI, Samajh-aaya feedback buttons, nudge line | Existing `Choice` + `useState` patterns in `Settings.tsx` [VERIFIED: codebase] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | installed (^1.55.0) | Video/play/settings icons in repair card + Settings | Reuse existing icon set; verify exact icon name (`Youtube`, `Play`, `CircleSlash`) at build time [ASSUMED] |
| `vitest` | 5.0.3 | Ranking, schema, fallback, copy-ban tests | Existing `tests/` suite; see Validation Architecture |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Link-out `<a>` | `react-player` / iframe embed | REJECT: embed weight + autoplay/data risk; privacy-enhanced (`youtube-nocookie.com`) still writes Local Storage pre-consent [CITED: https://support.google.com/youtube/answer/171780]; link-out sidesteps all of it |
| Static `resources.ts` | YouTube Data API search/verify | REJECT: idea.md §17 DEFERRED; needs key, quota, review pipeline; conflicts with 20:00 freeze |
| Code ranker | New `get_resources` agent tool picking IDs | REJECT per D-12: more agentic surface, more validation burden; code ranking works agent-disabled |

**Installation:**
```bash
# No new packages. Nothing to install.
```

**Version verification:** `zod` 4.6.5 confirmed via `node -p "require('./node_modules/zod/package.json').version"` in `Finals/app/` [VERIFIED: codebase]. `next` 16.4.0 / `react` 19.3.0 per `package.json`. No registry lookup needed — zero installs.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none — phase installs zero packages)* | — | — | — | — | — | N/A |

**Packages removed due to [SLOP] verdict:** none (no packages proposed).
**Packages flagged as suspicious [SUS]:** none.

*The Package Legitimacy Gate has nothing to check: this phase adds only first-party files (`content/resources.ts`, `lib/videos.ts` or equivalent, edits to existing components) using the already-installed `zod`/`next`/`react`. Planner MUST NOT add any install step; if a plan proposes a new dependency (e.g. `react-player`), it must go through the full gate first.*

## Architecture Patterns

### System Architecture Diagram

```
Builder (curating, at build time)
  │  verifies ID + start time + length, picks channel from list of 15
  ▼
content/resources.ts  ──(zod schema test)──►  build-time host assertion
  │ keyed by NodeId, max 2/node                              (every built URL host ∈ {youtube.com, youtu.be})
  ▼
Repair card ──► rankVideos(node, tag, prefs) ──► max 2 links
  │              (pure, deterministic)              │  built from ID only:
  │              tag-match → preferred              │  watch?v=<ID>&t=<s>
  │              channel → feedback →               │  target _blank, rel noopener, no autoplay
  │              catalog order                      ▼
  │                                           student ──► "Samajh aaya?" ──► per-profile feedback
  │                                                                              (reorders future ranks only)
Settings ──► preferredChannels[1..7] (per-profile localStorage; guest session-only)
  │
  └─► lowData=true ──► video section hidden entirely (existing gate)

Outcome screen ──► gap/context_difficulty? ──► one nudge line
                                              (suspected gap + connected-later count + deep link
                                               to weak node's repair card; no video list duplicated)

/api/mentor repair_order ──► prompt carries hasVideo flag ──► agent orders SECTIONS only
  │ (compose_repair, check mandatory, validated)          (uncurated nodes: read above video)
  ▼
Under-the-hood trace ──► + one deterministic row: "ranked 2 from N curated — tag-match + preferred channel"
```

A reader traces the primary use case: difficulty on `vec_comp` → Repair card calls `rankVideos` → 2 ordered links → "Samajh aaya?" stored → next visit reorders.

### Recommended Project Structure

```
content/
├── graph.ts          # UNTOUCHED — 9-node source of truth
├── repair.ts         # UNTOUCHED — contrasts / read-instead pattern to copy
└── resources.ts      # NEW — VIDEO_RESOURCES: Record<NodeId, VideoResource[]>, CHANNELS: 15
lib/
├── videos.ts         # NEW — rankVideos(), buildVideoUrl(), VIDEO_ID_RE, ALLOWED_VIDEO_HOSTS
├── types.ts          # EDIT — StudentSettings += preferredChannels, videoFeedback
├── state.ts          # EDIT — initialState defaults only (no transition changes)
└── mentor/run.ts     # EDIT — suggestRepairOrder(ctx, node, lowData, hasVideo)
components/
├── Repair.tsx        # EDIT — video section renders ranked links + Samajh-aaya
├── Outcome.tsx       # EDIT — one nudge line, gap verdicts only, deep link
├── Settings.tsx      # EDIT — 15-channel multi-pick (1–7)
└── SettingsScreen.tsx# EDIT — pass-through only
tests/
└── resources.test.ts # NEW — schema, max-2, host allowlist, ranking order, fallbacks
```

### Pattern 1: Reviewed-content allowlist (copy `graph.ts`/`repair.ts`)
**What:** Static `content/` file, zod-validated at build/test time, keyed by `NodeId`. Nothing unreviewed is served; uncurated nodes fall back to NCERT.
**When to use:** All video/channel data in this phase.
**Example:**
```typescript
// Source pattern: app/content/graph.ts + app/content/repair.ts
import { z } from "zod";

export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/; // [CITED: https://regexguide.com/patterns/youtube-video-id.html]
export const ALLOWED_VIDEO_HOSTS = ["www.youtube.com", "youtube.com", "youtu.be"] as const;

export const VideoResourceSchema = z.object({
  id: z.string().regex(VIDEO_ID_RE),          // allowlisted YouTube ID, never a full URL
  title: z.string().min(4).max(120),
  channelId: z.string().min(1),               // key into CHANNELS below
  startAt: z.number().int().min(0),           // builder-verified start time, seconds
  lengthSec: z.number().int().positive(),     // duration
  sizeMB: z.number().positive(),               // approx data size shown to student [ASSUMED: builder-estimated]
  tags: z.array(z.string()).default([]),      // weakness-tag match keys (contrast/distractor tags)
});
export type VideoResource = z.infer<typeof VideoResourceSchema>;

export const VIDEO_RESOURCES: Record<NodeId, VideoResource[]> = {
  projectile: [ /* max 2, builder-curated */ ],
  vec_comp: [ /* ... */ ],
  // ... uncurated nodes: absent key or [] → NCERT read-instead, never blank
};
```

### Pattern 2: Deterministic ranker, agent orders sections only
**What:** Pure `rankVideos()` in code; `compose_repair` keeps ordering `["contrast","check","read","video"]` only. `hasVideo` (curated videos exist AND `!lowData`) goes into the repair prompt so uncurated nodes order `read` above `video`.
**When to use:** Always — D-12/D-13 are locked.
**Example:**
```typescript
// Source pattern: app/lib/mentor/schemas.ts validateRepairOrder (check mandatory)
interface RankInput { tag: string | null; preferred: string[]; feedback: Record<string, 1 | 2 | 3>; }
export function rankVideos(all: VideoResource[], in_: RankInput): VideoResource[] {
  const score = (v: VideoResource) =>
    (in_.tag && v.tags.includes(in_.tag) ? 4 : 0) +
    (in_.preferred.includes(v.channelId) ? 2 : 0) +
    (in_.feedback[v.id] === 1 ? 1 : in_.feedback[v.id] === 3 ? -1 : 0); // Samajh-aaya: reorder only [ASSUMED mapping]
  return [...all].sort((a, b) => score(b) - score(a) || all.indexOf(a) - all.indexOf(b)).slice(0, 2);
  // ties keep catalog order (stable); never an effectiveness claim
}
export function buildVideoUrl(id: string, startAt: number): string {
  if (!VIDEO_ID_RE.test(id)) throw new Error("unallowlisted video id");
  return `https://www.youtube.com/watch?v=${id}&t=${startAt}s`; // link out; no embed, no autoplay
}
```

### Pattern 3: Per-profile settings extension (copy `lowData`)
**What:** `StudentSettings += preferredChannels: string[]` (1–7, validated) + `videoFeedback: Record<videoId, 1|2|3>`; guest choice session-only via the existing guest-state path (`useProfile(activeId, guest)` + `sessionStorage`).
**When to use:** D-05/D-06/D-15 implementation.
**Example:**
```typescript
// Source pattern: app/lib/types.ts StudentSettings + app/components/Settings.tsx Choice
export const PreferredChannelsSchema = z.array(z.string().min(1)).min(1).max(7); // [CITED: https://zod.dev/api] (.min/.max on arrays)
```

### Anti-Patterns to Avoid
- **Embedding iframes:** heavier, autoplay-adjacent, and `youtube-nocookie.com` still writes `yt-remote-device-id` to Local Storage pre-consent [CITED: https://www.flowconsent.com/en/blog/youtube-nocookie-embed-videos-without-cookies-gdpr]. Link out instead.
- **Model-emitted URLs or IDs:** `compose_repair` output stays section enums; IDs come only from `resources.ts`. The `mentor-tools.test.ts` "no URL tool" test must keep passing.
- **Effectiveness claims / teacher warnings:** `rankVideos` scores are ordering weights, never shown as quality judgments; Samajh-aaya reorders one student's list only (idea.md §8 REJECTED).
- **Storing full URLs in content:** store IDs; build URLs in code so the host allowlist is enforced in one place.
- **Touching engine transitions:** `initialState` defaults may gain fields; no new events that change node states except the existing `setSettings`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video-ID validation | Custom splitter over pasted URLs | `VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/` + allowlist lookup (format check is secondary; curation is the truth) | Format alone never proves a video is real or reviewed [CITED: https://regexguide.com/patterns/youtube-video-id.html]; YouTube never officially committed to 11 chars, so belt-and-braces |
| Built-URL safety | String concat without check | `new URL()` + hostname ∈ allowlist assertion in test | One-line host validation catches `youtube.com.evil.com` style suffix tricks; `z.url({hostname})` exists [CITED: https://zod.dev/api] |
| Start-time format | `t=1h2m3s` pretty-printing | `t=<seconds>s` integer param | YouTube accepts plain seconds; avoids a parser and its edge cases [ASSUMED] |
| Ordering helper | `lodash.orderBy` (new dep) | 10-line `rankVideos` with stable tie-break | Zero-dep; tie rule ("catalog order") needs explicit index fallback anyway |
| Size display | Measured download probe | Builder-estimated `sizeMB` shown as "~X MB" | Probing costs bandwidth the low-data toggle exists to save; approximation is honest if labelled [ASSUMED] |
| Relative-time/duration format | `date-fns` (new dep) | `Math.floor(sec/60)` + existing copy style | Two fields (length, size); a library is pure overhead |

**Key insight:** Every hard problem here (trust, honesty, privacy) is solved by *curation + linking*, not code. The ranker is deliberately dumb; intelligence lives in the builder's review.

## Common Pitfalls

### Pitfall 1: Autoplay or embed creep
**What goes wrong:** Someone "improves" links into embedded players with `autoplay=1`, violating idea.md §6.2/§8 and triggering data collection on page load [CITED: https://developers.google.com/youtube/player_parameters].
**Why it happens:** Embeds look richer in demos.
**How to avoid:** Render `<a>` only; add a test asserting `Repair.tsx` output contains no `<iframe` and no `autoplay` string.
**Warning signs:** Any `embed/` URL or `youtube-nocookie` string in the diff.

### Pitfall 2: Unreviewed video served
**What goes wrong:** A typo'd ID or an uncurated node renders a dead/broken or wrong video.
**Why it happens:** Content file edited without running tests.
**How to avoid:** Build-time test: every `VIDEO_RESOURCES` entry parses against `VideoResourceSchema`, ≤2 per node, `startAt < lengthSec`; Repair renders NCERT block whenever ranked list is empty (never blank).
**Warning signs:** `resources.ts` changed without `resources.test.ts` running green.

### Pitfall 3: Banned-word / claim regression in new copy
**What goes wrong:** Nudge or trace-row copy uses "weak", "unblocks", "mastered", or implies a video *causes* improvement.
**Why it happens:** Natural phrasing ("this video fixes vectors").
**How to avoid:** Route ALL new strings through `t()` in `copy.ts` so `copy.test.ts` bans cover them; trace row states inputs ("ranked 2 from N curated — tag-match + preferred channel"), never outcomes.
**Warning signs:** New user-facing string outside `copy.ts`.

### Pitfall 4: Settings schema migration breaks old stores
**What goes wrong:** `loadStore`/`validState` rejects pre-existing profiles after `StudentSettings` gains fields.
**Why it happens:** `validState` checks `typeof settings === "object"` (lenient — good) but new code assumes arrays exist.
**How to avoid:** Default with `??` at read time (`settings.preferredChannels ?? []`); `loadStore` already backfills `activity ??= []` — follow that exact pattern in `profiles.ts`.
**Warning signs:** `undefined is not iterable` crashes for returning users; guest/session path untested.

### Pitfall 5: Guest persistence leaks into saved profiles
**What goes wrong:** Guest's channel picks or Samajh-aaya feedback end up in `localStorage` profiles.
**Why it happens:** Reusing the profile write-through path for guest state.
**How to avoid:** Guest writes go to `sessionStorage` only (existing `useProfile` split); D-06 demo seed (2 channels) applies to the demo profile, not guests.
**Warning signs:** `kadi.profiles.v1` changes after a guest session.

### Pitfall 6: `hasVideo` default wrong when agent is off
**What goes wrong:** No-AI mode shows video section in the wrong position or hides curated videos.
**Why it happens:** `order` is `null` in `App.tsx:307` today; agent path and null path diverge.
**How to avoid:** Compute section order in code from the same `hasVideo` boolean in both paths (agent suggestion validated on top, deterministic default underneath — the `suggestRepairOrder` fallback pattern in `run.ts:168`).
**Warning signs:** Repair card differs between AI and no-AI modes for the same node.

### Pitfall 7: Start-time / size metadata rot
**What goes wrong:** Video re-uploaded or re-timed; `startAt` points at an outro, `sizeMB` misleads low-data students.
**Why it happens:** No YouTube Data API verification (deferred by design).
**How to avoid:** Keep the seed small (4 demo-path nodes per D-03); label size "~" (approx); builder re-verifies IDs/times at the 19:15 freeze; never claim "verified" beyond builder review.
**Warning signs:** Entries added for all 9 nodes in a rush without review.

## Code Examples

### Ranked video section in Repair card
```tsx
// Source pattern: app/components/Repair.tsx:132-152 (details/review-body + lowData gate)
{!settings.lowData && hasVideos && (
  <div>
    <b>{c.watch}</b>
    <ul>
      {ranked.map((v) => (
        <li key={v.id}>
          <a href={buildVideoUrl(v.id, v.startAt)} target="_blank" rel="noopener noreferrer">
            {v.title} · {Math.floor(v.lengthSec / 60)} min · ~{v.sizeMB} MB · from {Math.floor(v.startAt / 60)}:{String(v.startAt % 60).padStart(2, "0")}
          </a>
          {/* Samajh aaya? yes/thoda/nahi → onFeedback(v.id, v) — reorder-only */}
        </li>
      ))}
    </ul>
  </div>
)}
```

### Channel multi-pick in Settings (1–7 of 15)
```tsx
// Source pattern: app/components/Settings.tsx Choice + lowData toggle (:46)
<section className="settings-section">
  <h3>Preferred teachers (pick 1–7)</h3>
  <div className="choice-group">
    {CHANNELS.map((ch) => (
      <button key={ch.id} aria-pressed={preferred.includes(ch.id)} onClick={() => toggleChannel(ch.id)} className="choice-button">
        {ch.name}
      </button>
    ))}
  </div>
</section>
// toggle clamps: ignore picks beyond 7, ignore deselect below 1 (reducer never throws ethos)
```

### `hasVideo` plumbing through repair order
```typescript
// Source pattern: app/lib/mentor/run.ts:168 + app/app/api/mentor/route.ts Body
export function suggestRepairOrder(ctx: MentorContext, nodeId: string, lowData: boolean, hasVideo: boolean) {
  const prompt = `Order the repair options for topic ${nodeId}. Low data mode: ${lowData}. Curated videos available: ${hasVideo}. If low data is true or no curated videos exist, do not include video (order read above video). Call compose_repair.`;
  return runJob<RepairOrder>("repair_order", ctx, composeRepair, prompt, validateRepairOrder);
}
// route Body += hasVideo: z.boolean().optional(); deterministic fallback when agent off:
// default order = hasVideo && !lowData ? ["contrast","check","read","video"] : ["contrast","check","read"]
```

### Outcome nudge (one line, gap verdicts only)
```tsx
// Source pattern: app/components/Outcome.tsx:66-71 + GRAPH + connectedLaterCount (graph.ts:193)
{(outcome === "suspected_gap" || outcome === "below_coverage") && suspected && (
  <p className="note-panel">
    {`Possible contributing gap: ${GRAPH[suspected].name} — connected to ${connectedLaterCount(suspected)} later topics. Start here: review ${GRAPH[suspected].name}.`}
    <button onClick={() => onRepair(suspected)}>Review this concept</button>
  </p>
)}
// copy.test.ts bans apply; dispute button stays untouched
```

### Build-time host allowlist test
```typescript
// Source: idea.md §8 (allowlist enum + allowed-host validation at build time)
import { describe, expect, it } from "vitest";
describe("video allowlist", () => {
  it("every entry validates and builds to an allowlisted host", () => {
    for (const [node, list] of Object.entries(VIDEO_RESOURCES)) {
      expect(list.length, node).toBeLessThanOrEqual(2);
      for (const v of list) {
        VideoResourceSchema.parse(v);
        const host = new URL(buildVideoUrl(v.id, v.startAt)).hostname;
        expect(ALLOWED_VIDEO_HOSTS as readonly string[], v.id).toContain(host);
        expect(v.startAt, v.id).toBeLessThan(v.lengthSec);
      }
    }
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `youtube.com/embed` default | `youtube-nocookie.com` privacy-enhanced for embeds; **link-out preferred** here | Google privacy mode (long-standing) | Lower tracking, but NOT zero (Local Storage ID pre-consent) — link-out avoids the question entirely |
| `autoplay=1` embeds | No autoplay; user-initiated playback only | IFrame API docs (autoplay data-collection note) | Autoplay + privacy compliance are incompatible; spec already bans it |
| Free-text favourite channels | Curated fixed list, bounded multi-pick | Locked D-05 (idea.md §17 DEFERRED) | No YouTube search/API surface; validation is `z.array().min(1).max(7)` |
| zod v3 `z.enum` + refinements | zod v4 (4.6.5 installed): same `z.enum`, native `.min/.max` on arrays, `z.url({hostname})`, `z.stringFormat` for custom formats | zod 4.x | All needed validators are core APIs, no helpers [CITED: https://zod.dev/api] |

**Deprecated/outdated:**
- `z.nativeEnum()` — deprecated in zod 4; use `z.enum()` (codebase `NodeIdSchema` already does).
- Iframe `showinfo`/`modestbranding` params — deprecated by YouTube; irrelevant since we link out.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Lucide icon names (`Youtube`/`Play`) exist in installed version — verify at build | Standard Stack | Low: fallback to existing `CircleSlash`/`BookOpen` icons |
| A2 | `sizeMB` is a builder estimate shown as "~X MB" (no measurement) | Architecture Patterns | Medium: misleads low-data students if presented as exact — always prefix "~" |
| A3 | `t=<seconds>s` integer param is sufficient for start times (no `1h2m3s` format) | Don't Hand-Roll | Low: YouTube accepts seconds; builder verifies the timestamp lands correctly |
| A4 | Samajh-aaya mapping (yes +1 / nahi −1 / thoda 0) and weight scale vs tag/channel weights | Architecture Patterns | Low: any consistent mapping satisfies "reorder only"; planner locks exact numbers |
| A5 | The 15 channel names + demo seed's 2 picks (planner/builder choice, agent's discretion) | Open Questions | Medium: wrong/irrelevant channels hurt trust — builder must approve list |
| A6 | `connectedLaterCount()` (live + coming-next) is the "N later topics" for the nudge | Code Examples | Low: matches existing Outcome copy pattern (`connectionSummary`) |

## Open Questions (RESOLVED: Q1 channels + demo seed → 02-01-T2 catalog task and 02-02-T2 seed task; Q2 entry shape → 02-01-T1 VideoResourceSchema; Q3 Samajh-aaya UI → 02-03-T1/T2 inline buttons via t())

1. **Which 15 channels + which 2 seed the demo?**
   - What we know: curated list, 1–7 picks, demo seed picks 2 (D-05/D-06).
   - What's unclear: actual channel names (need JEE physics/maths teachers with stable URLs).
   - Recommendation: builder names 15 before planning ends; planner hardcodes as data with `channelId` keys so renames don't break entries.

2. **Exact `resources.ts` entry shape beyond D-02 fields?**
   - What we know: ID, title, start time, length, size required; tags + channelId needed by ranking.
   - What's unclear: nothing blocking — shape above covers it.
   - Recommendation: planner adopts the `VideoResourceSchema` as-is; extend only with optional `note` (≤140 chars, ban-checked).

3. **Samajh-aaya UI placement and wording?**
   - What we know: yes/thoda/nahi per video, per-profile, reorder-only (D-15).
   - What's unclear: inline under each link vs one row; exact Hinglish copy.
   - Recommendation: inline `yes / thoda / nahi` micro-buttons under each link; copy via `t()` so bans apply; default (no feedback) = catalog order.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | `@cline/sdk`, Next build | ✓ | 24.16.0 | — (needs 22+) |
| npm + installed deps (zod/next/react) | all phase code | ✓ | zod 4.6.5 verified | — |
| YouTube Data API / keys / quota | none (deferred per D-decisions) | N/A | — | Builder manual verification (by design) |
| Network at runtime | none (links only, no fetch/embed) | N/A | — | NCERT read-instead always rendered |
| `SERVE_UNAPPROVED` / env | none | N/A | — | Videos are reviewed content, not draft items |

**Missing dependencies with no fallback:** none — this phase has no external runtime dependencies by design.
**Missing dependencies with fallback:** none.

## Validation Architecture

> Included: no `.planning/config.json` exists, so `workflow.nyquist_validation` is absent → treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.3 |
| Config file | `Finals/app/vitest.config.ts` (include `tests/**/*.test.ts`, `@` alias, node env) |
| Quick run command | `npx vitest run tests/resources.test.ts` (from `Finals/app/`) |
| Full suite command | `npx tsc --noEmit && npx vitest run` (from `Finals/app/`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| YT-01 | ≤2 entries/node validate; start < length; no iframe/autoplay in Repair output | unit (schema + render-string assert) | `npx vitest run tests/resources.test.ts` | ❌ Wave 0 |
| YT-02 | tag-match first, preferred channel next, feedback reorders, ties keep catalog order | unit (pure ranker, seeded fixtures) | `npx vitest run tests/resources.test.ts` | ❌ Wave 0 |
| YT-03 | every built URL host ∈ allowlist; mentor tool surface unchanged (no URL tool) | unit + existing suite | `npx vitest run tests/resources.test.ts tests/mentor-tools.test.ts` | ❌ Wave 0 / ✅ exists |
| YT-04 | nudge renders only on gap/context_difficulty outcomes; copy passes bans; deep-links weak node | unit (copy.test.ts pattern + outcome-prop test) | `npx vitest run tests/copy.test.ts` | ✅ exists (extend) |
| YT-05 | lowData hides video section; empty catalog → NCERT block, never blank | unit | `npx vitest run tests/resources.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/resources.test.ts tests/copy.test.ts tests/mentor-tools.test.ts`
- **Per wave merge:** `npx tsc --noEmit && npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/resources.test.ts` — schema/max-2/host/start-time/ranking/fallback/nudge-gating tests (covers YT-01..05)
- [ ] `tests/profiles.test.ts` — extend: new settings fields default/backfill, guest isolation (covers D-06)
- [ ] `copy.ts` — nudge + trace-row + Samajh-aaya strings via `t()` (covered by existing `copy.test.ts` bans, no new harness needed)
- [ ] Framework install: none — vitest + config already present

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts (idea.md §15); AI mode gate untouched |
| V3 Session Management | no | Guest `sessionStorage` isolation already exists; no change |
| V4 Access Control | partial | Demo profiles must never link reminders (existing rule); video prefs are per-profile keyed |
| V5 Input Validation | **yes** | zod at every boundary: `VideoResourceSchema`, `PreferredChannelsSchema`, `VIDEO_ID_RE`, built-URL host assertion |
| V6 Cryptography | no | No new secrets; link-out URLs carry no tokens |

### Known Threat Patterns for Next.js + static-allowlist stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Model emits attacker-influenced URL | Tampering | Model never emits URLs/IDs; UI builds links from allowlisted IDs only (YT-03) |
| Lookalike-host link (`youtube.com.evil.com`) | Spoofing | `new URL()` hostname exact-match against allowlist at build time + zod `z.url({hostname})` |
| `target="_blank"` tab-nabbing | Spoofing | `rel="noopener noreferrer"` on every video link (existing Repair pattern) |
| Stored XSS via content file | Tampering / XSS | IDs/titles validated by zod; React escapes by default; titles never use `dangerouslySetInnerHTML` |
| Corrupt localStorage → crash or privilege mix | Tampering | `loadStore`/`validState` never throws; `??` defaults for new fields; guest never writes profiles |
| Effectiveness/teacher claims from local counts | Information (honesty) | Ranker weights never displayed; REJECTED per idea.md §17 — no warnings, no gains claims |

## Sources

### Primary (HIGH confidence)
- Codebase grep + reads: `Repair.tsx`, `Outcome.tsx`, `Settings.tsx`, `graph.ts`, `repair.ts`, `mentor/{tools,run,schemas}.ts`, `api/mentor/route.ts`, `types.ts`, `state.ts`, `profiles.ts`, `store.ts`, `copy.ts`, `App.tsx`, `package.json`, `vitest.config.ts` — all phase patterns verified in-tree.

### Secondary (MEDIUM confidence)
- [CITED: https://developers.google.com/youtube/player_parameters] — autoplay default 0, autoplay=1 collects data on load (via search digest, cross-checked with YouTube Help).
- [CITED: https://support.google.com/youtube/answer/171780] — privacy-enhanced mode (`youtube-nocookie.com`), no personalization use.
- [CITED: https://regexguide.com/patterns/youtube-video-id.html] + regexlib `youtube-id` — `^[A-Za-z0-9_-]{11}$` ID format across watch/youtu.be/embed/shorts forms.
- [CITED: https://zod.dev/api] — `z.enum`, array `.min/.max`, `.regex`, `z.url({hostname})`, `z.httpUrl()` (fetched directly; installed zod 4.6.5 uses the same APIs as existing `schemas.ts`).

### Tertiary (LOW confidence)
- `t=<seconds>s` sufficiency, `~MB` builder-estimate honesty, lucide `Youtube` icon name, Samajh-aaya weight mapping — marked [ASSUMED], planner locks or verifies at build.
- Research-plan items `cd23e1` (Next.js link docs) and `2d26b3` (curated-UX pattern) hit the Exa rate limit — resolved from in-tree precedent instead (Repair/App link blocks; repair-order UX), no external claim carried.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; zod 4.6.5 verified installed; every API cited from official docs and mirrored by existing in-tree usage.
- Architecture: HIGH — all integration points read in code; locked decisions map 1:1 to existing patterns.
- Pitfalls: MEDIUM — grounded in spec bans + reviewed tests; YouTube-side caveats (ID-length commitment, nocookie limits) sourced from community docs, flagged honestly.

**Research date:** 10 Oct 2026
**Valid until:** 30 days (stable domain; YouTube URL forms change rarely — re-check ID-length assumption if entries fail validation)
