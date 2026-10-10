# Roadmap — Cline Hackathon final push (GSD bootstrap, 10 Oct 2026)

Source of truth for product remains `idea.md`; work order remains `EXECUTION.md`.
This file exists only so `/gsd-plan-phase` can track the Profile phase.

### Phase 1: Profile system

**Goal:** A returning student is recognised, picks up exactly where they left off, and sees per-profile progress, strengths/weaknesses, and revision schedule.
**Requirements:** PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06
**Plans:** 3 plans

Plans:

- [ ] 01-01-PLAN.md — Profile store plus profile-scoped hook and store tests
- [ ] 01-02-PLAN.md — Demo seed by replay plus observations selectors and tests
- [ ] 01-03-PLAN.md — Picker, App gating, Today views, and demo badge

### Phase 2: YouTube redirection

**Goal:** A student who shows difficulty on a node gets priority-ordered (max 2) curated video redirections with verified start times, honouring preferred teacher + low-data + prior preference; weak prerequisite topics prompt completing their concepts before proceeding.
**Requirements:** YT-01, YT-02, YT-03, YT-04, YT-05
**Plans:** 4 plans

Plans:
**Wave 1**

- [ ] 02-01-PLAN.md — Video catalog plus deterministic ranker, URL builder, and resources gate test

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 02-02-PLAN.md — Preferred-channel and feedback settings storage, backfills, and demo seed

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 02-03-PLAN.md — Picker UI, phase copy, clamp/merge helpers, and settings tests

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 02-04-PLAN.md — Repair video section, Outcome nudge, App feedback wiring, and hasVideo agent plumbing
