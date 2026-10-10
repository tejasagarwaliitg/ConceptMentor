# Concept Mentor · Team Athena

**Builder: Tejas Agarwal**

A student can explore the concepts behind a difficult physics or maths question, check a possible contributing gap, use a focused learning resource, and revisit the concept later. The current interface is English-only, with a light theme and device-local profiles.

## Run the local demonstration

Requires Node.js 22 or newer.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The profile picker supports a new profile, guest session, and a clearly labelled simulated demo profile. To try the unapproved draft content locally, set `SERVE_UNAPPROVED=true` in `.env.local`; this flag is ignored in production. Never overwrite an existing `.env.local` containing credentials.

## Verification

```sh
npm run typecheck
npm test
npm run lint
npm run build
```

Browser checks, against the running local app:

```sh
node scripts/ui-smoke.mjs
```

## What works

- Nine diagnostic concepts with a strictly ordered prerequisite graph; separate colours for prerequisites, selected concept and dependants.
- Local profiles, separate guest progress, a labelled simulated profile, export/import and deletion.
- Standard and changed-context checks, server-side grading, signed question instances and option shuffling.
- Bounded diagnosis, uncertain/inconclusive outcomes, student dispute and teacher-routing options.
- Independent repair items and confidence-sensitive review scheduling. The current ladder is 1, 3, 7, 14, 30, 60 and 120 days; immediate success is labelled retention untested.
- Optional Cline SDK orchestration with validated suggestions and deterministic fallback. The agent cannot grade or change progress.
- A central question bank with profile-scoped shown-question history, explicit exhaustion, an import/review pipeline and optional reminder integration.

## Submission boundaries

The authored diagnostic bank contains **27 draft items (A, B1 and B2 for each concept), with zero human-approved items**. Automated verification is not educator approval. The review sheet is at `../submission/QUESTION-REVIEW.md`. Production will correctly decline to serve unapproved questions. Each diagnostic role currently has one item per concept. Shown items are excluded from future requests, including revision; an exhausted pool stops the check without changing evidence. More independently reviewed variants are needed for sustained revision. The bank also contains imported practice entries; coverage remains sparse.

The student-facing live AI integration and Telegram delivery require credentials and have not been demonstrated in this checkout. Do not claim verified live model use, a real learner study, proven learning gains or institutional readiness. The seeded profile contains simulated evidence. Live AI use with minors has not been cleared; keep any live AI demonstration adult-only.

## Architecture

`components/` renders the student flow. `lib/engine.ts`, `probe.ts`, `checks.ts` and `revision.ts` define deterministic state changes. `/api/item` issues signed item instances; `/api/grade` grades them without exposing keys beforehand. `content/qbank.json` supplies both diagnostic and practice questions at request time. Explicit diagnostic roles preserve the evidence policy; difficulty alone cannot make a practice question diagnostic. Historical `content/items.v2*.ts` files retain authoring references. `lib/mentor/` uses the Cline SDK for bounded tool suggestions validated with schemas. `lib/profiles.ts` stores progress in the browser. Question approval is a server gate, not a client toggle.

## Deployment

Deploy the `app/` directory as a Next.js application. Set a strong private `ITEM_SECRET` in the hosting environment. Keep secrets out of source control. Approve reviewed questions before expecting the public diagnostic journey to serve content. A hosted URL has not been provisioned as part of this local handoff. Optional reminder storage must use a durable backend for a multi-instance deployment; an in-memory demo store is not durable hosting.

See `../submission/DEMO-SCRIPT.md` and `../submission/SUBMISSION-CHECKLIST.md` for the presentation handoff.
