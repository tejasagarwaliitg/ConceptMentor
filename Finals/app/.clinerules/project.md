# Project rules (read idea.md at the repo root before changing anything)

These rules encode the product's safety and honesty commitments. Break one only with the builder's explicit approval.

## Evidence and content
- **One evidence policy** (idea.md section 5). The engine in `lib/probe.ts`, `lib/engine.ts`, `lib/checks.ts` is the only place states change. Change it only together with `tests/` and the transition table.
- **Never serve unapproved content.** An item is served only if `approved: true` in `content/items.draft*.ts`. `SERVE_UNAPPROVED=true` is for local development only and is ignored in production.
- Answer keys, distractor tags and notes live only in server code (`lib/items.ts`, imports `server-only`). Never send them to the browser before grading.
- "Pata nahi" never assigns a misconception tag. Wording-void items carry no evidence. Response time is never diagnostic evidence.

## The mentor agent (Cline SDK)
- The agent **never talks to the student**. Its input is structured data; its output is a *suggestion* validated in code (`lib/mentor/schemas.ts`).
- **No tool may grade, change a student's progress, or return a URL.** Resource links come only from reviewed content files.
- Finishing tools use `lifecycle.completesRun`. Every tool input is a zod schema with enums for node IDs.
- On any agent failure, timeout or invalid output, fall back to the deterministic default. The product must work with the agent disabled.

## Wording (student-facing)
- Never: "weak", "fail", "dumb", "bekaar", "trick-user", "root cause" (use "suspected contributing gap"), "unblocks" (use "connected to N later topics"), "mastered".
- Always show "Immediate check passed; retention untested" after a repair check. No streaks, scores, ranks or comparisons with other students.
- Never involve parents. Never claim learning gains.

## Safety and privacy
- The safety gate (`lib/safety.ts`) runs before any processing of free text, in both modes.
- AI mode is adult-only, behind `ACCESS_CODE`. Public default is no-AI mode, which sends no free text anywhere.
- No secrets in the repo. `.env.local` is never committed.

## Engineering
- zod at every boundary. The reducer never throws; invalid events return the state unchanged.
- Run `npm test` and `npx tsc --noEmit` before finishing a task.
