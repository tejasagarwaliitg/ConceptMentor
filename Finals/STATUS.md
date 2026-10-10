# Build status (updated 3:40pm, 10 Oct 2026)

Local only. No git commit yet (as requested). App lives in `app/`. Run: `cd app && npm run dev`, then open http://localhost:3000

## Verified working (I ran these)
- `npm test`: 55 tests pass (evidence policy, state-change table, integrity, server grading, safety gate, guards, agent-output validation, wording).
- `tsc --noEmit`: clean.
- Dev server: home page 200. `/api/item` and `/api/grade` tested over real HTTP:
  - no answer key, tag or note in an issued item
  - correct / wrong / "Pata nahi" / tampered token / unknown node all behave as specified
  - "Pata nahi" never gets a misconception tag
  - nodes with no approved/authored item return 404 (shown to the student as "not ready")
- `/api/mentor` rejects: no access code, adult not confirmed, invented node, oversized text. Returns "ai_mode_closed" when `ACCESS_CODE` is unset.
- All 9 drafted answers were recomputed by script and are correct.

## NOT verified yet (need you or a key)
1. **The Cline SDK agent has never made a real model call.** Needs `CLINE_API_KEY`, `MENTOR_MODEL`, `ACCESS_CODE` in `app/.env.local`. This is Gate G1 and the biggest open risk.
2. **Desktop and mobile browser layouts have now been visually checked.** Real-device and learner feedback are still needed; see the UI update below.
3. **No question is approved.** In production nothing is served. Locally `SERVE_UNAPPROVED=true` lets you try the draft items. Only 11 draft items exist (slope, deriv_rate, motion_graphs have none, so they show "abhi tayyar nahi").
4. NCERT links return HTTP 200 but I have not checked the section/page numbers against the books.
5. No video links yet (the repair screen says so honestly).

## Your tasks (only you can do these)
- [ ] Solve every draft item in `app/content/items.draft.ts` + `items.draft2.ts` yourself, then set `approved: true` and `approvedBy`.
- [ ] Review every line in `content/repair.ts` and `content/stuck.ts`.
- [ ] Create the Cline API key; paste into `app/.env.local` (never in chat).
- [ ] Open the app on your phone; note anything confusing.
- [ ] Find the 18+ tester.


## UI update — 10 October 2026

- Rebuilt the landing page, navigation and learning-screen styling with the BharatLens dark teal visual language. Added a real interactive graph preview, chapter cards, due reviews, weekly checks and device-local progress controls.
- Replaced the list map with a searchable, zoomable graph and concept inspector. Prerequisites are strictly below dependants; dragging is horizontal only. Blue highlights all prerequisites, green highlights all dependants, and gold marks the selected concept.
- Added responsive graph layouts, keyboard node selection, future-topic controls and explicitly separate progress labels.
- Preserved question approval rules and added a visible local draft-content banner when the existing development bypass is enabled.
- Guest sessions now remount independently so saved progress is not carried into an empty guest session.
- Verification: 64 tests passed; TypeScript and lint for changed code passed; production build passed after clearing a failed build cache. Desktop (1440px) and mobile (390px) browser checks showed no page errors or horizontal overflow. Full-project lint still reports pre-existing issues in mentor code/tests and an unused probe helper.
- Browser interaction checks also passed: horizontal-only node dragging, zoom/reset, keyboard selection, transitive roadmap highlights, isolation of guest and saved progress, and real question grading through an outcome and repair screen.
- Preview: http://localhost:3000. No deployment or content approval was performed.

## English copy and question rotation — 10 October 2026

- Removed the student-facing Hinglish/English and register controls; the UI, settings, repair notes, explanations and question prompts now use English. Existing saved progress and imports discard the old language preferences while retaining data preferences.
- The original pool had one A and one B1 question per available concept, and only one B2 review question (vector components). Added alternate A/B1 drafts for six concepts and four alternate B2 drafts for vector components. All remain `approved: false`.
- `recentItems` stores the last question IDs by concept and question type. The selector tries unseen variants first, then avoids the immediately preceding question when it cycles. Existing saved progress loads with an empty history.
- Review schedule: a successful repair check is due again after 1 day; successful due reviews advance to 7 days and then 30 days, with later passes returning to 30-day intervals. A failed due review marks context difficulty and clears the scheduled date. It does not create a new automatic due date.
- Current limitations: alternate B2 review questions exist only for vector components. Other concepts do not yet have their own review questions. No item has educator approval, so the real production approval gate still serves none.
- TypeScript and lint for the changed app/content code completed without errors; the pre-existing unused `hasProbeAnswers` warning remains. The production build currently fails while Turbopack starts its CSS worker (`Operation not permitted` binding its internal port); this workspace environment prevented final production-build confirmation.

## UI polish: learning screens unified — 10 October 2026 (evening)

- Rebuilt Outcome, Repair, Stuck and Settings on the dark teal design system instead of light-theme Tailwind remapped by CSS overrides. All four now share the `learning-card` chrome (session row + "Take a break"), brand buttons (`button primary/secondary/danger`), and typed panels (`note-panel`, `contrast-note`, `review-panel`, `stuck-card`, `teacher-note`, `match-panel`).
- Outcome shows per-concept evidence with state dots (gold = possible starting point, blue = context difficulty, mint = no difficulty found), matching the graph legend language. Repair results use pass/retry/info status icons. Stuck choices are selectable cards with a styled teacher-note quote and copy button. Settings is sectioned (data use, Telegram reminders, progress, reported questions) with `aria-pressed` choice buttons.
- Restyled the new photo-intake flow (Intake/IntakeConfirm) and the Telegram link-code block to the same language; SVG figures now sit on a light "paper" frame so the diagram ink stays readable on the dark theme.
- Question screen: hover state on answer options, a check mark on the chosen option, animated confidence panel (reduced-motion respected). `Rich` now renders `**bold**`/`*italic*` in stems and options (escaped first, so no raw HTML).
- Global: sticky blurred header (scroll padding already assumed it), branded boot loader replacing "Ruko...", entrance animations behind `prefers-reduced-motion`, and removed the now-dead Tailwind color-remap block plus other unused rules.
- Verification (on a healthy tree): full browser flow at 1440px and 390px — home, map + inspector, question → outcome → repair → repair question → repair result, settings — with zero horizontal overflow and no console errors beyond expected 404s for not-yet-written items. `npx tsc --noEmit` and eslint clean for all changed files.
- Note: another session was actively building (profiles, notify, v2 item bank, derive) in the same tree during this work; the tree was transiently red from those in-flight edits (`lib/derive.ts` duplicate exports, `lib/profiles` wiring) and the final post-CTA browser re-check after the CSS cleanup could not be repeated against their broken mid-refactor build. Fixed a merge slip where the profiles rewrite of `Settings.tsx` lost the lucide icon imports.

## Accountability scoped to revision — 10 October 2026 (late)

- Per the revision plans (idea.md §9; PROF-05 / D-06), accountability is revision-only: a student-chosen commitment, the due re-check at +1/+7/+30, and an honest reply. The Telegram bot (`/api/notify/sweep`) now sends **only due re-check nudges** from that schedule; the inactivity ("rhythm") nudge pass was removed because no revision plan includes prompting about study activity in general.
- Untouched: the webhook postpone/done/stop intents (they act on revision checks), the once-per-boot sync, and `lib/rhythm.ts` + `tests/rhythm.test.ts` (kept as a pure, tested library, now unused by the bot — candidate for full removal if the rhythm feature is not coming back).

## Revision buckets — 10 October 2026

- Replaced the fixed 1 → 7 → 30 day loop (where a strong topic came back every 30 days forever) with a seven-bucket ladder in `app/lib/revision.ts`: 1, 3, 7, 14, 30, 60, 120 days. `NodeRecord.recheckStep` is now the bucket (0–7) and `NodeRecord.proficiency` (1 guessing, 2 somewhat sure, 3 sure) is kept from the last correct check. The old `RECHECK_INTERVAL_DAYS` is removed.
- A repaired topic always starts in bucket 1 (+1 day), because retention is untested. When a due re-check is answered correctly: same or better proficiency moves it further out (two buckets if "sure", one if "somewhat sure"); lower proficiency moves it one bucket nearer; a correct guess stays put (luck is not evidence). A wrong answer still marks context difficulty and leaves the ladder; the next repair starts again at bucket 1.
- Saved progress and imports keep working: records without `proficiency` are read as the old ladder (old step 2 = 7 days → bucket 3, old step 3 = 30 days → bucket 5) and assumed "somewhat sure". The importer accepts steps 0–7.
- `dueNodes` now returns the most overdue first, so the three shown on Today are the right three. The per-topic "Review in 1/3/7 days" commitment and Telegram postponing still work; they only move the next date, not the bucket.
- History events: `recheck:pass` (moved out), `recheck:pass:same`, `recheck:pass:nearer`. Added 12 tests in `tests/recheck.test.ts` (18 total, all pass). `tsc` has no errors outside the other session's `content/items.v2*.ts`; the 28 failing tests are the same `items`/`review` v2 bank tests.
- Superseded: the earlier note under the question-variety section that reviews advance to 7 then 30 days.


## Final local verification — 2026-10-10 19:27 IST

- Central runtime question bank: 30 entries, including 27 authored diagnostic drafts; zero human-approved entries at this check.
- Diagnosis and practice fetch from `app/content/qbank.json`; explicit diagnostic roles remain separate from practice difficulty.
- Shown diagnostic IDs persist with profile progress, including shown-but-unanswered questions. Practice history is scoped per profile; guest history is session-only. Seen items are excluded without eviction or a recycling control. Exhaustion returns no item and does not invent evidence.
- New reviewed entries in the runtime bank become selectable on subsequent requests. A deployed immutable filesystem still requires republishing the bank; no remote database is claimed.
- `npm run typecheck` passed; `npm test` passed 262 tests across 31 files; production `npm run build` passed. Initial build was blocked by a compiler-worker port restriction; clearing only the generated compiler cache resolved it.
- Browser journey passed: guest, diagnosis, repair, immediate check and graph selection; no page errors. Explicitly verified seen-question exhaustion returns HTTP 404. Recording: `submission/athena-local-demo.webm`.
- Light English UI, fixed prerequisite heights and separate prerequisite/dependant highlights are present.
- Remaining: educator/builder item approval, more independent review variants, hosted deployment and verified live Cline/Telegram use. Canva draft corrections are documented in `submission/DEMO-SCRIPT.md`; final deck export/submission is not claimed.
