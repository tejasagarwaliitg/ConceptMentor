---
phase: 02-youtube-redirection
plan: 01
subsystem: content
tags: [youtube, zod, allowlist, deterministic-ranking, vitest]

# Dependency graph
requires:
  - phase: 01-profile-system
    provides: [StudentSettings shape extended by later plans, copy-ban test patterns]
provides:
  - "Pure ranker + URL builder (app/lib/videos.ts): VIDEO_ID_RE, ALLOWED_VIDEO_HOSTS, zod schemas, rankVideos, buildVideoUrl, hasCuratedVideos, defaultRepairOrder, videoTraceLine"
  - "Curated catalog (app/content/resources.ts): 15 teacher channels, 8 verified entries (2 each on projectile, vec_comp, trig, vec_basics), IDs only"
  - "Gate test (app/tests/resources.test.ts): 10 tests covering schema, max-2, host allowlist, ban sweeps, ranking fixtures, section defaults, trace line"
affects: [02-02-settings, 02-03-picker, 02-04-repair-ui, hasVideo-plumbing, Samajh-aaya-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns: [ids-only-content-urls-built-in-one-validated-place, stable-catalog-tie-break, synthetic-ranking-fixtures]

key-files:
  created:
    - app/lib/videos.ts
    - app/content/resources.ts
    - app/tests/resources.test.ts
  modified: []

key-decisions:
  - "Trace sentence uses 'Showing X of Y reviewed videos' — the word 'ranked' is a forbidden substring per copy.test.ts, so the RESEARCH/CONTEXT 'ranked N from M' shape could not be used verbatim"
  - "videos.ts imports zod only (no NodeId import — nothing uses it yet; plans 02-03/02-04 helpers can add a type-only import when needed)"
  - "Ranking fixtures are synthetic VideoResource objects, not catalog slices — logic tests stay independent of curation churn"
  - "Quantum Lab: The E-Pathshala included as the 15th channel so vec_comp has two distinct channels and preferred-teacher ordering is observable in the real catalog"
  - "sizeMB values are builder estimates (~0.5 MB/min at low quality); UI must prefix '~' per plan"
  - "All startAt values are 0 — no chapter timestamps could be verified from descriptions, invoking the plan's 'else 0' clause"

patterns-established:
  - "IDs-only content: resources.ts stores YouTube IDs, buildVideoUrl is the single URL construction site, tests assert every built hostname against ALLOWED_VIDEO_HOSTS"
  - "Stable ordering: rankVideos carries catalog index through the sort so ties are deterministic across renders"

requirements-completed: [YT-01, YT-02, YT-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Pure ranker + URL builder + schemas + section/trace helpers in lib/videos.ts"
    requirement: "YT-02"
    verification:
      - kind: unit
        ref: "tests/resources.test.ts#rankVideos (3 tests: tag-beats-teacher-beats-default, feedback lift/drop/neutral, ties + max-2)"
        status: pass
      - kind: unit
        ref: "tests/resources.test.ts#repair section defaults + videoTraceLine (3 tests)"
        status: pass
      - kind: other
        ref: "npx vitest run tests/copy.test.ts tests/mentor-tools.test.ts tests/safety.test.ts (25 tests, no regression)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Curated catalog: 15 channels, 8 real entries with verified IDs/durations on the 4 demo-path nodes"
    requirement: "YT-01"
    verification:
      - kind: unit
        ref: "tests/resources.test.ts#video catalog (4 tests: 15 unique channels, 9-node max-2 coverage, schema + startAt + host asserts, ban sweeps)"
        status: pass
    human_judgment: true
    rationale: "Automated checks prove shape, IDs, durations, hosts, and wording — but only a human watching each link at the pre-freeze check can confirm the video content and timestamp land correctly, and only the builder can approve the 15 channel names"
  - id: D3
    description: "Gate test actually bites: corrupting one entry (3rd video on projectile) flips the suite red"
    requirement: "YT-03"
    verification:
      - kind: unit
        ref: "manual corruption run 2026-10-10: 1 failed / 9 passed on 'covers all 9 nodes with at most 2 entries each', restored to green after"
        status: pass
    human_judgment: false

# Metrics
duration: 19min
completed: 2026-10-10
status: complete
---

# Phase 02 Plan 01: Video Catalog Foundation Summary

**Deterministic video ranker + single validated URL builder in `lib/videos.ts`, 8-entry verified catalog across 15 teacher channels in `content/resources.ts`, gated by a 10-test suite that provably bites on corruption**

## Performance

- **Duration:** 19 min
- **Started:** 2026-10-10T12:32Z
- **Completed:** 2026-10-10T12:51Z
- **Tasks:** 2 / 2
- **Files modified:** 3 (3 created, 0 modified)

## Accomplishments

- `app/lib/videos.ts`: dependency-free pure module (zod only) — VIDEO_ID_RE, ALLOWED_VIDEO_HOSTS, VideoResource/Channel/PreferredChannels/VideoFeedback schemas, rankVideos (tag 4 / teacher 2 / yes +1 / nahi −1, stable ties, max 2), buildVideoUrl (throws on unallowlisted ID), hasCuratedVideos, defaultRepairOrder, videoTraceLine
- `app/content/resources.ts`: 15 real teacher channels; 8 entries with web-verified 11-char IDs and real durations (projectile ×2 PW, vec_comp PW + Quantum Lab, trig Magnet Brains + TutorialsPoint, vec_basics PW + PW JEE); empty arrays on the other 5 nodes (NCERT read-instead downstream)
- `app/tests/resources.test.ts`: 10/10 green — schema/host/count/ban asserts over every entry, synthetic ranking fixtures, section truth table, trace-line checks
- Existing suites stay green: copy + mentor-tools + safety 25/25; tsc reports no errors in new files (pre-existing items.v2* errors untouched, out of scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/videos.ts** - `13a3a8e` (feat)
2. **Task 2: Create content/resources.ts + resources.test.ts** - `e9d43ee` (feat)

**Plan metadata:** pending (docs commit follows this summary)

## Files Created/Modified

- `Finals/app/lib/videos.ts` - pure ranker, URL builder, zod schemas, section/trace helpers (created)
- `Finals/app/content/resources.ts` - 15 channels + 8 curated entries, IDs only (created)
- `Finals/app/tests/resources.test.ts` - catalog + ranking + host + honesty gate, 10 tests (created)

## Decisions Made

- Trace sentence uses "Showing X of Y reviewed videos" — "ranked" is a forbidden substring, so the CONTEXT/RESEARCH shape could not be used verbatim (plan Task 1 explicitly bans it)
- videos.ts imports zod only; the NodeId type import was dropped as unused while keeping the dependency-free ethos (no lib-to-content import, verified by grep)
- Ranking fixtures are synthetic — catalog curation can churn without breaking logic tests
- Quantum Lab added as 15th channel for real-catalog teacher diversity on vec_comp
- sizeMB are builder estimates; startAt uniformly 0 (no verified chapter timestamps)

## Deviations from Plan

None - plan executed exactly as written. Web searches for real IDs/channels and the corruption gate-check were plan-mandated steps, not deviations.

## Issues Encountered

- First corruption gate-check ran vitest from `Finals/` instead of `Finals/app/` ("no tests" collected) and an early injection had a brace mismatch (transform error). Redid cleanly from `Finals/app/`: proper red (1 failed / 9 passed on max-2), restored to green. No impact on committed files.

## User Setup Required

None - no external service configuration required. Zero new dependencies installed.

## Next Phase Readiness

- Ready for 02-02 (settings storage, backfills, demo seed picks 2 of these 15 channel ids)
- Builder manual verification deferred to the pre-freeze check per 02-VALIDATION.md: open each of the 8 links, confirm video + timestamp; approve the 15 channel names
- User-visible YT-01 (Repair section render) completes in 02-04; this plan delivers the data + logic foundation

---
*Phase: 02-youtube-redirection*
*Completed: 2026-10-10*

## Self-Check: PASSED

- FOUND: Finals/app/lib/videos.ts, Finals/app/content/resources.ts, Finals/app/tests/resources.test.ts
- FOUND commits: 13a3a8e (Task 1), e9d43ee (Task 2)
- Acceptance re-verified post-commit: exports grep OK, no lib-to-content import, no zod/URLs in resources.ts, no iframe/autoplay/embed in Repair.tsx, resources suite 10/10, scoped full set 35/35
