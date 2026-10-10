# Phase 2: YouTube redirection - Context

**Gathered:** 10 Oct 2026
**Status:** Ready for planning
**Source:** /gsd-discuss-phase 2 (interactive; 4 areas, all decided by builder). Prior plan-phase choice recorded: research-first, max-2 spec-compliant videos.

<domain>
## Phase Boundary

A student who shows difficulty on a node gets priority-ordered (max 2) curated video redirections with verified start times, honouring preferred teacher + low-data + prior preference. When a prerequisite topic is found in gap, the outcome screen encourages completing its concepts first via its repair flow. No YouTube search, no model-emitted URLs, no new scheduling logic.

</domain>

<decisions>
## Implementation Decisions

### Video catalog + ordering
- **D-01:** New `app/content/resources.ts` keyed by `NodeId`, max 2 entries per node. Reviewed content file in the `graph.ts`/`repair.ts` pattern; builder-curated entries only, nothing unreviewed served.
- **D-02:** Full spec metadata per entry: allowlisted video ID, title, builder-verified start time, length, approx data size. URLs are built from the ID only with `youtube.com`/`youtu.be` host validation at build time (idea.md §8). No autoplay.
- **D-03:** Seed demo-path nodes first (`projectile`, `vec_comp`, `trig`, `vec_basics`). Uncurated nodes degrade to NCERT read-instead, never blank, never a dead end.
- **D-04:** Slot order: weakness-tag match first, preferred channels first; second slot is best remaining preferred, else catalog default. Ties keep catalog order. Reorder only — never an effectiveness claim.

### Preferred teacher setting
- **D-05:** Curated list of 15 YouTube channels in Settings; student picks 1–7 preferred. In-app YouTube account search/picker is a future prospect, not this phase (conflicts with idea.md §8 + §17 DEFERRED and the 20:00 freeze).
- **D-06:** Preference stored per-profile in device-local settings (extends the `lowData` pattern); demo seed picks 2 channels; guest choice is session-only.
- **D-07:** Fill rule: weakness-matched video from a preferred channel first; second slot best remaining preferred, else catalog default.

### Weak-topic nudge
- **D-08:** Nudge lives on the Outcome screen: one next-action line under the suspected-gap verdict. Map and Today stay unchanged.
- **D-09:** Trigger is gap verdicts only (`gap` / `context_difficulty` nodes). A single changed-context slip without a gap stays a plain repair flow — no lecture.
- **D-10:** Honest wording inside the bans: names the suspected contributing gap, its connected-later-topics count, one "start here" action. The "doesn't explain my mistake" dispute button stays.
- **D-11:** Nudge deep-links the weak node's repair card (contrast → check → read → video). No duplicated video lists on the outcome screen.

### Agent vs code ordering
- **D-12:** Deterministic code ranks the videos (tag → teacher → preference). The mentor agent keeps ordering only the repair *sections* via `compose_repair` (validated, `check` mandatory). Product works with the agent disabled.
- **D-13:** Availability-aware section ordering: the repair-order prompt carries a `hasVideo` flag; uncurated nodes order read above video.
- **D-14:** One honest deterministic trace caption for video ranking under the Repair video list (ranked N from M curated: tag-match + preferred teacher) — no DecisionPanel exists in the codebase, so the caption location carries the honest-trace intent. No fabricated agent activity.
- **D-15:** "Samajh aaya?" (yes/thoda/nahi) after a video is stored per-profile and reorders that student's future video order only. No effectiveness claims, no teacher warnings (idea.md §8).

### Carried forward (Phase 1 + locked spec, not re-asked)
- Device-local only: no accounts, no database, no analytics (idea.md §15). Engine/reducer untouched; only graded server events change states.
- Wording bans enforced: never `weak/fail/dumb/bekaar/trick-user/root cause/unblocks/mastered`.
- Repair order stays contrast → immediate check → read-instead (NCERT first) → video; low-data toggle hides videos.

### the agent's Discretion
- Exact `resources.ts` entry shape beyond D-02 fields, channel list of 15 names, nudge copy wording, trace-row text, `hasVideo` plumbing detail.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product constraints (do not violate)
- `idea.md` §6.2 step 5 (repair: contrast first, read-instead prominent, video max 2 with size, no autoplay)
- `idea.md` §8 (routing: LLM never produces URL, allowlist enum, order, preferred teacher SHOULD, Samajh-aaya reorder-only, no teacher warnings; YouTube search deferred)
- `idea.md` §11.0–11.2 (student never talks to AI; no state-changing/URL tools; consequences trace)
- `idea.md` §15 (privacy: device-local, adult-only AI mode, guest mode)
- `idea.md` §17 (DEFERRED: YouTube search, video verification, free-text channels)
- `Finals/app/.clinerules/project.md` — read before touching product code

### Code to reuse/extend
- `app/components/Repair.tsx` — repair card; video slot is a placeholder today (`sections` order, lowData gate)
- `app/content/graph.ts` — `GRAPH` nodes, `LIVE_NODES`, NCERT refs/URLs (pattern for `resources.ts`)
- `app/content/repair.ts` — `CONTRASTS`, `READ_INSTEAD` (reviewed-content pattern)
- `app/lib/mentor/tools.ts` — `compose_repair` completion tool (sections only, no URLs)
- `app/lib/mentor/schemas.ts` — `RepairOrderSchema` (`check` mandatory), `BANNED` words
- `app/lib/mentor/run.ts` — `suggestRepairOrder(ctx, nodeId, lowData)` (wire `hasVideo` here)
- `app/components/Settings.tsx` + `app/lib/types.ts` (`StudentSettings`), `app/lib/profiles.ts`, `app/lib/store.ts` — settings/profile plumbing for 1–7 channel picks + Samajh-aaya preference
- `app/components/Outcome.tsx` — outcome screen (nudge placement + deep link)
- `.planning/phases/01-profile-system/01-CONTEXT.md` — Phase 1 locked decisions (profiles, honesty rules)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Repair.tsx` `sections` render loop (`order ?? ["contrast","check","read","video"]`) — video ranking plugs in as ordered data, no structural change.
- `GRAPH[node].ncertUrl` NCERT link block — model for building video links from allowlisted IDs.
- `StudentSettings { lowData }` + Settings `Choice` — pattern for the channel multi-pick and Samajh-aaya storage.
- `suggestRepairOrder` deterministic fallback — pattern for code-side video ranking that survives agent failure.

### Established Patterns
- Reviewed-content-in-`content/` files, server-only answers/tags, zod at every boundary, reducer never throws.
- Repair checks capped at 2 attempts; probe budget 6 items — nudge must not add items or attempts.

### Integration Points
- `app/api/mentor` (`suggestRepairOrder`) — carries `lowData`; add `hasVideo` the same way.
- Outcome → Repair deep link for the weak node; DecisionPanel trace rows for the ranking row.
- Profile store (`kadi.profiles.v1`) — channel picks + video preference persist per profile.

</code_context>

<specifics>
## Specific Ideas

- 15 curated channels, student selects 1–7; demo seed pre-picks 2.
- Nudge shape: suspected-gap verdict + "connected to N later topics" + one "start here: <weak node> repair" action.
- Trace row shape: "ranked 2 from N curated — tag-match + preferred channel" (deterministic).

</specifics>

<deferred>
## Deferred Ideas

- In-app YouTube account search/picker (builder's future prospect) — needs API access, quota, review pipeline; belongs in its own phase.
- YouTube Data API, video verification/transcripts, free-text favourite channels (idea.md §17 DEFERRED).
- Teacher-effectiveness claims from local counts (idea.md REJECTED — never build).

</deferred>

---

*Phase: 02-youtube-redirection*
*Context gathered: 10 Oct 2026 via /gsd-discuss-phase 2*
