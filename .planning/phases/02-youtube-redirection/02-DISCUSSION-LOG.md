# Phase 2: YouTube redirection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 10 Oct 2026
**Phase:** 2-YouTube redirection
**Areas discussed:** Video catalog + ordering, Preferred teacher setting, Weak-topic nudge, Agent vs code ordering

---

## Video catalog + ordering

| Option | Description | Selected |
|--------|-------------|----------|
| New content/resources.ts | Reviewed content file keyed by nodeId, builder-curated only | ✓ |
| Extend content/graph.ts | Fewer files but mixes map data with curation | |
| You decide | Planner picks location | |

**User's choice:** New content/resources.ts
**Notes:** Full spec metadata (ID, title, verified start time, length, size). Demo-path nodes first; rest degrade to NCERT. Slot order: weakness-tag match first, preferred channels first.

## Preferred teacher setting

| Option | Description | Selected |
|--------|-------------|----------|
| Curated list in Settings | Fixed 15-channel list, 1–7 picks, per-profile | ✓ (evolved) |
| Defer picker, neutral order | Ship catalog order as-is | |
| In-app YouTube search | Builder's free-text proposal — conflicts with idea.md §8/§17 | rejected, deferred |

**User's choice:** Free-text: in-app search first, then after spec-conflict gate — curated 15-channel list with 1–7 picks; search a future prospect.
**Notes:** Per-profile device-local storage; demo seed picks 2. Fill rule: weakness-matched preferred video first, second slot best remaining preferred else default.

## Weak-topic nudge

| Option | Description | Selected |
|--------|-------------|----------|
| Outcome screen | One next-action line under suspected-gap verdict | ✓ |
| Today plan card | Bigger build, touches Today/profile views | |
| You decide | Planner places it | |

**User's choice:** Outcome screen; gap verdicts only; honest wording + one action; deep-link to weak node's repair card.

## Agent vs code ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Code orders, agent sections | Deterministic rank function; agent keeps section ordering | ✓ |
| New agent tool picks IDs | get_resources-style tool, more agentic, more risk | |
| You decide | Researcher compares | |

**User's choice:** Code orders, agent sections; availability-aware (`hasVideo` flag); one honest deterministic trace row; Samajh-aaya per-profile reorder-only.

---

## the agent's Discretion

None — builder decided every area. Entry shape detail, channel names, copy wording left to planner within locked decisions.

## Deferred Ideas

- In-app YouTube account search/picker (future prospect).
- YouTube Data API, video verification/transcripts, free-text channels (idea.md §17).
- Teacher-effectiveness claims (idea.md REJECTED).
