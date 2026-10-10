# EXECUTION PLAN — final push
**Written 16:30, 10 Oct 2026. Deadline 20:00. Code freeze target 19:15.**

> The only work order from here to submission. `idea.md` stays the product spec and is not edited. Anything not listed here is not being built today.
> **Rule while working:** read the Acceptance line of each work package first, and run its Verify block before moving on. A package is not done until Verify prints what the plan says it prints.
> **Freeze rule:** no new features after 19:15. After that, bug fixes and copy edits only.

---

## 0. Fixed decisions (do not relitigate)

| Decision | Locked value |
|---|---|
| Knowledge graph | The 9-node graph in `app/content/graph.ts` (`coordinates, trig, vec_basics, slope, vec_comp, deriv_rate, motion_graphs, kin_1d, projectile`) plus the 10 roadmap nodes in `graph-roadmap.ts`. Use exactly this. |
| Question difficulty | **JEE-level.** Not textbook recall. Items are adapted to JEE Main / Advanced style, self-derived and independently verified. Never copy a paper verbatim; cite the pattern and the year. |
| Item provenance | Every item carries `source: {exam, year, topic, note}` and a `derivation` string showing the working. No fabricated URLs. |
| UI language | **English first** everywhere. The accountability band (streak, due re-checks, nudge copy) is **Hinglish**. Explanations render in the **student's chosen regional language** through a language pack keyed `en/hi/ta/te/bn/mr`. |
| Student-facing AI | The student never chats with a model. AI works behind the app to calibrate the path (`idea.md` §11.0). |
| Primary user | A JEE aspirant (Class 11–12 or dropper). Same graph serves CBSE/state-board students. |
| Accounts | Local demo account + profile system. A working demo account must exist and be shown in the video. |
| Cline | Must appear **in the product** (SDK mentor agent + decision panel) and in the build (commits, session footage, `.clinerules/`). |
| Model provider | One model via the Cline API (`api.cline.bot`, OpenAI-compatible). Gemini free tier only as a fallback. Never switch before the demo. |
| Verdict wording | "suspected contributing gap", "connected to N later topics", "no prerequisite weakness found", "Immediate check passed; retention untested". Never "root cause", "unblocks", "mastered", "weak", "trick-user". |

---

## 1. Where we are (16:30)

**Built and verified by me:**
- `lib/probe.ts`, `lib/engine.ts`, `lib/checks.ts`, `lib/state.ts`: the diagnosis engine. 19 unit tests green.
- `lib/items.ts`, `app/api/item`, `app/api/grade`: server grading with HMAC-signed item instances. Verified live: no answer key or tag reaches the browser; "Pata nahi" never assigns a tag; tampered tokens rejected; unknown nodes rejected.
- `lib/safety.ts`, `lib/guards.ts`: distress gate (Helpline 14416), PII scrub, rate limit, daily cap, access-code gate. 15 tests green.
- `lib/mentor/*`: Cline SDK tools (`get_node`, `get_student_summary`, `propose_probe_order`, `choose_stuck_card`, `compose_repair`), zod-validated, `completesRun` on the three finishing tools. 4 tests green. **Never made a real model call** (no key yet).
- `content/graph.ts` (9 nodes + NCERT links), `graph-review.ts`, `graph-roadmap.ts`. 6 tests green.
- Dev server boots on :3000, home page 200.

**Green right now:** 55 tests / 6 files, `tsc --noEmit` clean, item+grade endpoints correct end-to-end.

**Not built (this is what the next 3.5 hours are for):**
1. **The question bank is thin and too easy.** Item count per node: `coordinates 0, trig 2, vec_basics 2, slope 0, vec_comp 4, deriv_rate 0, motion_graphs 0, kin_1d 2, projectile 2`. Four nodes have zero questions and the UI dead-ends on them. This is the biggest gap and the reason the product does not feel like the goal.
2. **No demo account and no profile system.** `lib/store.ts` is a bare localStorage key with no user notion. No dashboard, no strengths/weaknesses surface.
3. **No decision panel.** The Cline SDK agent is invisible in the product. Without it we lose the "Cline inside the product" bonus.
4. **UI is not English and not legible.** All strings are Hinglish (`lib/copy.ts`). Home is a flat button list with no dashboard, no map preview, no evidence. `globals.css` still has the template's Arial font and a dark-mode block that hides text.
5. No regional-language explanation layer.

---

## 2. Work packages (in order)

### WP0 — Repo safety (5 min)
1. `.env.local` gitignored; `.env.example` committed with empty values.
2. Capture the green baseline so later reds are attributable.

**Verify**
```bash
cd /Users/tejas/Hackathon/Cline/Finals/app
npx tsc --noEmit && npx vitest run 2>&1 | grep -E 'Test Files|Tests '
grep -RIn "sk-\|api_key=[A-Za-z0-9]" . --exclude-dir=node_modules --exclude-dir=.next || echo "no secret literal in repo"
```
Expected: `Test Files 6 passed`, `Tests 55 passed`, `no secret literal in repo`.

### WP1 — Bug fixes + audit trail (30 min)

| # | File | Defect | Fix |
|---|---|---|---|
| 1 | `lib/state.ts` | `load` is dispatched by `store.ts` but missing from the `Event` union, so `tsc` never checks it. | Add `\| { type: "load"; state: StudentState }` and add `tests/state.test.ts` covering every event including `load` and `reset`. |
| 2 | `content/items.draft.ts` / `lib/items.ts` | With `approvedItems()` empty the app dead-ends on every node. | Keep the approval gate, but `findItem` falls back to an explicit **"not yet approved" placeholder** so the demo never hard-fails. |
| 3 | `components/Question.tsx` | `onUnavailable` is a dead end. | Route to the placeholder item instead. |
| 4 | `lib/copy.ts` | The `you()`/`verb` helper produces mismatches in several strings. | Collapse to plain English strings; Hinglish lives only in the accountability band. |
| 5 | `app/globals.css` | Template leftovers: `font-family: Arial`, `:root` colours, and a `prefers-color-scheme: dark` block that inverts text while component classes assume light. **This is the "nothing is visible" report.** | Rewrite as one light theme with `--ink`/`--paper`/`--muted` tokens and `font-family: Inter, system-ui`; **delete** the dark-mode media query. |
| 6 | `components/App.tsx` | The graded answer is reduced twice per answer. | Reduce once, derive the next screen from that result. |
| 7 | `lib/importer.ts` | The `LIVE` node set is hard-coded and will drift. | Derive from `LIVE_NODES` in `content/graph.ts`. |
| 8 | `app/layout.tsx` | Title says "working title". | Set the final name (WP6). |

**Verify**
```bash
npx tsc --noEmit && npx vitest run 2>&1 | grep -E 'Test Files|Tests '
```
Expected: `Test Files 7 passed`, `Tests 61+ passed`.

---

## 3. WP2 — The question bank (60 min). THE most important package.

**Acceptance: every one of the 9 live nodes has at least 3 JEE-level items, each with a source and a written derivation, and every answer independently re-derived.**

### 3.1 Provenance and honesty rules (binding)
1. **No verbatim copying** of any exam paper's question text. Adapt the *pattern* and numbers; cite `exam, year, topic`.
2. **No fabricated answer keys.** The answer is re-derived here and stored in `derivation`. If a public official key exists it is noted in `source.note`; if not, `source.note` reads "answer self-derived".
3. **Independent verification is mandatory.** A second solver (a separate Cline SDK agent with no access to the answer key) solves each item. Any disagreement flags the item and it is not served.
4. **JEE-level means** at least two concepts in one item, or a reasoning step beyond direct formula substitution.
5. `approved: false` on everything until the builder flips it. `approvedBy` is required.

### 3.2 Item shape (extend `Item` in `content/items.draft.ts`)
```ts
source:   { exam: "JEE Main" | "JEE Advanced" | "CBSE" | "derived", year: number, topic: string, note?: string }
derivation: string        // the working; PPT/README evidence, never shown to the student
level: "L1" | "L2" | "L3"  // matches graph level
```

### 3.3 Worked answers already verified (these seed the bank)

**Projectile — apex gravity change (2022 JEE Advanced pattern).**
Range $d=v^2\sin2\theta/g$. At the apex the horizontal distance is $d/2$ and the fall takes $T/2=v\sin\theta/g$ from $h=v^2\sin^2\theta/2g$. With $g'=g/0.81$ the fall time becomes $0.9T$, so the second half of the range is $0.9(d/2)$ and $d'=0.95d$.
**Answer $n=0.95$.** Verified numerically.

**Ball + stone collision (2024 JEE Advanced pattern).**
Equal heights at impact force $v_1\cos\theta_1=v_0\sin\theta_0$. Closing speed is $v_0\sin(\theta_0+\theta_1)/\cos\theta_1$, giving $T=L\cos\theta_1/(v_0\sin(\theta_0+\theta_1))$. With $L=2$, $v_0=10$: $T_1=0.1414$ s at $(45°,45°)$, $T_2=0.1000$ s at $(60°,30°)$.
**Answer $(T_1/T_2)^2=2.00$.** Verified numerically.

**Apex split (2021 JEE Advanced pattern).**
$45°$ from vertical at $5\sqrt2$ m/s gives $v_x=v_y=5$ m/s. Apex is $1.25$ m at $x=2.5$ m in $0.5$ s. One half drops vertically in exactly $0.5$ s; momentum gives the other half $10$ m/s horizontal, so it lands at $x=2.5+10(0.5)$.
**Answers $t=0.50$ s, $x=7.50$ m.** Verified numerically.

**Vector magnitude ratio (2018 JEE Advanced pattern).**
$|A+B|=\sqrt3|A-B|$ with $A=a\hat i$, $B=a(\cos\omega t\,\hat i+\sin\omega t\,\hat j)$, $\omega=\pi/6$. Expanding gives $2a^2(1+\cos\omega t)=6a^2(1-\cos\omega t)$, so $\cos\omega t=1/2$, $\omega t=\pi/3$.
**Answer $\tau=2$ s.** Verified numerically.

**Acceleration components on $y=x^2/2$ (2020 JEE Advanced pattern).**
$\dot y=x\dot x$, $\ddot y=\dot x^2+x\ddot x$. At the origin $\dot x=1$, so $a_y=1$ for any $a_x$; with $a_x=0$, $a_y=1$ always; initial velocity is along $x$; at $t=1$ s the velocity angle is $45°$.
**Answer: A, B, C, D all true.** Verified symbolically.

**Elevator weight variation (2025 JEE Advanced pattern).**
$y=8[1+\sin(2\pi t/T)]$, $T=40\pi$ s gives $\omega=0.05$ rad/s, $|a|_{max}=8\omega^2=0.02$ m/s². Weight varies by $2m|a|_{max}$ for $m=50$ kg.
**Answer 2 N.** Verified numerically.

### 3.4 Coverage plan (minimum 3 items per node)
| Node | Must include at least one item that tests |
|---|---|
| `coordinates` | Reading a point under a rotated or shifted axis; sign errors |
| `trig` | Complementary angles; the sine/cosine swap in a rotated triangle |
| `vec_basics` | Resultant of two vectors at an angle; subtraction vs addition |
| `slope` | Slope from a graph with unequal axis scales; sign of slope |
| `vec_comp` | Angle measured from the vertical; component sign in a quadrant |
| `deriv_rate` | Instantaneous vs average rate; derivative at a point on a graph |
| `motion_graphs` | Area under a v-t graph; slope of x-t vs v-t |
| `kin_1d` | Sign convention; distance vs displacement; variable acceleration |
| `projectile` | Apex condition; same-height range formula misuse |

**Verify**
```bash
node -e 'const b=require("fs").readFileSync("content/items.draft.ts","utf8")+require("fs").readFileSync("content/items.draft2.ts","utf8"); for (const n of ["coordinates","trig","vec_basics","slope","vec_comp","deriv_rate","motion_graphs","kin_1d","projectile"]) console.log(n, (b.match(new RegExp("node: \\""+n+"\\"","g"))||[]).length)'
```
Expected: every node prints **at least 3**.

### 3.5 Contrast coverage (what `CONTRASTS` must contain)
Each distractor tag used in the bank must have a contrast line. The following tags are referenced by `graph-review.ts` and must all be covered:
`coordinate_order_swapped`, `axis_tick_value_ignored`, `opposite_adjacent_swapped`, `complementary_angle_ignored`, `vector_equals_magnitude`, `magnitudes_always_add`, `slope_equals_height`, `axis_scale_ignored`, `x_always_cos`, `component_sign_ignored`, `average_equals_instantaneous`, `value_equals_rate`, `graph_height_equals_velocity`, `area_equals_distance_always`, `constant_acceleration_assumed`, `distance_equals_displacement`, `same_height_formula_unconditional`, `zero_velocity_at_apex`.

**Verify**
```bash
npx vitest run tests/copy.test.ts 2>&1 | grep -E 'Tests|contrast'
```
Expected: the "every contrast referenced by a distractor tag exists" test passes with an empty `missing` list.

---

## 4. WP3 — Demo account + profile system (40 min)

**Acceptance: the app opens on a real profile screen, a demo account exists with seeded history, and the strengths/weaknesses view is populated from real state.**

### 4.1 Data model (new `lib/profiles.ts`)
```ts
type Profile = {
  id: string;               // "demo" | uuid
  displayName: string;      // "Aarav (demo)" | "You"
  classLabel: string;       // "Class 12", "Dropper"
  targetExam: string;       // "JEE Main 2027"
  language: "en" | "hi" | "ta" | "te" | "bn" | "mr";
  register: "aap" | "tum" | "tu";
  mentor: "bhaiya" | "didi";
  isDemo: boolean;          // true for the seeded account
  createdAt: number;
  state: StudentState;      // the full engine state, scoped per profile
};
type ProfileStore = { activeId: string; profiles: Record<string, Profile> };
```
- Persist under one localStorage key `kadi.profiles.v1`. The existing `useStudent` hook becomes `useProfile` and reads/writes `profiles[activeId].state`.
- `isDemo: true` marks all seeded data. Every screen that shows demo history must show the badge **"simulated data"**.

### 4.2 Seed the demo account (`lib/seed.ts`)
Build a 6-week history by replaying real engine events, not by hand-writing state. Run the reducer over a fixed event list so the seed is reproducible and exercises the same code paths:
- 4 sessions on `projectile` and `kin_1d` that end in `suspected_gap` with `vec_comp`, then two repairs that pass and set `checked_immediate`.
- 1 session that ends in `no_prereq_weakness` so the honest outcome is visible in the video.
- 2 re-checks: one pass (→ `retained`), one fail (→ `context_difficulty`), so both branches are visible.
- Calibration counts that are believable: 70–80% of "Pakka" answers correct.

### 4.3 Screens
1. **Profile picker** (new first screen): list profiles, "Use demo account", "Start fresh". One tap to enter.
2. **Profile card** on Today: name, class, target, current streak, "This week: N checks, M pass".
3. **Strengths & weaknesses** (new section on Today or a tab): per-node state from the engine, plus 2–3 evidence-backed observations computed from real logs (e.g. "correct on 6 of 8 standard questions, but 3 of 4 changed-context questions", "2 of 12 answers were 'Guess' and both were wrong"). No trait labels, no career verdicts.

**Verify**
```bash
npx tsc --noEmit && npx vitest run 2>&1 | grep -E 'Test Files|Tests '
```
Expected: a new `tests/seed.test.ts` passes and asserts the seed produces `checked_immediate`, `retained`, `context_difficulty` and one `no_prereq_weakness` session.

---

## 5. WP4 — Language: English first, Hinglish accountability, regional explanations (35 min)

**Acceptance: every student-facing string is English by default; the accountability band is Hinglish; the explanation drawer renders in the chosen regional language and degrades to English.**

### 5.1 Copy structure (rewrite `lib/copy.ts` as `lib/copy.ts` + `lib/copy.hi.ts`)
```ts
type Lang = "en" | "hi" | "ta" | "te" | "bn" | "mr";
type CopyKey = keyof typeof EN;                     // EN is the source of truth
const PACKS: Partial<Record<Lang, Partial<Record<CopyKey, string>>>> = { hi: HI };
export function t(lang: Lang, key: CopyKey): string { return PACKS[lang]?.[key] ?? EN[key]; }
```
- `EN` holds every string in English. `CopyKey` is a fixed union, so `tsc` catches a missing key.
- **Accountability band is Hinglish by design** and is *not* translated to English: streak line, "aaj ka check", re-check nudge, weekly recap. These keys are flagged `hinglishOnly: true` and are served regardless of `lang`.
- `hi` ships complete. `ta/te/bn/mr` ship with the 20 highest-traffic keys (outcome titles, button labels, state labels, error strings) and fall back to English for the rest. Never show a blank string.

### 5.2 Explanation drawer (new component `components/Explain.tsx`)
- Every concept state and every misconception contrast gets a one-tap "Explain this in my language" control.
- Content lives in `content/explain.ts`, keyed `nodeId`/`tagId` → `{ en, hi, ta, te, bn, mr }`. The AI-generated explanation is produced once at build time by the mentor pipeline and stored as static text; **no model call at runtime for explanations.**
- The drawer is 3–5 sentences, plain language, and always ends with the one-line contrast ("rule X works when..., not when...").
- If a translation is missing, the drawer says "Explanation not yet translated — showing English" and shows the English text. Never a blank.

**Verify**
```bash
npx vitest run tests/copy.test.ts 2>&1 | grep -E 'Tests'
node -e 'const {EN}=require("fs")&&{}'  # replaced by a real test:
npx vitest run tests/lang.test.ts 2>&1 | grep -E 'Tests'
```
Expected: `tests/lang.test.ts` asserts (a) every `CopyKey` has an English string, (b) no English string contains Hindi script, (c) every `hinglishOnly` key is present in every pack, (d) every node and every contrast tag has an `explain.ts` entry in `en` and `hi`.

---

## 6. WP5 — UI: legible, English, dashboard-first (50 min)

**Acceptance: home reads as a dashboard, not a button list. Nothing is clipped. The map preview is visible without scrolling on a phone.**

### 6.1 Root cause of "nothing is visible"
`app/globals.css` carries the Next template's `:root { --background:#fff }`, a `prefers-color-scheme: dark` block, and `body { font-family: Arial }`. Component classes assume a light background, so in dark mode the text inverts on a dark surface and vanishes. WP1 fix #5 removes it. Do that first, then style.

### 6.2 Design tokens (`app/globals.css`)
```
--paper:#F7F5F0;  --ink:#141821;  --muted:#5B6472;
--accent:#0F766E; --accent-ink:#0B4F49; --warn:#B45309; --ok:#15803D; --bad:#B91C1C;
--radius:14px; --ring:1px solid rgba(20,24,33,0.12)
```
Font: `Inter, system-ui`. Body max width `480px` centred with `padding: 16px`. Every card: `background: var(--paper)`, `border-radius: var(--radius)`, `border: var(--ring)`. Minimum tap target 44px.

### 6.3 Screen inventory (rewrite `components/Shell.tsx`, `components/Today.tsx`)
1. **Today (dashboard):** greeting line ("Good evening, Aarav") → **state strip** (Foundations / Vectors / Calculus / Mechanics with a coloured dot and "3 solid, 1 fragile, 1 gap") → **Today's plan card** (one primary action + time estimate) → **accountability band** (Hinglish: streak, "aaj ka check", weekly recap) → **strengths/weaknesses card** (2–3 evidence lines) → map preview → secondary links.
2. **Postmortem:** question card with `Rich` (KaTeX) + 4 options + "Pata nahi" + confidence tap. Progress "Question 2 of 6". "Later" exit top-right.
3. **Outcome:** the honest verdict with the "this doesn't explain my mistake" button and the "no weakness found" path.
4. **Repair:** contrast → "Check now" primary → "Read instead" (NCERT, with size) → optional video.
5. **Map:** focused path default, full map behind a toggle; nodes are 44px rows with state icon + colour.
6. **Profile / Settings:** account, language, register, mentor, low-data, export/import, delete.
7. **Under the hood (judge view, hidden behind a long-press or `?trace=1`):** the decision panel (WP6).

### 6.4 Responsive rules
- One column at all widths. The bug "everything is cut off" is caused by `max-w-xl` inside a `flex` parent without `min-w-0`. Set `min-w-0` on all flex children and `overflow-x: hidden` on `body`.
- KaTeX blocks get `overflow-x: auto` so long equations scroll instead of clipping.
- Test at 320px, 390px and 1280px.

**Verify**
```bash
npx tsc --noEmit && npm run build 2>&1 | tail -5
```
Expected: build completes with no errors. Then screenshot the running app at 320px and 1280px and confirm no clipped text.

---

## 7. WP6 — Cline inside the product: the decision panel (30 min)

**Acceptance: a judge can open the app and *see* the Cline SDK agent making a decision, with tool calls and their consequences visible. This is the bonus-points work.**

### 7.1 The visible surface (new `components/DecisionPanel.tsx`)
Toggled by `?trace=1` or a long-press on the state strip. Shows, per session:
- **Header:** "Cline SDK agent · model <id> · mode <calibration>".
- **Tool trace table:** `time | tool | input (truncated) | consequence`. Consequence is one of `accepted`, `rejected_by_validation`, `fallback`, with a reason. Example row: `0.4s | propose_probe_order | projectile → [vec_comp, kin_1d] | accepted: engine reordered prerequisites`.
- **Counterfactual line:** "If the agent had been unavailable, the default order would have been [kin_1d, vec_comp]." This must come from real state, not be invented.
- **Usage line:** tokens in/out and estimated cost, from the SDK's `usage` events.

### 7.2 Wiring
- `lib/mentor/run.ts` already returns `trace` and `usage`. Extend `MentorResult` with `defaultOrder` so the counterfactual is real.
- `app/api/mentor` returns the whole `MentorResult`; the client stores it on `StudentState.session.trace`.
- **Every trace row must be produced by real events.** Never fabricate rows to make the panel look busy. "Agent not configured — deterministic default used" is an honest and acceptable state.

### 7.3 The pipeline story (PPT + README)
`npm run pipeline` runs two independent Cline SDK agents (writer + blind solver) offline. If it is not finished by 18:30, describe it as the build-time tool that produced the bank and quote only the counts you have actually run. Never claim numbers you have not counted.

**Verify**
```bash
curl -s -X POST localhost:3000/api/mentor -H 'Content-Type: application/json' \
  -d '{"accessCode":"<ACCESS_CODE>","adultConfirmed":true,"job":"probe_order","node":"projectile","tone":{"mentor":"bhaiya","register":"tum","language":"hinglish"}}' | head -c 400
```
Expected: JSON with `ok`, `value` (or `consequence:"fallback"`), `trace`, `usage`. With no key set, `consequence` must be `"fallback"` and the app must still work.

---

## 8. WP7 — QA (40 min, 19:25–19:45)

**Acceptance: 3 consecutive clean runs of the full journey on a phone-sized browser, including one "no weakness found" run and one "suspected gap" run.**

### 8.1 Automated
```bash
cd /Users/tejas/Hackathon/Cline/Finals/app
npx tsc --noEmit && npx vitest run && npm run build
```
Gate: zero type errors, all tests green, build succeeds.

### 8.2 Manual journey checklist (390px viewport)
- [ ] Profile picker → demo account opens with the "simulated data" badge visible.
- [ ] Postmortem on `projectile`: twist wrong + standard right → `context_difficulty` on `projectile`, then `vec_comp` probed → `suspected_gap` on `vec_comp`, with `kin_1d` listed as "not checked".
- [ ] Repair: contrast → "check now" → R and B2 → "Immediate check passed; retention untested".
- [ ] Simulate +1 day → re-check appears on Today → pass → node becomes `retained` with "+7 days".
- [ ] Chapter picker → `kin_1d` → both probes pass → **"no prerequisite weakness found"** → "Where did you get stuck?" → copyable summary.
- [ ] "This doesn't explain my mistake" on the outcome screen works and does not throw.
- [ ] Language switch to `hi` changes the explanation drawer; the accountability band stays Hinglish.
- [ ] Low-data toggle hides video options.
- [ ] `?trace=1` shows the decision panel with real tool rows (or the honest "not configured" state).
- [ ] No clipped text at 320px.
- [ ] A distress keyword in the attempt box returns the helpline message and does not call the model.

### 8.3 Error paths
- [ ] Network cut mid-question → retry message appears and progress is preserved.
- [ ] Tampered progress file → rejected with the friendly message.
- [ ] `/api/item` for a node with no approved items → the placeholder item, never a blank screen.

---

## 9. WP8 — Deliverables (19:45–20:00)

| Deliverable | Owner | Content |
|---|---|---|
| `README.md` | Cline | Problem (4 lines), the insight (JEE-fication), what the product does, text architecture diagram, stack, setup (`npm i`, `npm test`, `npm run dev`, env vars), **How Cline was used** (build + SDK agent + pipeline, real counts), limitations, privacy/safety position, provider-terms note. |
| PPT | Cline drafts, builder presents | Problem → insight → the honest verdict (3 outcomes) → demo → architecture → Cline in the product (decision panel screenshot) → evidence (test counts, pipeline counts) → provider-terms decision → what's next. |
| Demo video | Builder records; Cline supplies the script | See 9.1. |
| Social post | Builder | One paragraph + repo link + tag Cline. |

### 9.1 Demo video script (3 min)
1. **(20s)** Hook on the dashboard: strengths card and the honest "no weakness found" line.
2. **(70s)** Postmortem on `projectile` → suspected gap at `vec_comp` → map lights up → fix card → check passes → "Immediate check passed; retention untested".
3. **(30s)** Simulate +1 day → re-check → pass → `retained`. Then the explanation drawer switching to Hindi.
4. **(25s)** `?trace=1` → the Cline SDK decision panel with real tool rows.
5. **(15s)** What's next: career lens, study buddy, more chapters.

### 9.2 Final checks before submission
```bash
cd /Users/tejas/Hackathon/Cline/Finals/app
grep -RIn "sk-ant\|sk-proj\|AIza" . --exclude-dir=node_modules --exclude-dir=.next || echo "clean"
git status --short | head
```
Expected: `clean`, and no `.env.local` listed in `git status`.

---

## 10. Time budget (16:30 → 20:00)

| Window | Package | Buffer |
|---|---|---|
| 16:30–17:00 | WP1 bug fixes | 5 min |
| 17:00–18:00 | WP2 question bank | 10 min |
| 18:00–18:25 | WP3 demo account + profile | 5 min |
| 18:25–18:45 | WP4 language | — |
| 18:45–19:10 | WP5 UI | — |
| 19:10–19:25 | WP6 decision panel | — |
| 19:25–19:45 | WP7 QA | — |
| 19:45–20:00 | WP8 deliverables + submit | — |

**Cut order if behind:** WP6 → WP4 (ship English only) → WP3 (ship one profile) → WP2's third item per node. **Never cut WP1, WP5 or WP7.** A legible app with 3 verified questions per node beats a rich app nobody can read.

---

## 11. Open items for the builder (human decisions, not code)
1. **Model key:** `CLINE_API_KEY`, `MENTOR_MODEL`, `ACCESS_CODE` in `app/.env.local`. WP6 degrades gracefully without them, but the panel will say "not configured".
2. **18+ real-user tester** for the WP7 manual run. Provider terms require it.
3. **Approve every question** (`approved: true` + `approvedBy`). Until then items are served in dev via `SERVE_UNAPPROVED=true` and blocked in production.
4. **Final name** (WP1 #8).
5. **Confirm the helpline number** (Tele-MANAS 14416) before the video.
