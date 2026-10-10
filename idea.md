# idea.md: FINAL v3 (locked 3:15pm, 10 Oct 2026)

> **Working title:** TBD. Name and headline are picked at the end, by decision.
> **Event:** Cline AI Builder Hackathon, Round 2. **Deadline 8:00pm. Time left at lock: about 4h45m.**
> **Team:** 1 builder (non-developer, verifies JEE physics/maths) + Cline (writes all code).
> **Rule:** single source of truth. Not here = not built. Archives: `docs/idea_v1_archive.md`, `docs/idea_v2_archive.md`.
> **Inputs merged:** all mentor rounds; panel round 1 (11 personas); **panel round 2 (11 personas)**; provider terms checked on 10 Oct. Decisions logged in section 23.

---

## 0. Reality check

| Fact | Consequence |
|---|---|
| About 4h45m left. Builder cannot code. | **9 live nodes**, one demo path, freeze **6:00pm**. |
| Official rubric (from the Round 2 PS PDF): creativity & uniqueness; innovation; real-world usefulness; effective use of Cline; product usability & execution; technical implementation. **Bonus: Cline used inside the product.** | Cline SDK agent in the product (section 11) + Cline SDK content pipeline (section 12) + Cline for the whole build (12.2). |
| **Provider terms (checked):** Gemini API Additional Terms say users must be 18+ and the API must not be used in an app "directed towards or likely to be accessed by individuals under the age of 18". Cline's ToS says use of the Service by minors (under 18 in most jurisdictions) is prohibited. Anthropic's Usage Policy requires AI disclosure to users and extra guidelines for products serving minors. | **Gemini is dropped entirely.** Live AI is **not cleared for minors**. The hackathon build is a **controlled demonstration** (section 15): deterministic no-AI mode by default for everyone; the live Cline SDK agent is behind an access code and used only by adults (builder, judges, an 18+ tester). Whether an app built on the Cline API may serve minors is **unverified** and listed as open. |
| PS: "a working product a real person could use tomorrow". | The deterministic mode is fully usable by anyone tomorrow; AI mode is the controlled layer. Anything seeded is labelled **"simulated"**. |
| Two panels agreed: correctness > coverage. | Only **builder-approved** content goes live. No "beta / AI-verified" items. |

---

## 1. The problem

A JEE student gets a question wrong and concludes "I'm bad at physics." Sometimes the cause is an older, shaky concept (vector components, trig, slope as rate) that nobody noticed. **Sometimes it is not**: the student knows every prerequisite but chose the wrong model, failed to combine ideas, or misread a condition.

- Coaching teachers have hundreds of students and cannot see one student's reasoning.
- Students are embarrassed to ask.
- Exams say *that* you failed, never *why*.
- **"JEE-fication":** shortcuts let students answer standard forms correctly. A shortcut is not bad in itself (experts use them); the risk is **not knowing when it applies**.
- **Students don't know their own strengths and weaknesses.** Marks say how much, never which concept or why. Without an honest picture of themselves, they can't choose where to spend their next hour.
- **Too much clutter online.** Thousands of videos, channels and notes for every topic. The student's problem isn't access, it's knowing *which* few minutes they need.
- **Zero accountability.** Nothing checks whether anything was understood or whether it stuck, until the exam. There is no one to answer to between a lecture and a result.
- **Everything feels like war.** Ranks, percentiles, leaderboards, comparison with the topper. A student under that pressure hides what they don't know. A mentor that never ranks or compares, and says "this didn't explain your mistake" without judgement, is the opposite.

**Primary user:** a JEE/board aspirant who already has teachers and content and has no one who looks at *their* reasoning.
**Test participant for this build:** an **18+** JEE aspirant (dropper) or first-year college student re-living a JEE problem (section 15).

---

## 2. The product in one line

**A bhaiya/didi that looks at a question you got wrong, checks whether an older concept is behind it, tells you honestly when it is not, points you to the right NCERT section or teacher, and checks the fix.**

A **diagnosis and routing layer on top of NCERT, PW, Allen and YouTube**. It does not teach and does not replace teachers. *Cline coordinates tools to finish a job; this coordinates teachers to fix a student.*

### Design commitments (from panel round 2)
1. **It must tolerate finding no foundational gap.** "No prerequisite weakness found; your original mistake is still unresolved" is a valid, honest outcome, followed by "where did you get stuck?".
2. **It revises its hypothesis.** The student can say "this doesn't explain my mistake", and the mentor changes course instead of insisting.
3. **Correct grading is not correct diagnosis.** We say "**suspected** contributing gap", never "exact root cause".
4. **Shortcuts are not accused.** We test whether the student knows **when** a rule applies.
5. **Immediate success is not retention.** "Immediate check passed; retention untested."

### It is NOT
A tutor, a content platform, a leaderboard, a score or rank app, a career-verdict engine, a learning-styles product, or anything that involves parents.

---

## 3. Honest positioning

| Challenger | Honest answer |
|---|---|
| **ChatGPT / GPT-7** | A chatbot can run one good diagnostic chat. It does not hold a **builder-reviewed JEE prerequisite graph**, **code-graded items with an explicit evidence policy**, **per-concept history with spaced re-checks**, or a **no-AI deterministic mode** that works without any model. |
| **Brainly / Doubtnut / PW AI** | They answer the question you asked. We check what sits underneath it, and say so honestly when nothing does. |
| **ALEKS / Khanmigo / Embibe / Squirrel AI** | The knowledge-graph idea is **not ours** (Knowledge Space Theory). *Unverified: Embibe's JEE diagnosis depth; check before any novelty slide.* We never say "nobody has done this." |
| **"PW could build this"** | True. Our stance is neutrality (route to whoever helps, NCERT first). The value proposition is **unvalidated**; the next step is observing real users, not monetising. |

### What is genuinely ours
1. **Changed-context checks:** "does your method still work when the question changes?", plus a reasoning item that asks *when* the rule applies.
2. **Honest outcomes:** suspected gap / no prerequisite weakness found / inconclusive / out of scope, with the student able to dispute.
3. **Router, not teacher:** NCERT first, a teacher the student prefers, read-instead always available.
4. **A Cline SDK agent in the product with visible tool actions and their consequences**, plus a Cline SDK writer/solver pipeline that built the question bank.

---

## 4. Knowledge scope: 9 live-scope nodes, approval required before serving

### 4.1 Live nodes
| ID | Node | Level | Keystone | Entry point (chapter picker) |
|---|---|---|---|---|
| `coordinates` | Coordinates and axes (ordered pairs, origin, directions, scales) | L0 | Yes | |
| `trig` | Trigonometric ratios (standard angles) | L1 | Yes | |
| `vec_basics` | Vector basics (magnitude, direction, addition) | L1 | Yes | |
| `slope` | Slope of a line / graph | L1 | Yes | |
| `vec_comp` | Vector components (resolution) | L2 | Yes | Yes ("Vectors") |
| `deriv_rate` | Derivative as rate of change | L2 | Yes | |
| `motion_graphs` | Motion graphs (x-t, v-t) | L2 | | Yes |
| `kin_1d` | 1D kinematics (equations of motion) | L3 | | Yes |
| `projectile` | Projectile motion | L3 | | Yes |

**Edges (prerequisite -> dependent):** `coordinates -> slope`, `trig -> vec_comp`, `vec_basics -> vec_comp`, `vec_comp -> projectile`, `kin_1d -> projectile`, `slope -> deriv_rate`, `slope -> motion_graphs`, `deriv_rate -> motion_graphs`, `motion_graphs -> kin_1d`. The builder confirms these at 3:15 and records the suspect order for each node (which prerequisite to check first).

**Demo path:** `projectile -> vec_comp -> (trig, vec_basics)`.

**Graph amendment (user requested):** Coordinates and axes is now a live-scope L0 foundation immediately before slope. It covers ordered pairs, origin, axis labels, positive directions and tick scales; it does not test slope. Its A/B1/B2 items and repair must be builder-approved before it is served. The projectile demo path and six-probe budget are unchanged.

### 4.2 "Coming next" (greyed out, never diagnosed)
Ratios, linear equations, relative motion, dot product, Newton's laws, friction, work-energy, circular motion, integration basics, 3D vectors. They exist only to show connections. The map labels them "coming next".

### 4.3 Coverage floor (honest exit)
If the evidence points **below** the lowest supported foundation (L0 coordinates on the slope branch; L1 on the trig/vector branch) (all keystones show a gap), the mentor says so plainly: "Ye map ke sabse neeche wale topic se bhi pehle ka lagta hai. Yahan se shuru karo:" (this seems to come from before the lowest topic in my map; start here), with a **builder-verified NCERT reference** (book, chapter, section). No invented diagnosis below the map.

### 4.4 Wording
- "Connected to **N** later topics" (N computed from the graph, including "coming next"). Never "unblocks" or "fixing this will fix N topics".
- Levels are data only; the student never sees "Level N".

---

## 5. Evidence policy (ONE policy: engine, copy, question bank and demo all follow it)

### 5.1 Question bank per live node
| Item | Purpose | Nodes | Count |
|---|---|---|---|
| **A: Standard** | The usual form | all 9 | 9 |
| **B1: Changed-context probe** | Same concept, surface changed so a rule applied outside its valid range fails. Wrong options carry a **candidate** misconception tag (a hint, not proof of reasoning) | all 9 | 9 |
| **B2: Repair check** | A **different** changed-context item, never used as a probe, so the check is independent | all 9 | 9 |
| **R: Reasoning / diagram choice** | "Which diagram / which statement explains *why* / *when* this rule applies?" Tests whether the correction is understanding rather than a new recipe | demo path: `projectile`, `vec_comp`, `trig`, `vec_basics` | 4 |
| **Stuck-point cards** | Short reviewed checklists for setup / calculation / interpretation | `projectile`, `kin_1d`, `motion_graphs`, `vec_comp` | 4 x 3 = 12 short cards |
| **Contrast** | One reviewed line per misconception tag ("rule X works when..., not when...") | per tag | ~16 lines |

**Target: 31 items + 12 cards + ~18 contrasts, each requiring builder approval.** Only approved items are live; anything unapproved is not served at all.

Every item has: `id`, `node`, `type`, `stem` (KaTeX), `options` or numeric spec, server-side answer, `tags`, `ncertRef`, `approvedBy`, `approvedAt`. Numeric items may be parameterised only if the builder approved the answer function.

### 5.2 Every answer screen offers
`option 1-4` (or a number) + **"Pata nahi"** (don't know) + **"Sawal samajh nahi aaya"** (don't understand the wording) + a confidence tap **Pakka / Shayad / Guess**.
- "Pata nahi" = **not correct**, but **never assigns a misconception tag**.
- "Sawal samajh nahi aaya" = the item is **void** (no evidence either way); the engine moves to the other item for that node or skips the node. Logged for content review.
- **Response time is logged for metrics only and is never used in diagnosis** (rejected: "slow + guess + wrong = gap"; reading, notation and interruptions produce the same pattern).

### 5.3 Node probe (deterministic)
```
probe(node):
  B1 correct, confidence Pakka/Shayad    -> no_difficulty_found               (1 item)
  B1 correct, confidence Guess           -> ask A:
        A correct -> no_difficulty_found (low confidence noted)
        A wrong / pata nahi -> gap                                             (2 items)
  B1 wrong or "pata nahi"                -> ask A:
        A correct -> context_difficulty  ("standard form fine, changed form difficult")
        A wrong / pata nahi -> gap                                             (2 items)
  B1 void (wording)                      -> ask A only; A correct -> untested(+note), A wrong -> gap
```
`context_difficulty` is **two observations** (standard right, changed wrong), worded as an observation: "Seedha sawal sahi, badla hua sawal mushkil laga" (the straight question was fine, the changed one was hard). It is **not** called "trick-user" anywhere.

### 5.4 Node state machine (complete transition table)
States: `untested`, `gap`, `context_difficulty`, `no_difficulty_found`, `checked_immediate`, `retained`. Derived flag: `due`.

| From | Event | To | Notes |
|---|---|---|---|
| any non-checked | probe result (5.3) | gap / context_difficulty / no_difficulty_found / untested | Replaces the previous probe result for this session |
| gap / context_difficulty | **repair check passed** (B2 correct **and**, where it exists, R correct) | `checked_immediate` | Copy: "Abhi ka check pass. Yaad rahega ya nahi, kal dekhenge." (Immediate check passed; retention untested.) Schedules re-check +1 day |
| gap / context_difficulty | repair check failed, 1st time | unchanged | Offer the next resource ("doosra tareeka") and one more attempt |
| gap / context_difficulty | repair check failed, 2nd time | unchanged + session outcome `inconclusive` for this node | "Aaj ke liye itna. Ise baad mein phir dekhenge." No third attempt in one session |
| checked_immediate | re-check (B2 or R) passed **at least 1 day later** | `retained` | Next re-check +7 days, then +30 |
| retained | re-check passed | retained | Interval advances 7 -> 30 days |
| checked_immediate / retained | re-check failed | `context_difficulty` | "Pichli baar ho gaya tha, aaj badle sawal pe atka; normal hai" |
| no_difficulty_found | later probe wrong | per 5.3 | Evidence wins over history |
| any | duplicate submission of the same item instance | **ignored** | Idempotent by `instanceId` |
| any | invalid event for current state (e.g. re-check on `untested`) | **ignored + logged** | Engine rejects; never throws |
| any | imported progress | as imported, flagged `selfReported` | Never treated as verified evidence |

**The model can never cause a transition.** Only graded events from the server (with a valid grade receipt, 11.3) move states.

### 5.5 Session outcomes (Mode 1)
| Outcome | When | What the student sees |
|---|---|---|
| `suspected_gap` | The deepest gap/context_difficulty node whose probed prerequisites are all `no_difficulty_found` (or that has none) | "**Suspected** contributing gap: X. X is connected to N later topics." Then the repair flow |
| `no_prereq_weakness` | Entry node and its prerequisites show no difficulty | "Is session mein koi purani kamzori nahi mili. Tumhari asli galti abhi bhi unresolved hai." Then **"Kahan atke?"** (section 6.3) |
| `inconclusive` | Budget exhausted with contradictions, or repair failed twice | "Is session mein pakka nahi keh sakte." Shows what *was* observed + a re-check option |
| `out_of_scope` | Agent intake or student says the topic is not on the map | "Ye abhi mere map ke bahar hai." Chapter picker offered |
| `below_coverage` | All probed keystones show gap | Honest exit with an NCERT reference (4.3) |
| `student_disputed` | Student taps **"Isse meri galti explain nahi hoti"** (this doesn't explain my mistake) at any result | The hypothesis is dropped for this session; "Kahan atke?" flow; logged |

### 5.6 Budget
- **Probe budget: 6 items** per session ("Sawal 2 / max 6", about 3 minutes). Repair items (B2, R) are outside the probe budget and capped at 2 attempts.
- **Demo path fits:** projectile B1 wrong + A right (2), vec_comp B1 wrong + A right (2), trig B1 right (1), vec_basics B1 right (1) = **6**, giving suspected gap `vec_comp`.
- If the budget ends before a conclusion, the outcome is `inconclusive`, never a guess.

### 5.7 Search order
Start at the entry node. If it shows difficulty, probe its prerequisites in the **builder-recorded suspect order** (the agent may suggest re-ordering from the student's attempt text; the engine accepts only valid prerequisite IDs, and the suggestion is shown in the trace). Descend only below nodes that show difficulty. **Depth-first:** fully check the first difficult prerequisite's branch before its siblings. As soon as a node meets the suspected-gap rule (5.5), the session reports it, and any unprobed sibling prerequisites (e.g. `kin_1d` in the demo) are listed as **"abhi check nahi kiya"** (not checked yet) with a one-tap "isse bhi check karo" (check this too) in a later session. This is why the demo path concludes within 6 items without claiming anything about `kin_1d`.

---

## 6. Entry and flows

### 6.1 Start screen (one tap, no fear)
- First line: **"Main ek AI mentor hoon, insaan nahi."** (AI disclosure every session) + a one-line data note (section 15).
- Three big buttons, topic-first given equal weight (panel: low-income student, typing a printed question costs effort):
  1. **"Chapter chuno"** (pick a chapter): Projectile / 1D kinematics / Motion graphs / Vectors / "Pata nahi".
  2. **"Sample sawal try karo"** (try a sample question).
  3. **"Apna sawal paste karo"** (paste your question; max 1,500 characters).
- Small link: **"Kisi aur ka phone? Guest mode"**, a temporary session in `sessionStorage` that never overwrites saved progress and is cleared on close.
- Defaults: bhaiya, "tum", Hinglish. Settings hold the rest.

### 6.2 Mode 1: Question Postmortem (MUST)
1. **Entry.** For pasted text (AI mode only) the agent proposes a node; the student confirms with **"Haan" / "Nahi" / "Pata nahi"**. "Pata nahi" opens the chapter picker with one-line plain descriptions. Never "this is projectile, right?" with no way out. In no-AI mode, paste is replaced by the chapter picker.
2. **Optional attempt.** "Tumne kya try kiya? (optional)" free text, or **"Shuru hi nahi kar paaya"** (couldn't start). We **do not promise to verify the full solution**. The attempt is used only by the agent to suggest which prerequisite to check first (5.7) and which stuck-point card is likely (6.3). "Couldn't start" makes the setup card likely.
3. **Probing.** One item per screen, progress "Sawal 2 / max 6", **"Baad mein"** exit always visible.
4. **Outcome** per 5.5. Every outcome screen has **"Isse meri galti explain nahi hoti"**.
5. **Repair** (for suspected_gap), in this order:
   - **The reviewed contrast first** (2 lines), then **"Abhi check karo"** (attempt the repair check right away) as the primary button. Resources are optional (topper: do not force a video).
   - "Padh ke samjho" (read instead): **exact NCERT reference** (class, chapter, section/page) + a reviewed 3-5 line explanation. Prominent, zero video.
   - "Video dekho": up to 2 curated videos with length, approximate data size and a builder-verified start time. **No autoplay.**
   - **Repair check:** R (why/when) + B2 (apply), or B2 alone where no R exists.
6. **One next action per screen**; alternatives sit under "Aur options" (more options). The full map and the technical trace are secondary.

### 6.3 "Kahan atke?" (where did you get stuck?): for no_prereq_weakness and student_disputed
Options: **Setup** (choosing the model / equations) / **Calculation** / **Sawal ka matlab (interpretation)** / **Pata nahi**.
- Setup / Calculation / Interpretation: show the node's **reviewed stuck-point card** (3-5 checklist lines, e.g. projectile setup: "axes choose karo; velocity ko components mein todo; time dono directions mein same").
- Pata nahi: point to an NCERT worked example (exact reference) and suggest asking a teacher with a **copyable summary**: "Main projectile ke is sawal mein atka. Prerequisites theek lage. Setup samajh nahi aaya." This makes asking a human less embarrassing.
- In AI mode the agent may pick which card to show first from the attempt text (enum-limited).

### 6.4 Today screen (MUST, non-punitive)
- Greeting (agent in AI mode, template otherwise), due re-checks (max 3), and "**Is hafte: N checks kiye**" (this week: N checks done).
- **No streaks** (panel: device availability is not motivation).
- **"Simulate +1 / +7 days"** toggle, labelled "simulated (demo only)", to show re-checks.

### 6.5 Foundation Check (COULD)
B1 of the 5 keystones (5 items), same engine and policy. Output: map + "Pehle X dekhte hain." No score.

---

## 7. Persona: bhaiya/didi (a spec, not a vibe)

| Behaviour | MVP form |
|---|---|
| Discloses it is AI | First line of every session |
| Opens the conversation | Today greeting from real state |
| Never shames, never involves parents | Prompt rule + output banned-word filter ("weak", "fail", "dumb", "bekaar", "trick-user") -> template fallback |
| Revises, does not insist | "Isse meri galti explain nahi hoti" always available; the agent acknowledges and changes course |
| Honest, evidence-cited | Any claim about the student cites a count from this session/history |
| One next step, brief | Max about 40 words; time estimate before each step |

**Tone settings:** bhaiya/didi; **aap / tum / tu** (default tum; "tu" opt-in); Hinglish (default) / English-heavy. No automatic tone mirroring. In no-AI mode, templates exist for every tone.
**Hindi (Devanagari) UI labels:** COULD. Regional languages: slide.

---

## 8. Routing

- **The LLM never produces a URL.** It can only pick resource IDs from an allowlist enum; the UI renders links from `resources.json`. Every resource destination is validated against an allowed-host list (ncert.nic.in, youtube.com/youtu.be) at build time.
- **Order:** contrast -> immediate check -> read instead (NCERT + short reviewed explanation) -> video (max 2, curated, verified start time, no autoplay, size shown).
- **Low-data toggle** hides videos.
- **Preferred teacher (SHOULD):** choose from the curated teachers list in Settings; their video is shown first. Free-text channels and YouTube search are **deferred**.
- **"Samajh aaya?" (yes/thoda/nahi)** after a resource is stored only as **this student's preference** to reorder their own options. **No effectiveness claims and no warnings about teachers** (rejected: conclusions from 5 local attempts). We never claim a resource *caused* improvement.
- Official YouTube links only; no downloads or transcripts.

---

## 9. Revision and accountability

**Accountability = a commitment the student makes, a check that happens, and an honest reply. It is not a score, a streak or a ranking.**

1. **Commit:** after a repair, bhaiya asks "Kab dobara check karein? Kal / 3 din baad / hafte baad?" The student chooses (default tomorrow). It is their own promise.
2. **Check:** at that time the Today screen shows a short re-check (B2 or R item). Nothing nags; it is waiting when they open the app.
3. **Reply, with evidence:** pass -> "Kal wala concept aaj bhi theek hai." Miss -> "Kal ka check chhoot gaya. Koi baat nahi, abhi 2 min mein kar lein?" Never shaming, never involving parents.
4. **Weekly look-back (own record only):** "Is hafte: 3 checks kiye, 2 pass, 1 phir dekhna hai." Compared only with the student's own past.
5. **Why it counts as accountability:** the student has made a dated commitment and a record exists of whether it was kept and whether the learning held. Self-accountability, not surveillance.
6. **Limit (honest):** no external person is notified in MVP. A study-buddy (peer, student-chosen) version is a slide.

- Spaced re-checks at **+1, +7, +30 days** after `checked_immediate` (5.4), using B2/R items.
- **"Meri galtiyan"** (SHOULD): the student's own record (item, their answer, the contrast, NCERT ref). No AI content.
- **Flashcards: deferred** (panel: spend review effort on transfer/reasoning items, not flashcards).

---

## 10. Metrics (minimal, honest)

- **Per session, stored locally:** started, outcome reached (which), step where abandoned, elapsed time, number of items, model calls, **model cost** (from Cline SDK usage events, `usage.totalCost` where reported).
- Shown in "Under the hood" and exportable as JSON. **No server analytics** (privacy).
- **Real-user observation (6:00pm):** one eligible (18+) participant completes the full loop **without coaching**. The builder records completion, time, where they hesitated, and asks: **"Agar ye na hota, toh tum kya karte?"** (what would you have done otherwise?). Reported verbatim, not as efficacy.

---

## 11. Architecture: where the Cline SDK lives

**Principle: code grades and decides; the Cline SDK agent interprets, chooses among allowed options, and talks; the UI shows both and their consequences.**

```
Browser (Next.js, mobile-first)
  |- localStorage: StudentState v1 (zod-validated)   |  sessionStorage: guest session
  |- Engine: pure TS reducer (state, event) -> state, Vitest-tested (5.3-5.7)
  |- Screens: Start, Postmortem, Outcome, Repair, Kahan atke, Today, Map, Settings, Under the hood
        |  HTTPS: minimal context only (see 11.4)
        v
Next.js API routes (Node runtime)
  |- POST /api/item     -> issues an item instance (no answer) + signed instanceToken
  |- POST /api/grade    -> verifies token, grades, returns {correct, tags?, receipt}
  |- POST /api/mentor   -> Cline SDK Agent (jobs: intake | stuck | repair | greeting), AI mode only
  |- guards: access code, rate limit, spend cap, input caps, safety gate, kill switch
  |- content/ (server-only): graph.json, items.json, cards.json, contrasts.json, resources.json
        v
Model: ONE provider via the Cline API (OpenAI-compatible), chosen at G1 and NOT switched afterwards
```

### 11.0 Decision (10 Oct, 3:20pm): the student never talks to an AI
**The student does not get access to an AI chat.** The app uses AI **behind the scenes** to calibrate the learning path (which prerequisite to check first, which stuck-point card, how to order repair options), which is where flexibility and understanding the student come from. The student sees only reviewed content and templates.

- **Consequences:** no free-text prompts reach a model; no model output is shown to the student unfiltered; a harmful conversation cannot happen. AI input is **structured data only** (node IDs, item IDs, right/wrong, confidence, tone setting). **Pasted-question intake is removed from the public product.** Students start from the chapter picker or sample question.
- **Not a full fix:** structured learning data about a student still goes to a model provider, so provider terms about minors still apply. Therefore the AI calibration layer is **off by default**, adult-only for the hackathon (access code), and the product works fully without it (no-AI mode).
- **Slide (future):** partner with a company that provides a **highly restricted, education-only model** with minors-appropriate terms. How we meet safety and regulation is a separate slide, to be written later.
- Where this document describes "paste intake" or the agent "talking" to the student, read it as: **intake is removed; the agent writes only the calibration choices and short messages from reviewed templates.**

### 11.1 Modes
| Mode | Who | What runs |
|---|---|---|
| **No-AI (default, public)** | Anyone | Chapter picker + engine + templates. **No model calls, no text leaves the device except item IDs and chosen options.** Fully usable product. |
| **AI mode** | **Adults only**, behind an `ACCESS_CODE` (builder, judges, 18+ tester), with an 18+ confirmation screen | Adds paste intake, attempt-aware ordering, stuck-card choice, personalised repair framing and greeting via the Cline SDK agent |

This is the controlled demonstration required by the provider terms (section 15). The no-AI mode also answers "what if the model is down?".

### 11.2 The mentor agent (`@cline/sdk`)
- A **new `Agent` per request** (stateless worker pattern from the SDK docs), `maxIterations: 6`, request timeout 10s, template fallback.
- **Tools** (`createTool` + zod), **read-only** except the single completion tool per job:

| Tool | What it does | Consequence shown in UI |
|---|---|---|
| `search_nodes(query)` | Returns candidate live nodes with descriptions | — |
| `get_node(nodeId)` | Node details, prerequisites, suspect order, connected count | — |
| `get_contrast(tag)` | Reviewed contrast text | — |
| `get_resources(nodeId, lowData, preferredTeacher)` | Allowlisted resource IDs + metadata | — |
| `get_stuck_cards(nodeId)` | Card IDs + titles | — |
| `get_student_summary()` | Minimal context (11.4) | — |
| `propose_entry({nodeId \| "out_of_scope", message})` **completes run** | nodeId is a **zod enum of the 9 IDs** | Shows the "Haan / Nahi / Pata nahi" confirm with that node |
| `propose_probe_order({nodeId, prereqOrder[]})` **completes run** | Must be a permutation of that node's prerequisites (validated) | Engine uses it; trace shows "agent reordered: vec_comp before kin_1d because attempt mentions angle" |
| `choose_stuck_card({cardId, message})` **completes run** | Enum of card IDs | Shows that card first |
| `compose_repair({resourceIds[], message})` **completes run** | Enum of resource IDs; **message must quote or paraphrase the reviewed contrast** (checked for the contrast ID) | Orders the repair options |
| `compose_greeting({message})` **completes run** | | Today greeting |

- **No tool can grade, set a state, or produce a URL.** States change only via graded receipts (11.3).
- **"Under the hood"**: each tool call, its arguments, and **what the engine/UI did as a result** (accepted / rejected by validation / fallback). This demonstrates agency with consequences, not animation.
- **Cost:** SDK usage events record tokens/cost per request into the metrics (section 10).

### 11.3 Grading and state integrity
- `items.json` is imported **only in server code** (never bundled to the client).
- `/api/item` returns `{stem, options, instanceId, instanceToken}`; the token is an HMAC over `(itemId, params, instanceId, issuedAt)` with expiry.
- `/api/grade` verifies the token, grades in code, and returns `{correct, candidateTags, receipt}` where the **receipt** is an HMAC over `(instanceId, itemId, correct)`. **Grade and state update happen together:** the client reducer applies a graded event only with a valid receipt shape and an **unseen `instanceId`** (duplicates ignored, 5.4).
- The engine **rejects invalid transitions** and never throws.
- Imported progress is **self-reported**: validated with zod, flagged, and never shown as verified.
- The client can still edit its own localStorage. Accepted: it is a private learning aid. We prevent *harmful transitions by the system*, not students lying to themselves.

### 11.4 Data minimisation (what actually leaves the device)
| Mode | Sent to our server | Sent to the model provider |
|---|---|---|
| No-AI | item ID requests, chosen option, tokens | **Nothing** |
| AI | above + pasted question (scrubbed of phone numbers/emails) + optional attempt text + a **minimal summary**: current node, states of that node's prerequisites, tone setting | The same minimal context. **Never** full history, never exports, never device identifiers |

The UI shows **before sending**: "Ye sawal aur tumhara attempt AI provider ko jaayega. Naam/number mat daalna." (This question and your attempt go to the AI provider; don't type your name or number.) with [Bhejo] / [Chapter se chuno instead].

### 11.5 Guards
| Guard | Implementation | Honest limit |
|---|---|---|
| Access control | AI mode requires `ACCESS_CODE` + 18+ confirmation | Honour-based age confirmation |
| Rate limit | Per-IP token bucket, about 20 mentor calls / 10 min | Per instance (demo-grade) |
| Spend cap | Daily mentor-call counter + `MENTOR_DISABLED` kill switch; SDK cost tracking | In-memory |
| Input caps | Paste 1,500 characters, attempt 500, message 300 | |
| Prompt injection | Student text wrapped as `<student_text>` data; tools read-only; enum outputs; completion-tool validation | Reduces, does not eliminate |
| Safety gate | **Before any processing**, a keyword check (English/Hindi/Hinglish) for distress/self-harm returns a fixed caring message with **Tele-MANAS 14416** (*verify before shipping*). Runs in both modes on any free text | Keyword lists miss things; stated |
| Output filter | Banned words -> template | |
| Tool bounds | maxIterations 6, timeout 10s, only learning tools registered (no shell, file or web tools) | |

### 11.6 Provider decision
- **Gemini: removed** (its terms bar apps likely accessed by under-18s; our audience is under-18 by design).
- **AI mode model: one model via the Cline API**, chosen at G1 for reliable tool calling, then **frozen** (no switching before the demo; panel: Tech Lead).
- *Unverified: whether Cline API terms permit end-user apps for minors.* Until verified, AI mode stays adult-only (11.1).

---

## 12. Cline in the product and in the build

### 12.1 Content pipeline (Cline SDK, two independent agents)
```
builder brief (node, misconceptions, intended changed-context)
   -> WRITER agent (Cline SDK): drafts A, B1, B2, R, contrast, stuck-card lines (JSON via completion tool)
   -> BLIND SOLVER agent (separate Agent, separate prompt, no key): solves each item
   -> CODE CHECK (numeric items: builder-approved answer function)
   -> any disagreement = flagged
   -> BUILDER approves / edits / rejects EVERY item  ->  only approved items are exported to content/
```
- Script: `npm run pipeline -- --node vec_comp` (local, never on the server).
- **Two agents agreeing is not ground truth; the builder's approval is.** Unreviewed items are **never served** (no "beta").
- Logged counts (drafted / flagged / rejected / approved) go in the README and PPT.
- **Fallback (G2):** if drafts are poor, the builder writes the remaining demo-path items with Cline's help in the editor.

### 12.2 Cline in the build
- All code written with Cline (Plan/Act). `.clinerules/` encodes: no LLM URLs; server-only answers; one evidence policy (5.x) as the spec; no banned words; zod at every boundary; engine tests must pass.
- Evidence kept: commit history, Cline session recordings, plan-mode screenshots, pipeline logs.

---

## 13. Tech stack

| Layer | Choice |
|---|---|
| App | Next.js (App Router, Node runtime for API routes) + TypeScript + Tailwind |
| Agent | `@cline/sdk` (Node 22+; machine has Node 24) |
| Model | One Cline API model (OpenAI-compatible provider), frozen at G1 |
| Validation | zod |
| Map | React Flow (focused path default; full map secondary) |
| Maths | KaTeX |
| Tests | Vitest (engine + transition table) |
| Storage | localStorage (student) / sessionStorage (guest); JSON export/import (self-reported) |
| Hosting | Vercel; Plan B: local `next start` |

Not used: Gemini, YouTube Data API, video analysis, a database, analytics SDKs. **PWA "add to home screen" only; we make no offline claim.**

---

## 14. Screens

1. **Start:** AI disclosure, data note, 3 buttons (chapter / sample / paste), guest-mode link, AI-mode access (adults).
2. **Postmortem:** confirm entry (Haan/Nahi/Pata nahi), optional attempt / "couldn't start", one item per screen with Pata nahi + "Sawal samajh nahi aaya" + confidence, progress, Baad mein.
3. **Outcome:** one of the six outcomes (5.5) + "Isse meri galti explain nahi hoti".
4. **Repair:** contrast, "Abhi check karo" (primary); "Aur options": read instead (NCERT ref + short explanation), video (with size, no autoplay).
5. **Kahan atke?:** 4 options -> stuck card / NCERT example + copyable ask-a-teacher summary.
6. **Today:** greeting, due re-checks, "Is hafte N checks", simulate toggle (labelled).
7. **Map (secondary):** focused path; "Poora map": 9 live + coming-next nodes, colour + icon, "connected to N later topics".
8. **Settings:** bhaiya/didi, aap/tum/tu, Hinglish/English-heavy, low-data, preferred teacher, export/import (self-reported), delete data, **"Galat sawal report karo"** list.
9. **Under the hood (judges):** tool calls + arguments + consequences, engine decisions, model, cost, fallback status, session metrics.

**Report a wrong question:** a flag on every item ("Is sawal mein galti hai?"). Stored locally and included in the export; in AI-mode demos the builder reviews it. Server-side collection is deferred (privacy).

---

## 15. Privacy, safety, minors, compliance

- **Status: controlled demonstration, not cleared for minors' unsupervised use.** We do **not** claim school or institutional readiness.
- **Provider terms (checked 10 Oct):** Gemini bars apps likely accessed by under-18s, so it is removed. Cline's ToS prohibits minors using its Service; *whether that extends to end users of apps built on the Cline API is unverified.* Anthropic's policy requires AI disclosure (done on every session) and extra guidelines for products serving minors.
- **Therefore:** the public build defaults to **no-AI mode** (no model calls). AI mode is **adult-only** behind an access code. The real-user test uses an **18+ participant**. Testing with minors happens only after provider suitability is resolved and with guardian consent.
- **Data:** no accounts, no database, no analytics. No-AI mode sends no free text anywhere. AI mode sends the minimal context in 11.4, **disclosed before sending**. A PII scrub runs on pasted text.
- **DPDP Act 2023 (India):** README + slide state our position: data minimisation, no tracking or ads, verifiable guardian consent and a privacy policy needed before any production use with minors. *No legal review done; we say so. Verify the Act's child-data provisions before quoting specifics.*
- **Content responsibility:** only builder-approved items; "report wrong question"; NCERT references for every repair.
- **Shared devices:** guest mode; one saved student per browser otherwise, **disclosed**; delete-my-data.
- **Never** shame, involve parents, give career verdicts, or claim learning gains.

---

## 16. Build plan (3:15pm to 8:00pm)

| Time | Cline (code) | Builder | Gate |
|---|---|---|---|
| **3:15-3:45** | Scaffold Next.js + TS + Tailwind + zod + Vitest; `.clinerules/`; public repo; install `@cline/sdk`; **spike: Agent + 1 tool + completion tool on a Cline API model, inside a deployed Next.js API route (Vercel) and locally** | Create the Cline API key (app.cline.bot); GitHub + Vercel; git name/email; confirm the 9 nodes, edges, suspect orders, misconception list; book an **18+** tester | **G1 (3:45):** the SDK agent works end-to-end in a deployed route on one model. Freeze the model. If the SDK fails: no-AI mode is the product, SDK is used for the pipeline only, stated honestly |
| **3:45-4:45** | Content schemas; **engine + transition-table tests**; item/grade API with receipts; pipeline script | Run pipeline; **approve every item** (31 + 12 cards + contrasts); write/approve all B1/B2/R on the demo path; NCERT refs; up to 2 curated videos per demo node with verified start times | **G2 (4:45):** demo path (`projectile`, `vec_comp`, `trig`, `vec_basics`) fully approved. Other nodes not approved = **not served** (they show as "coming next") |
| **4:45-5:30** | Postmortem flow in no-AI mode end-to-end (chapter + sample); outcomes incl. no_prereq_weakness / disputed / inconclusive; repair; Kahan atke; safety gate | Phone testing; bug list | **G3 (5:30):** no-AI journey works 3x on a phone, including one honest "no weakness found" run |
| **5:30-6:00** | AI mode: access code, paste intake, probe-order, stuck card, repair, greeting; Under the hood with consequences; metrics; Today; settings | Rehearse | **FREEZE 6:00pm** |
| **6:00-6:30** | Bug fixes only; final deploy; record backup demo | **Real-user observation:** 18+ JEE aspirant, no coaching; note completion, time, hesitation, "what would you have done otherwise?" | |
| **6:30-7:40** | README | PPT; demo video; social post | |
| **7:40-8:00** | Secret scan, links, final push | **Submit** | |

**Cut order if behind:** Foundation Check -> Hindi labels -> preferred teacher -> "Meri galtiyan" -> map full view -> AI greeting. **Never cut:** the evidence policy, honest outcomes, server grading, no-AI mode, or the Cline SDK agent (if G1 passed).

---

## 17. Scope tiers (final)

| Tier | Features |
|---|---|
| **MUST** | 9 live nodes + coming-next; 31 approved items + 12 stuck cards + contrasts; evidence policy + transition table with tests; Pata nahi / wording-void options; six honest outcomes incl. dispute; repair: contrast first + immediate check + read-instead + optional video; "Immediate check passed; retention untested"; Kahan atke flow with copyable summary; no-AI mode (public default); AI mode with Cline SDK agent (adults, access code) with tools + consequences trace; server grading + receipts + idempotency; safety gate; guards; data disclosure before send; guest mode; report wrong question; Today without streaks + simulate; mini pipeline with counts; session metrics incl. model cost |
| **SHOULD** | Focused + full map; tone settings; low-data toggle; preferred teacher (curated list); "Meri galtiyan"; export/import (self-reported); delete data |
| **COULD** | Foundation Check; Hindi UI labels; parameterised numbers on approved items |
| **DEFERRED (later, stated)** | Free-recall "explain in your own words" assessment; YouTube search + video verification; free-text favourite channels; multiple local profiles; offline mode; autonomous graph expansion; cross-student data; server-side wrong-question reports; flashcards |
| **SLIDES ONLY** | Career lens (evidence + questions, never a verdict); study buddy; WhatsApp bot; teacher/coach view; more chapters/subjects; regional languages; distribution via one teacher/study group; user + payer interviews; DPDP roadmap |
| **REJECTED** | Leaderboards/points/streaks; teacher-effectiveness warnings from local counts; "trick-user" label; shortcuts treated as shallow understanding; response time as diagnostic evidence; "exact root cause" / "unblocks N"; unreviewed "beta" items; payments/subscriptions/sponsored rankings; school-adoption claims; **parent view** (contradicts "never involves parents"); Gemini; photo/voice; native app; accounts; learning-styles claims |

---

## 18. Risks (final)

| # | Risk | Mitigation |
|---|---|---|
| 1 | Time; builder cannot code | 9 nodes, gates, freeze 6:00, cut order |
| 2 | Wrong item on stage | Writer + blind solver + code check + **builder approval of every item**; unapproved = not served; report button |
| 3 | Grading mistaken for diagnosis | "Suspected" wording, candidate tags, honest outcomes, dispute button |
| 4 | Product insists on a gap that isn't there | no_prereq_weakness + Kahan atke + dispute |
| 5 | Replacing one recipe with another | R reasoning items + independent B2 + "retention untested" |
| 6 | One slip mislabels | Two-observation rule; "Pata nahi" never tags; void items carry no evidence |
| 7 | Weak student overwhelmed | Chapter-first, sample, Haan/Nahi/Pata nahi, one item per screen, one next action, secondary map/trace |
| 8 | Provider terms / minors | Gemini removed; no-AI default; AI mode adult-only; 18+ tester; disclosure |
| 9 | SDK integration fails | G1 in a *deployed* route; no-AI product stands alone |
| 10 | Provider switching breaks the demo | One model frozen at G1 |
| 11 | Model state manipulation / injection | No state-changing tools; enums; validated permutations; data delimiters |
| 12 | Duplicate / invalid transitions | Idempotent instanceIds; reducer rejects invalid events; tests |
| 13 | Quota/spend abuse | Access code, rate limit, caps, kill switch, cost tracking |
| 14 | Distressed user | Safety gate in both modes |
| 15 | Data leaving the device | No-AI sends no text; AI minimal context, shown before sending |
| 16 | Shared phone | Guest mode; disclosure; delete |
| 17 | Over-claiming | No efficacy/causation claims; observation reported verbatim |
| 18 | Demo failure | Backup recording; no-AI path always works |
| 19 | Scope creep | New idea -> slide unless it replaces a MUST |

---

## 19. Demo script (3 minutes)

1. **(20s) Hook:** "Sawal galat hua. Kya concept kamzor hai, ya kuch aur? Aaj tak kisi ne pucha hi nahi." (The question went wrong. Is the concept weak, or something else? Nobody ever asked.)
2. **(70s) Journey 1, suspected gap (AI mode, adult demonstrator):** paste the projectile question, then the data note, then the agent proposes "Projectile" (Haan). Attempt: "angle se components nikale". The agent reorders probes: vec_comp first (trace shows the consequence). Projectile changed-context wrong + standard right; vec_comp changed-context wrong + standard right; trig right; vec_basics right. **"Suspected contributing gap: vector components, connected to N later topics."** Contrast -> "Abhi check karo" -> R + B2 pass -> **"Abhi ka check pass; retention untested."** Simulate +1 day -> re-check shows up.
3. **(35s) Journey 2, honest no-gap (no-AI mode):** chapter "1D kinematics" -> passes probes -> "**Is session mein koi purani kamzori nahi mili. Tumhari galti abhi unresolved hai.**" -> Kahan atke? -> Setup -> stuck card + copyable ask-a-teacher summary. *"A mentor earns trust by saying 'not this'."*
4. **(35s) Under the hood:** Cline SDK tool calls with consequences (accepted/rejected), engine decisions, model cost per session; "the question bank was drafted by a Cline writer agent, checked by an independent Cline solver agent, and every item approved by a human: X drafted / Y flagged / Z approved."
5. **(20s) Honesty + next:** provider-terms decision (no-AI default, adult-only AI), real-user observation quote, slide: career lens, teacher view, more chapters.

**Backup:** a recorded run of both journeys.

---

## 20. Business (slide only; hypotheses, not claims)

- **Value is unvalidated.** Today's evidence: one observed 18+ user, completion/time/abandonment metrics, cost per completed session.
- **Next step:** distribution through **one teacher or study group**; interview **students** and **prospective payers separately**.
- Possible later payers (hypothesis): small/mid coaching institutes. **No pricing claimed.**
- Moat (if ever): longitudinal per-student evidence + reviewed content. Only if retention is shown.

---

## 21. Deliverables

- [ ] Public repo + README: problem, solution, **evidence policy**, architecture, stack, setup (`npm run dev`, `npm test`, `npm run pipeline`), **Cline in build + product**, pipeline counts, **provider-terms decision**, privacy/safety, limitations.
- [ ] PPT: problem, insight, honest outcomes, demo, architecture, models/tools, Cline in build, Cline in product, challenges (incl. the terms pivot), observation findings, business hypotheses, DPDP position, future scope.
- [ ] Demo video (mandatory): Cline build footage + both journeys + Under the hood.
- [ ] Social post tagging Cline.
- [ ] `.env.local` never committed; `.env.example` committed; secret scan before going public.

---

## 22. What changed from v2 (summary)

- **12 -> 8 live nodes**; 24 -> 28 items (added independent **B2 repair checks** and **R reasoning items**) + stuck cards.
- **One evidence policy** (5.3-5.7) with a full transition table; resolves the "fragile needs two twists vs four-probe budget" conflict; demo fits in 6 probes.
- **New honest outcomes:** no prerequisite weakness, inconclusive, below coverage, student disputed.
- Wording: "suspected contributing gap", "connected to N later topics", "Immediate check passed; retention untested". No "trick-user", no "Fragile/Almost there" label.
- Answer options gain **Pata nahi** and **wording-void**; response time removed from diagnosis.
- Repair: **contrast first + immediate check**, read-instead prominent, video optional.
- Teacher-effectiveness warnings, streaks, flashcards, YouTube search and video verification removed or deferred.
- **Gemini removed** after reading its terms; **no-AI public default + adult-only AI mode**; 18+ real-user test.
- Agent tools now include **probe ordering and stuck-card choice with visible consequences**; still no state-changing tool.
- Grade receipts + idempotency + invalid-transition rejection; imports are self-reported.
- Guest mode, report-wrong-question, data disclosure before send, session metrics + model cost.

---

## 23. Decision log: panel round 2

| Persona | Recommendation | Decision |
|---|---|---|
| Topper | "Where did you get stuck?" after a passed probe; allow "no weakness found, mistake unresolved" | **Taken** (5.5, 6.3) |
| | Contrast before video; immediate check | **Taken** (6.2 step 5) |
| | Reject "shortcuts = shallow" | **Taken**: we test *when a rule applies* (1, 2, 5.1) |
| College graduate | One reasoning/diagram item on demo path | **Taken**: R items on 4 demo nodes |
| | "Immediate check passed; retention untested" | **Taken** (5.4) |
| | Own-words reconstruction | **Deferred** |
| Struggling IITian | Optional attempt / "couldn't start", no full-solution verification promise | **Taken** (6.2 step 2) |
| | "Doesn't explain my mistake" + "inconclusive" | **Taken** (5.5) |
| | Replace "trick-user" with an observation | **Taken** (5.3) |
| Cline judge | One evidence policy everywhere | **Taken** (5.x, demo fits) |
| | 8-12 reviewed nodes; one success + one honest non-success journey | **Taken**: 8 nodes; demo journeys 1 + 2 |
| | Show tool actions *and consequences* | **Taken** (11.2) |
| | Rubric note | Rubric **is** in the PS PDF (section 0); bonus for Cline-in-product confirmed there |
| Weak-foundation student | Not sure / don't know / don't understand wording, never auto-tagged | **Taken** (5.2, 6.2) |
| | One next action; map/trace secondary | **Taken** (6.2, 14) |
| | Plain foundation repair + honest exit below coverage | **Taken** (4.3) |
| | Reject "slow + guess + wrong = gap" | **Taken**: time never used diagnostically |
| Low-income student | Read-instead prominent with exact NCERT ref, no autoplay | **Taken** |
| | Topic-first entry | **Taken**: chapter picker first |
| | Temporary session | **Taken**: guest mode (sessionStorage) |
| | Defer offline/profiles; remove punitive streaks | **Taken**: streaks removed; offline claim removed |
| Fault finder | State-transition table | **Taken** (5.4) |
| | "Suspected contributing gap", "connected to N later topics" | **Taken** |
| | Disable unreviewed content | **Taken**: unapproved = not served |
| | Reject teacher warnings from 5 local attempts | **Taken** (8) |
| Loophole finder | Mastery derived from permitted evidence only | **Taken** (5.4, 11.2-11.3) |
| | Validate inputs/destinations; restrict tools; bound requests/iterations/spend | **Taken** (8, 11.5) |
| | Imports = self-reported | **Taken** |
| | Defer anti-cheat infrastructure | **Taken** |
| Tech guy | Grade + update together; idempotent; reject invalid transitions | **Taken** (11.3, 5.4) |
| | One provider, test the deployed journey early, no switching | **Taken** (G1 in a deployed route; model frozen) |
| | Defer video verification, channel search, autonomous expansion | **Taken** |
| Business | Observe one eligible participant completing the loop uncoached; "what would you have done otherwise?" | **Taken** (10) |
| | Measure completion, abandonment, time, model cost | **Taken** (10) |
| | Distribution via one teacher/group; separate user/payer interviews | **Slide** |
| | Reject payments/subscriptions/sponsored rankings | **Taken** |
| Government / public education | Resolve provider suitability before minor-facing use; controlled demo or deterministic no-AI flow | **Taken**: terms checked, Gemini removed, no-AI default, adult-only AI, 18+ tester |
| | Explain transmission before sending; minimise context; wrong-question reporting | **Taken** (11.4, 14) |
| | Defer institutional deployment | **Taken** |
| | Reject school-adoption claims and parent view | **Taken**; parent view moved to Rejected |

---

## 24. Still open

1. Name + headline (end).
2. **Cline API key** (builder creates; never pasted in chat).
3. **18+ real-user participant** for 6:00pm.
4. Verify: Cline API terms for end-user apps / minors; Tele-MANAS 14416; DPDP child-data provisions; Embibe features.
