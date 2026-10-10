---
phase: 02
slug: youtube-redirection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-10
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `app/vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/resources.test.ts` |
| **Full suite command** | `npx tsc --noEmit && npx vitest run` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/resources.test.ts`
- **After every plan wave:** Run `npx tsc --noEmit && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | YT-01/YT-03 | — | N/A (curated static content, no URLs from model) | unit | `npx vitest run tests/resources.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | YT-02/YT-05 | — | N/A | unit | `npx vitest run tests/resources.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | YT-04 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/tests/resources.test.ts` — stubs for YT-01…YT-05 (catalog schema, ≤2/node, host allowlist, ranking order, low-data hide)
- [ ] Settings-backfill cases (preferred-channels default, Samajh-aaya default)
- [ ] Existing infrastructure covers the rest (vitest installed, no framework install needed)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Video links open correct video at verified start time | YT-01 | Requires human watching YouTube + builder curation approval | Open each curated link, confirm video + timestamp |
| Nudge copy reads honest + one action, no banned words | YT-04 | Copy judgment | Read Outcome screen for gap node; confirm wording |
| Builder approves 15 channel names + demo seed picks | YT-02 | Human curation decision | Review `resources.ts` channel list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
