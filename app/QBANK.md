# Question bank (official JEE sources, A/B/C levels)

Finds questions from official JEE papers, assigns each to a map node and an A/B/C level, and serves a
question the student has not seen before.

## Flow

```
jeeadv.ac.in/archive.html  --discover links-->  PDFs  --text-->  2-page chunks
   chunk --(Cline agent 1: extract)--> candidate MCQs
   candidate --code checks--> anchor must occur in the official text, no duplicates, 4 distinct options
   candidate --(Cline agent 2, twice, BLIND)--> both must match agent 1's answer  => "verified"
   level = code rubric from (#concepts, #steps)   (agent's own label is only audited)
   status:  needs_review  ->  verified  ->  approved (ONLY a human: `approve <id> <name>`)
```

## Commands (run from `app/`)

```
npx tsx scripts/qbank.mts harvest 4 2022   # 4 unprocessed chunks, papers from 2022 on
npx tsx scripts/qbank.mts coverage         # questions per node and level
npx tsx scripts/qbank.mts review           # what is waiting for you
npx tsx scripts/qbank.mts approve <id> <your-name>
```

Needs `CLINE_API_KEY` and `MENTOR_MODEL` in `.env.local` (same as the mentor agent).
Output is `content/qbank.json`.

## Levels (code-enforced, `lib/qbank/level.ts`)

- **A**: one concept, at most 2 steps.
- **C**: two or more concepts AND at least 4 steps.
- **B**: everything else.

## "New every time"

- `POST /api/qbank {node, level, seen: [ids]}` never returns an id in `seen`. When the pool is used up it returns
  `404 pool_exhausted` instead of repeating. The client must keep the `seen` list per student.
- `harvest` records each processed chunk and never re-reads it, and picks chunks in random order,
  so every run adds different questions.

## Limits (be honest with students and judges)

- Only **text-layer PDFs** work. Older JEE Advanced papers (e.g. 2019) are scans and are skipped and reported.
  OCR is not built.
- Only the **JEE Advanced archive** is wired in. NTA JEE Main papers are allow-listed but have no discovery code yet.
- PDF maths extraction is lossy (fractions, roots, subscripts). The agent re-transcribes from garbled text,
  which is why every item needs human review. Questions needing diagrams are skipped by instruction, not detected.
- **Answers are AI-derived, not taken from the official key.** Two agreeing blind solves is evidence, not proof.
  Every item carries the flag "official key not cross-checked".
- Only integer/MCQ with 4 options, single correct. Multi-correct and numerical-answer questions are skipped.
- Only the 9 map nodes are covered. Many JEE questions will not fit and are dropped.
- Nothing is served in production until a human approves it. With `SERVE_UNAPPROVED=true` (dev only), `verified` items are served.
- The bank is **not yet wired into the student UI**; the API and the data exist.
- The live agent calls have never been run (no API key in this workspace). Tests use fake agents.
