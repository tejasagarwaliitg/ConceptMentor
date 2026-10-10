# Athena submission handoff

## Ready locally
- Light-theme student app with responsive navigation, profile onboarding and graph.
- Corrected diagnostic item metadata and numeric-verification logic.
- Production build and automated checks: record final results in STATUS.md.
- README, question review sheet and three-minute narration.
- Canva deck: https://canva.link/7tycreof0v38lbz (apply the factual corrections in DEMO-SCRIPT.md before submission).

## Requires the builder
- Review QUESTION-REVIEW.md and explicitly approve the specific item IDs. Do not mark them approved based only on automated checks.
- Configure live model credentials if demonstrating AI; otherwise describe the integration as implemented but unverified live.
- Provide/choose the hosting project and public repository if the event requires public links. No repository was initialized or published automatically.
- Record or review the demo video, export the final PPT/PDF, and submit through the event portal.
- Any learner quote or testing claim must come from a real observation. None is fabricated in these materials.

## Local checks
From `app/`: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.
With the server running: `node scripts/ui-smoke.mjs`.

## Remaining product limits
- Draft content is intentionally blocked in production.
- One A/B1/B2 variant per concept; exhausted roles stop rather than repeat. Sustained revision needs a larger independently reviewed pool.
- The separate practice bank is sparse and should not be described as a complete JEE question bank.
- Live Cline orchestration and Telegram delivery have not been verified in this handoff.
- No hosted deployment, real learner study, or verified long-term learning gain is claimed.
