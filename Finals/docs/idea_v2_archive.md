# idea.md: FINAL (v2, locked 3:00pm, 10 Oct 2026)

> **Working title:** TBD. Name and headline are picked at the end, by decision.
> **Event:** Cline AI Builder Hackathon, Round 2. **Deadline 8:00pm. Time left at lock: 5 hours.**
> **Team:** 1 builder (non-developer, can verify JEE physics/maths) + Cline (writes all code).
> **Rule:** this file is the single source of truth. Not here = not built. v1 is archived in `docs/idea_v1_archive.md`.
> **Inputs merged:** all mentor discussions + an 11-persona critique panel (Topper, College Graduate, Struggling IITian, Cline Judge, Weak Student, Low-income Student, Fault Finder, Loophole Finder, Tech Lead, Business, Government). Panel decisions are logged in section 22.

---

## 0. Reality check

| Fact | Consequence |
|---|---|
| **5 hours left** (3pm to 8pm). | One demo path, built deep. Code freeze **6:00pm**. |
| Builder cannot code. | Builder owns content verification, product calls, the real-student test, PPT and video. Cline owns all code. |
| PS: "a working product a real person could use tomorrow". | Real questions, real student test, real deployment. Anything simulated is labelled **"simulated"**. |
| Judging: creativity, innovation, usefulness, **effective use of Cline**, usability, technical implementation. **Bonus: Cline inside the product.** | The **Cline SDK is load-bearing in the product** (section 11), and also used in the content pipeline (section 12). |
| Panel consensus: v1 was **2-3x too big**. | v2 cuts to **12 nodes, 24 questions, one path**. Everything else is greyed out on the map or on slides. |
| Deliverables: public repo + README, PPT, **demo video showing Cline during the build**, optional social post. | 1.5 hours reserved. Screen recording is running; keep all Cline session footage. |

---

## 1. The problem

A JEE student gets a question wrong and concludes "I'm bad at physics." Usually the cause is smaller and older: a shaky Class 9-10 concept (vector components, trig ratios, slope as rate) that nobody noticed.

- Coaching teachers have hundreds of students and cannot see one student's gap.
- The student is too embarrassed to ask.
- Exams say *that* you failed, never *why*.
- **"JEE-fication":** shortcuts and tricks let students get answers right without understanding. Their own "I know this" is unreliable, so the foundation looks fine until a twisted question brings it down.

**Primary user:** a Class 11-12 student preparing for JEE or boards (same NCERT syllabus, so the same graph covers CBSE/state-board and government-school science students). They already have teachers and content, and have **no one who knows how *they* think**.

**Design persona for testing:** a **weak or average** student, not a topper (panel: "test on a failing student, not a strong one").

---

## 2. The product in one line

**A bhaiya/didi that finds the one old concept your mistake really comes from, including the ones you only pass by trick, sends you to the right few minutes of NCERT or a teacher you like, and checks it stuck.**

It is a **diagnosis and routing layer on top of NCERT, PW, Allen and YouTube**. It does not teach and does not replace teachers. *Cline coordinates tools to finish a job; this coordinates teachers to fix a student.*

### It is NOT
- A tutor or content platform (fix = NCERT page / teacher video + 2-line hint; no lectures).
- A leaderboard, test series, rank predictor or score app.
- A career-verdict engine (career lens = slide only, evidence plus questions, never a verdict).
- A "learning styles" product (debunked; never claimed).

---

## 3. Honest positioning

| Challenger | Honest answer |
|---|---|
| **ChatGPT / GPT-7** | A chatbot can run one good diagnostic chat. It does not hold a **checked JEE prerequisite graph**, **per-concept memory with re-checks**, **server-graded answers** (not LLM opinion), or a **proactive "aaj ka kaam"**. A smarter model does not give you a verified, durable map of one student. |
| **Brainly / Doubtnut / PW AI** | They answer the question you asked. We find the question you *should* have asked. |
| **ALEKS / Khanmigo / Embibe / Squirrel AI** | The knowledge-graph idea is **not ours**; it is proven research (Knowledge Space Theory). *Unverified: how deep Embibe's JEE diagnosis goes. 10-minute check before the novelty slide.* We never say "nobody has done this." |
| **"PW could build this in a quarter"** | True. Their incentive is to keep you inside their content; we are neutral and route to whoever fixes you, including NCERT. The long-term asset is longitudinal data on which resource fixed which gap. |

### What is genuinely ours
1. **Trick detection ("Fragile").** Others ask "did you get it right?" We ask "does it survive a twist?" Aimed at JEE-fication. **The sharpest claim.**
2. **Router, not teacher.** NCERT-first, teacher-of-your-choice, and we tell you to watch *less*.
3. **Transparent cross-subject graph with "unblocks N topics".** A chatbot cannot show it.
4. **A real Cline SDK agent in the product with a visible tool trace,** plus a Cline sub-agent content pipeline. Code decides correctness; the LLM interprets and talks.

**Pitch stance:** "Proven research, aimed at JEE-fication, built and run with Cline." A sharp demo beats claimed originality.

---

## 4. Knowledge scope: ONE demo path, built deep

**Subjects:** JEE Mechanics (Physics) + Calculus & Vectors (Maths), sharing a Trig/Algebra base. The overlap is the story: *students who cannot resolve vectors or read slope as rate fail kinematics, and nobody connects the two.*

### 4.1 The 12 live nodes (final; resolves v1's 30/32-36/12 conflict)
| # | Node | Level | Subject | Keystone |
|---|---|---|---|---|
| 1 | Ratios and proportion | L0 | Maths | |
| 2 | Linear equations and graphs | L0 | Maths | |
| 3 | Trigonometric ratios (sin, cos, tan of standard angles) | L1 | Maths | **Yes** |
| 4 | Vector basics (magnitude, direction, addition) | L1 | Maths/Phy | **Yes** |
| 5 | Slope of a line / graph | L1 | Maths | **Yes** |
| 6 | Vector components (resolution) | L2 | Maths/Phy | **Yes** |
| 7 | Derivative as rate of change | L2 | Maths | **Yes** |
| 8 | Motion graphs (x-t, v-t) | L2 | Physics | |
| 9 | 1D kinematics (equations of motion) | L3 | Physics | |
| 10 | Projectile motion | L3 | Physics | |
| 11 | Relative motion (1D/2D) | L3 | Physics | |
| 12 | Vectors in maths (dot product basics) | L3 | Maths | |

Edges (prerequisite -> dependent) are written by the builder and reviewed once; for example 3->6, 4->6, 6->10, 6->11, 6->12, 5->8, 7->8, 8->9, 9->10, 2->5, 1->3.

### 4.2 Greyed-out "coming next" nodes
About 10 more nodes (Newton's laws, friction, work-energy, circular motion, integration basics, 3D vectors, and so on) appear **greyed out** on the map with a "coming next" label. They show the vision and fan-out without needing content. **They are never diagnosed.**

### 4.3 Levels
Level is a data field used for layout and search order. The student is **never** made to climb levels. No "Level 3 of 10" labels anywhere (they read as rank).

---

## 5. Diagnosis model

### 5.1 Question bank: exactly 2 questions per live node (24 total)
| Type | Purpose | Count |
|---|---|---|
| **A: Standard** | The usual JEE form. A trick can pass it. | 1 per node |
| **B: Twist** | Same concept, surface changed so the common shortcut gives a wrong answer. Each wrong option carries a **misconception tag** with a reviewed one-line contrast ("wrong rule vs right rule"). | 1 per node |

- **Format:** MCQ (4 options) or single numeric answer. **Graded by server code, never by the LLM.**
- **Parameterised numbers** (where the question allows): the server fills in fresh values each time and computes the answer in code, so memorised answers do not transfer (panel: Loophole Finder). If a question cannot be parameterised safely, it stays fixed.
- **C (cross-context) questions are cut** from MVP. They are on the "What's next" slide.
- **Twist questions on the demo path are written or approved by the builder personally** (panel: Topper: "LLMs write same-question-different-numbers and call it a twist").

### 5.2 States: 3 states, shown in warm language (panel: IITian, Weak Student)
| Internal | Shown to student | Look |
|---|---|---|
| `gap` | **"Yahan se shuru karte hain"** (start here) | orange dot + "start" icon |
| `fragile` | **"Almost there: formula chalta hai, twist pe atakta hai"** | yellow + half-filled icon |
| `solid` | **"Pakka ho gaya (abhi ke liye)"** (solid for now) | green + tick |
| `untested` | "Abhi check nahi kiya" (not checked yet) | grey outline |
| `due` (derived) | "Revision ka time" (time to revise) | green tick + small clock |

- No red crosses. No word "weak" or "fail". Colour **plus** icon (colour-blind safe).
- "Solid" always carries "abhi ke liye" (for now). It means **no weakness found yet**, never "mastered".
- **Inference:** passing a dependent node does **not** mark its prerequisites solid. They stay `untested`. This answers the trick-user false positive directly.

### 5.3 The diagnosis algorithm (deterministic code, resolves v1's budget conflict)
Per node, the engine asks **at most 2 questions**, twist first:

```
probeNode(n):
  ask B (twist)
    correct AND confidence != "Guess"   -> n = solid, stop probing n          (1 question)
    correct AND confidence == "Guess"   -> ask A; A correct -> solid, else gap (2 questions)
    wrong                               -> ask A
         A correct -> n = fragile   (two signals: standard right + twist wrong)
         A wrong   -> n = gap
```

**Postmortem search:**
1. Start at the entry node (section 6.1). `probeNode(entry)`.
2. If solid: "Concept theek hai; ye galti shayad calculation ya padhne mein thi." Show the careless-error note (5.4) and exit. **Strong students are out in under a minute.**
3. If fragile or gap: pick the next prerequisite to probe. Order: keystone first, then the order the builder listed (most-suspect first), skipping nodes already solid. `probeNode` it.
4. Repeat downward. **Root cause = the deepest fragile/gap node whose tested prerequisites are all solid (or that has no prerequisites).**
5. **Hard budget: 6 questions** (shown as "Sawal 2 / max 6", about 3 minutes). If the budget runs out, report the deepest weak node found as "sabse likely jadd" (most likely root) and offer to continue later.

**Why it is sound:** fragile needs two independent signals (standard right, twist wrong), so one slip does not label a student. Guess-right never counts as solid. Inference never turns prerequisites green.

### 5.4 Confidence tap and careless errors
Every answer has a one-tap **Pakka / Shayad / Guess** (sure / maybe / guess) plus response time (logged).

| Pattern | Reading | What bhaiya says (tone-adjusted) |
|---|---|---|
| Pakka + wrong | Over-confidence or careless | "Pakka bola tha, par yahan atak gaya. Koi baat nahi, ek aur dekhte hain." |
| Guess + wrong | Genuine gap | Goes one level down |
| Guess + right | Lucky or shaky | Asks the other question |
| A right, B wrong | Fragile | "Tera formula yahan tak chalta hai, is twist pe nahi." |

Calibration counts (how often "Pakka" was right) are stored for the slide-only evidence card later. **No trait claims in MVP.**

---

## 6. Entry points

### 6.1 Mode 1: Question Postmortem (MUST; the daily trigger)
1. **Three ways in, zero blank-page fear** (panel: Weak Student, Topper):
   - **"Sample sawal try karo"**: one-tap demo question (a projectile problem).
   - **Chapter picker**: "Kis chapter mein atka?" offers the 4 L3 nodes plus "pata nahi".
   - **Paste or type** a question (DPP/PYQ), max 1,500 characters. No photos.
2. For pasted text, the **Bhaiya agent (Cline SDK)** maps it to a live node and returns a node ID from an enum, so it cannot invent one. The student confirms in one tap: "Ye **Projectile** ka sawal lag raha hai, sahi?" Out of scope: "Ye abhi mere map ke bahar hai. Inme se koi chapter?" It never bluffs.
3. Probing runs as in 5.3, **one question per screen**, with a progress bar and a visible "Baad mein" (later) exit.
4. **Root-cause reveal:** "Asli dikkat: **Vector components**. Isse theek kiya toh **N aur topics** khul jayenge." N is fan-out **computed by code from the graph** (all live + "coming next" descendants; the live/coming-next split is shown on tap). Numbers like "5" or "10" in this doc are illustrative only; the demo shows whatever the graph yields. The jargon "fan-out" never appears to students.
5. **Fix card** (section 8), then **one check question** (a fresh-numbers twist). Pass: solid, re-check scheduled. Fail: "Koi nahi. Doosra tareeka try karte hain" with the next resource.

### 6.2 Mode 2-lite: Foundation Check (SHOULD; replaces v1's adaptive "Find my level")
- A fixed sequence: the **B question of each of the 5 keystones** (5 questions, about 3 minutes). Same engine, no adaptive heuristic (panel: Tech Lead, cut the heuristic).
- Output is the map lit up, plus one sentence: "Sabse pehle **X** pakka karte hain." No score, no percentile, no level number.
- Progress-only "gamification": "5 mein se 3 foundations pakke." Never competitive.

### 6.3 Onboarding: one tap (panel: Weak Student: "6 decisions and I quit")
- First screen: one line of what this does, a one-line privacy note (section 15), and **three big buttons** (sample / chapter / paste).
- Defaults: **bhaiya, "tum", Hinglish**. Everything else is in Settings: didi, aap/tum/tu, Hinglish/English-heavy, "My teachers".
- No account, no form.

---

## 7. The bhaiya/didi persona (a spec, not a vibe)

Personality is free. **Memory, proactivity and evidence are the product.**

| Behaviour | Concrete form in MVP |
|---|---|
| **Opens the conversation** | On app open, the Today screen greeting is written by the Bhaiya agent from real state: "Kal vectors ka revision chhoda tha. 2 min mein kar lein?" No push notifications (slide: WhatsApp/Telegram bot). |
| **Never shames, never involves parents** | System-prompt rule plus banned-word filter on output ("weak", "fail", "dumb", "bekaar"). Tested with 5 adversarial inputs. |
| **Honest, with evidence** | Any claim about the student cites a logged count ("Pichhle 4 mein se 3 'Pakka' wale sahi the"). |
| **One next step** | Every screen has exactly one primary button. |
| **Brief** | Max about 40 words per message. Time estimate before every step ("~8 min"). |
| **Remembers** | Mentions a previous gap when it recurs, from local state. |

**Tone settings (cheap, explicit):** bhaiya/didi; **aap / tum / tu** (default "tum"; "tu" is opt-in for students who want "tu yahan galat hai bhai", and the output filter still applies); Hinglish (default) / English-heavy. The explicit setting always wins. **No "auto-detect your comfort" claim** and no tone mirroring in MVP (panel: Loophole Finder, mirroring copies abuse).

**Hindi (Devanagari):** SHOULD for the 12 node names + hints + UI labels; COULD for question text (needs builder review of 24 translations). Full Hindi and regional languages are on a slide.

**Fallback voice:** if the LLM is down or rate-limited, every agent message has a **deterministic template** in the same tone. The app keeps working because code makes every decision (section 11).

---

## 8. Routing: "the right few minutes"

**Hard rule: the LLM never produces a URL.** It can only pick resource IDs from an enum of our allowlist. The UI renders links only from the resource file.

### 8.1 The fix card (one per root cause), in this order
1. **2-line hint** built from the matched misconception's reviewed contrast, phrased by the Bhaiya agent in the chosen tone. Zero data cost.
2. **NCERT first** (panel: Low-income Student, Government): chapter/section link with **size shown** ("~300 KB PDF page"). This is the **default** option.
3. **Up to 2 teacher videos** (curated, builder-watched, **builder-verified timestamp**), each labelled with length and **approximate data size** ("12 min, ~60 MB at 480p"; estimate shown as approximate). If the student's "My teachers" list includes a curated teacher, that video comes first.
4. **Low-data toggle** in Settings hides videos and shows NCERT + hint only.

### 8.2 My teachers
- Settings: add **2-5 teachers** (names or channel links). MVP behaviour: prioritise curated videos from those teachers.
- **COULD:** YouTube Data API search *within* those channels (quota: `search.list` 100 calls/day by default; cache, never live on stage), plus Gemini video verification with an "AI-suggested" timestamp. Cached per (video, concept).
- Links: official YouTube links/embeds only; no downloading, no transcript storage (panel: Business, YouTube terms).

### 8.3 "Did this help?" and honest fit warnings
- After a resource: one tap **"Samajh aaya?"** (yes / thoda / nahi) **plus** the check question. **The check pass rate is the primary signal.** Liked is not learned.
- Stored **per device** in MVP. A warning appears only with **at least 5 real attempts** on that resource, showing real counts ("5 mein se 1 ka check pass hua; doosra option dekhein?").
- Cross-student aggregation needs a backend: **slide**. Any seeded counts in the demo are labelled **"simulated"**.
- Never a public "bad teacher" label.

---

## 9. Hints, flashcards, revision

- **2-line hint:** MUST (from reviewed contrasts).
- **"Meri galtiyan" list** (my mistakes: node, question, my answer, the contrast, resource): SHOULD. It is the student's own record; no AI content.
- **Flashcards (AI-phrased from the student's own misconception tags, labelled "AI-generated", numbers checked by code):** COULD. Panel said cut for time; it returns only after freeze if everything else works.

---

## 10. Accountability without cheating

**Principle: cheating needs something to win. Nothing here can be won.**

| Do | Don't |
|---|---|
| Map filling in; "3 foundations pakke" | Leaderboards, points, XP, ranks, percentiles |
| "Isse N topics khul gaye" | Comparing students with each other |
| Compare only with yourself ("2 hafte pehle vs ab") | "Level N" labels |
| Streak with **one built-in forgiveness day** | Streak that wipes progress on one miss |
| Re-checks at **1, 7, 30 days** after solid; failing one turns it fragile | Notification spam |

### 10.1 Today screen (MUST)
- Bhaiya's greeting + up to **3 due re-checks** (about 3 minutes) + streak + the 3 entry buttons.
- **Demo honesty:** a **"Simulate: +7 days"** dev toggle, clearly labelled **"simulated"**, to show re-checks coming due (panel: Fault Finder, decay cannot be demoed live).

### 10.2 "Test in 48 hours" panel (SHOULD; panel: Struggling IITian)
- One button: "**2 din mein test hai**". Shows the **top 3 non-solid nodes ranked by how many topics they unblock** (computed fan-out), each with a time estimate and its fix card.
- **Replaces v1's PYQ "exam-near" mode.** PYQ frequency counts are cut unless sourced from real papers (slide only; never AI-generated numbers).

### 10.3 Study buddy
Slide only (needs two users and a backend). COULD: a "share my map" link with the state encoded in the URL.

---

## 11. Architecture: where the Cline SDK lives

**Principle: code decides what must be correct; the Cline SDK agent interprets and talks; the UI shows both.**

```
Browser (Next.js PWA, mobile-first)
  |- localStorage: StudentState (versioned, zod-validated)
  |- Engine (pure TS: (state, event) -> state), unit-tested
  |- Screens: Today, Postmortem, Fix card, Map, Settings, "Under the hood"
        |
        v  HTTPS (state summary only, no PII)
Next.js API routes (server)
  |- /api/question  -> picks question + params, returns a SIGNED instance (no answer key)
  |- /api/grade     -> verifies signature, recomputes answer, returns correct/incorrect + tag
  |- /api/bhaiya    -> Cline SDK Agent run (intake | fix | greeting), returns text + tool trace
  |- guards: rate limit, input caps, safety gate, kill switch
  |- content/: graph.json, questions.json (server-only), resources.json, misconceptions.json
        |
        v
Model provider: Gemini (dev) | Cline API, OpenAI-compatible (demo, $40 credits)
```

### 11.1 The Bhaiya agent (Cline SDK, `@cline/sdk`)
- **One `Agent` per request** (stateless worker pattern from the SDK docs), `maxIterations` about 4-6, short system prompt with persona and safety rules.
- **Three jobs** (the `job` field):
  1. **intake:** map pasted text to a live node or "out of scope".
  2. **fix:** after a root cause, choose which resources to show and in what order, and write the hint and encouragement in tone.
  3. **greeting:** write the Today opener from the state summary.
- **Tools (`createTool` + zod), all read-only, backed by code:**

| Tool | Returns |
|---|---|
| `search_nodes(query)` | Candidate live nodes with descriptions |
| `get_node(nodeId)` | Node details, prerequisites, unblocks count |
| `get_misconception(tag)` | The reviewed wrong-rule vs right-rule contrast |
| `get_resources(nodeId, lowData, myTeachers)` | Allowlisted resources (IDs, metadata) |
| `get_student_summary()` | Compact state: weak nodes, due items, calibration counts |
| `submit_intake({nodeId or "out_of_scope", confidence, message})` | **completesRun**; `nodeId` is a zod **enum of the 12 IDs** |
| `submit_fix({resourceIds[], hint, message})` | **completesRun**; `resourceIds` is a zod **enum of allowlisted IDs** |
| `submit_greeting({message})` | **completesRun** |

- **The agent cannot change mastery, grade, or emit URLs.** Mastery is updated only by the engine after `/api/grade`. There is no LLM-callable `update_mastery` (panel: Loophole Finder).
- **Visible trace:** `agent.subscribe` events (tool calls, results) are returned and shown in an **"Under the hood"** drawer for judges, alongside engine decisions ("engine: B wrong, A right, so fragile"). Students never see jargon by default.
- **Provider config:** dev = Gemini (provider id and env var confirmed during the spike); demo = `providerId: "openai-compatible"`, `baseUrl` = Cline API (`https://api.cline.bot/api/v1`, exact path verified in the spike), key from app.cline.bot in `.env.local`. **Both untested by us; that is Gate G1.**
- **Graceful degradation:** if the agent fails, times out (>8s) or is rate-limited, the route returns the deterministic template (section 7) and the trace shows "fallback". The loop never breaks.

### 11.2 Engine and state (pure, tested)
- `StudentState` (version 1, kept small, under about 10 KB): settings, per-node `{state, lastTested, nextRecheck, history[]}`, per-resource `{shown, helpedVotes, checkPasses}`, calibration counts, streak, current session.
- `engine.reduce(state, event)`, where event is one of `graded | sessionStart | resourceShown | helpedVote | recheckDue | simulateDays`. Pure function, **unit tests (Vitest) for the 5.3 algorithm**: solid exit, fragile path, gap path, budget exhaustion, guess handling.
- Saved to localStorage **after every answer** (panel: Low-income Student, patchy network). Export/import a JSON file (validated with zod on import). "Delete my data" button.

### 11.3 Grading security
- `questions.json` (answer keys, distractor tags, answer functions) is **imported only on the server**, never bundled to the client.
- `/api/question` returns `{stem, options, instanceToken}`. The token is **HMAC-signed** (`questionId + params + issuedAt`) with a server secret, so grading is stateless and tamper-evident.
- `/api/grade` takes `{instanceToken, chosen}`, recomputes the answer, and returns `{correct, misconceptionTag?, contrastId?}`. Tags are revealed **only after** grading.
- The client may still edit its own localStorage map. **Accepted: nothing to win**, so no state signing (panel recommendation consciously skipped).

### 11.4 Guards (panel: Loophole Finder, Tech Lead)
| Guard | Implementation | Honest limit |
|---|---|---|
| Rate limit | In-memory token bucket per IP: about 20 agent calls/10 min | Per serverless instance only; good enough for a demo |
| Spend cap | Daily agent-call counter + `AGENT_DISABLED=true` kill switch env var | In-memory; resets on cold start |
| Input caps | Pasted text max 1,500 characters; message max 300 | |
| Prompt injection | Pasted text wrapped as `<student_question>` data; tools read-only; outputs enum-constrained | Reduces, does not eliminate |
| **Safety gate** | **Before any LLM call**, a keyword check (English/Hindi/Hinglish) for self-harm/distress, which returns a fixed caring message with **Tele-MANAS 14416** (*verify the number before shipping*) and stops the agent. Abuse words get a neutral reply. | Keyword lists miss things; stated in README |
| Output filter | Banned-words list on agent output; on a hit, use the template instead | |
| Timeouts | Agent call timeout 8s, then template. Vercel `maxDuration` set; one agent run per request | |

---

## 12. Content pipeline: Cline SDK sub-agents (mini, real)

The full 5-agent pipeline from v1 is cut (panel: 4 of 11). We keep a **mini but real** version, because it is our second "Cline inside" story and it raises content quality.

```
builder spec (node, misconceptions, twist idea)  ->  WRITER agent (Cline SDK)
      drafts A + B questions, options, tags, answer (JSON via completesRun tool)
                       |
                       v
BLIND SOLVER agent (separate Cline SDK Agent, separate context, never sees the key)
      solves each question; returns its answer + reasoning
                       |
                       v
CODE CHECK: for numeric/parameterised questions, a code answer function
      (written by Cline during the build, reviewed by the builder) recomputes it
                       |
                       v
Disagreement anywhere = FLAGGED.  Builder reviews EVERY question (all 24) -> approved
```

- Run as `npm run pipeline -- --node vector_components` (a Node script, **not** on the server).
- **Independence:** two separate `Agent` instances with different system prompts; the solver gets no key. (The SDK's `enableSpawnAgent` / teams are optional; plain separate Agents are simpler and truly independent.)
- **Builder writes or approves every twist on the demo path.** The pipeline drafts and checks; the human decides.
- **Logged honestly:** drafted / flagged / approved counts go into the README and PPT as real numbers. No accuracy claims beyond that.
- **The extension story:** "the same pipeline grows the graph to new chapters, with a human approving each question."
- **Fallback (Gate G2):** if the pipeline is not producing usable drafts by 4:30pm, the builder writes the remaining demo-path questions directly with Cline's help in the editor.

### 12.1 Cline in the build (judging: effective use of Cline)
- All code written by Cline (Plan/Act), with **`.clinerules/`** in the repo encoding project rules: LLM never emits URLs; server-only answer keys; no shaming words; zod on every boundary; tests for the engine.
- Keep: commit history, Cline session recordings (already running), screenshots of plan mode, pipeline run logs. The README has a "How Cline was used" section with both the build and the product.

---

## 13. Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js (App Router) + TypeScript + Tailwind** | One repo; API routes are the backend; mobile-first |
| Agent | **`@cline/sdk`** (Node 22+; machine has Node 24) | Bhaiya agent + pipeline agents. Core requirement. |
| Validation | **zod** | Tool schemas, state, imports, API bodies |
| Map | **React Flow** | Node colour is a state change; cluster layout |
| Maths text | **KaTeX** | Correct rendering of formulas on phones |
| Tests | **Vitest** | Engine unit tests |
| Storage | localStorage + JSON export/import | No accounts, no database |
| Hosting | **Vercel** (Plan B: local `next start` for the demo) | Public link for judges |
| Models | Gemini (dev, free) / Cline API model (demo, $40) | Section 11.1 |
| Optional | YouTube Data API v3 | COULD only |

- **PWA:** manifest plus "add to home screen". Offline caching of content is **cut**: the question bank must stay server-side for security, so offline diagnosis conflicts with server grading. Offline = slide. NCERT-first, text-first design keeps data use low anyway.
- **Performance budget:** small JS bundle on mobile where feasible; no video autoplay; no images.

---

## 14. Screens (mobile-first, one primary action each)

1. **Today:** greeting, due re-checks, streak, 3 entry buttons, "2 din mein test hai".
2. **Postmortem:** paste / chapter picker / sample, then "Ye Projectile ka sawal hai?" confirm, then **one question per screen** + Pakka/Shayad/Guess + "Sawal 2 / max 6" + "Baad mein" exit.
3. **Root cause + Fix card:** "Asli dikkat: X. Isse N topics khulenge", hint, NCERT (default), up to 2 videos with length/size, "Samajh aaya?", check question.
4. **Map:** **focused view by default** (the path from your question down to the root cause, about 3-5 nodes). "Poora map dekho" opens the full graph: 12 live + greyed "coming next" nodes, clusters, colour + icon, tap for "unblocks N" and history.
5. **Settings:** bhaiya/didi, aap/tum/tu, Hinglish/English-heavy, low-data toggle, My teachers, export/import, delete data, "Simulate +7 days" (dev, labelled).
6. **Under the hood (judges):** live agent tool trace + engine decisions + model/provider + fallback status.

A wireframe of screens 1-3 is sketched first (15 minutes) so Cline builds to it (panel: Cline Judge, usability scored lowest).

---

## 15. Privacy, safety, compliance

- **One line on the first screen:** "Koi account nahi. Tumhari progress sirf is phone mein hai. Paste kiya hua sawal AI provider ko jaata hai, apna naam ya number mat daalna." (No account; your progress stays on this phone; pasted questions go to an AI provider, so don't type your name or number.)
- **Accurate wording** (panel: Fault Finder): "No accounts and no database. Progress stays on the device. Pasted question text and a compact progress summary are sent to the AI model provider to generate replies." *Provider data-use terms (Gemini free tier, Cline API) to be checked and stated in the README.*
- **No PII** requested anywhere. A simple regex scrub of phone numbers/emails from pasted text before the LLM.
- **Minors and India's DPDP Act 2023** (panel: Government): README + slide state our position: no accounts, data minimisation, no tracking or ads, and that a production version would need verifiable parental consent for under-18 users, a processing review and a privacy policy. *No legal review has been done; we say so. Verify the Act's child-data provisions before quoting specifics.*
- **Safety gate** for distress (11.4). Never shame, never contact parents, never give a career verdict.
- **Shared phones:** export/import + "delete my data". Multi-profile is a slide.

---

## 16. Build plan (3:00pm to 8:00pm)

| Time | Cline (code) | Builder | Gate |
|---|---|---|---|
| **3:00-3:30** | Scaffold Next.js + TS + Tailwind + zod + Vitest; `.clinerules/`; push public repo; install `@cline/sdk`; **spike**: one Agent + one `createTool` on Gemini, then the Cline API; hello-world `/api` agent route on Vercel | Get Gemini key + Cline API key; Vercel + GitHub ready; set git name; write node list + edges + misconceptions for 12 nodes; 15-min wireframe of screens 1-3 | **G1 (3:30):** agent + tool works on one provider, on Vercel or locally. If the SDK fails: plain tool loop live, SDK kept for the pipeline, stated honestly |
| **3:30-4:30** | Content schemas + loaders; **engine + unit tests**; signed question/grade API; pipeline script (writer + blind solver) | Run pipeline per node; **review/fix every question**; write/approve all 12 twists; verify NCERT links + up to 2 videos for 5 keystones (timestamps by hand) | **G2 (4:30):** at least 16 approved questions covering vector components -> projectile. Else builder writes the rest directly |
| **4:30-5:30** | Postmortem end-to-end; Bhaiya agent intake + fix + greeting with template fallback; Fix card; safety gate; rate limit; Under-the-hood trace | Finish questions; test on own phone; keep a bug list | **G3 (5:30):** sample question goes paste -> root cause -> fix -> check -> solid on a phone, **3 times without error** |
| **5:30-6:00** | Map (focused + full), Today, re-checks + simulate toggle, settings; Foundation Check if time | Line up the real student; prepare demo question | **FREEZE 6:00pm.** Bug fixes only after this |
| **6:00-6:30** | Fixes from the real test; final deploy; record backup demo | **Real student test** (weak/average JEE student, phone, throttled network if possible); note honest observations | |
| **6:30-7:40** | README | PPT; demo video; social post | |
| **7:40-8:00** | Final checks: repo public, link works, no keys committed | **Submit** | |

**Cut rule:** if a gate slips, cut from the bottom of section 17's COULD, then SHOULD. **Never cut the Postmortem loop or the Cline SDK agent.**

---

## 17. Scope tiers (final)

| Tier | Features |
|---|---|
| **MUST** | 12-node graph + greyed "coming next" nodes; 24 approved questions (A+B); engine (5.3) with tests; signed server grading; confidence tap; Postmortem with sample / chapter / paste; one-question-per-screen with progress + exit; root cause + "unblocks N"; Fix card (hint, NCERT default, curated videos with size); check question; **Bhaiya agent on Cline SDK** (intake, fix, greeting) with template fallback; Under-the-hood trace; focused map; Today screen with re-checks + simulate toggle; warm state labels; one-tap onboarding with defaults; safety gate; rate limit + input caps; localStorage save per answer; privacy line; **mini pipeline (writer + blind solver)** with counts |
| **SHOULD** | Full map view; Foundation Check (5 keystones); "2 din mein test hai" panel; tone settings (didi, aap, English-heavy); low-data toggle; My teachers (prioritise curated); "Samajh aaya?" + per-device fit warnings (min 5); Hindi for node names, hints and UI labels; "Meri galtiyan" list; export/import/delete |
| **COULD (cut first, top to bottom)** | 1) Flashcards; 2) YouTube search in my-teacher channels; 3) Gemini video verification + AI-suggested timestamps; 4) parameterised numbers on more questions; 5) share-my-map link; 6) Hindi question text; 7) coach/teacher class heatmap mock |
| **SLIDES ONLY** | Career lens (evidence + questions, never a verdict) and JoSAA; olympiad pointers; study buddy; WhatsApp/Telegram bot + reminders; cross-student resource ratings; teacher/school dashboard + DIKSHA/SCERT pilot path; regional languages; offline mode; more chapters and subjects; C-type cross-context questions; PYQ-weighted exam mode; multi-profile for shared phones; business model; DPDP compliance roadmap |
| **DEAD** | Leaderboards, points/XP, ranks; Pomodoro; photo and voice input; native app; accounts; AI-generated lessons; rank prediction; learning-styles claims; tone mirroring; LLM-generated URLs or statistics (the "tu" register is kept as an opt-in setting; only automatic mirroring is dead) |

---

## 18. Risks and loopholes (final)

| # | Risk | Mitigation |
|---|---|---|
| 1 | 5 hours, builder cannot code | Gates G1-G3, freeze 6pm, strict cut order |
| 2 | Wrong answer key on stage | Writer + blind solver + code check + **builder reviews all 24**; demo question pre-run 5 times |
| 3 | Cline SDK fails or is awkward | 30-min spike first; fallback stated (plain loop live, SDK in pipeline) |
| 4 | Vercel timeouts / SDK on serverless | One agent run per request, 8s timeout + template; Plan B local `next start` |
| 5 | Free-tier rate limits mid-demo | Code makes all decisions; agent only at 3 points; templates; Cline API model for demo |
| 6 | Trick-user false positive | Twist-first probing; fragile needs two signals; inference never marks solid |
| 7 | One slip mislabels | Two-signal rule; Guess-right never solid; warm wording |
| 8 | Strong student wastes time | Solid on the first twist, exit in under a minute |
| 9 | Weak student quits (fear, jargon, choices) | Sample button, one-tap start, warm labels, one question per screen, progress bar, time estimates, focused map |
| 10 | Blank page / cannot type diagram questions | Chapter picker + sample question |
| 11 | Data cost / patchy network | NCERT-first, sizes shown, low-data toggle, save per answer, retry messages |
| 12 | Answer-key leakage or client-forged grades | Server-only keys, HMAC-signed instances, server grading |
| 13 | Quota drain / abuse | Rate limit, caps, kill switch |
| 14 | Prompt injection via pasted text | Data delimiters, read-only tools, enum outputs, no mastery tool |
| 15 | Harm to a distressed minor | Pre-LLM safety gate with helpline; output filter |
| 16 | Hallucinated links or numbers | Enum resource IDs only; no AI statistics |
| 17 | Over-claiming | No efficacy claims; 1 student test = usability evidence only; pipeline counts are real |
| 18 | "Isn't this ALEKS/Embibe/ChatGPT?" | Concede the base; lead with trick detection, routing, Cline agent |
| 19 | Privacy / DPDP | Accurate wording, no PII, regex scrub, README position, legal review stated as not done |
| 20 | YouTube terms | Official links only, no downloads or transcripts |
| 21 | Demo failure | Backup recording; rehearse 3x; Cline API model; templates |
| 22 | Scope creep | Any new idea goes on a slide unless it replaces a MUST |

---

## 19. Demo script (3 minutes)

1. **(20s) Hook:** "Tricks se answer sahi, concept se nahi." Who has got a projectile question right by formula and still felt lost?
2. **(80s) Live postmortem on a phone:** tap the sample projectile question (or paste a real DPP question), confirm "Projectile?", then twist question: right; then deeper: vector components twist wrong, standard right, so **"Almost there"**. Root cause: **vector components, unblocks N topics (computed by the graph)**. Focused map lights the path.
3. **(40s) Fix + proof:** 2-line hint, NCERT page first (size shown), teacher video with verified timestamp. Check question: green. "Revision: kal, 7 din, 30 din." Simulate +7 days (labelled) to show the re-check.
4. **(25s) Under the hood:** the Cline SDK agent's tool calls (`search_nodes`, `get_resources`, `submit_fix`) and engine decisions. "The LLM talks, code decides. The question bank was drafted by a Cline writer agent and checked by an independent Cline solver agent: X drafted, Y flagged, Z approved."
5. **(15s) Real user + what's next:** one honest line from the real student test; slide with career lens, teacher dashboard, WhatsApp, more subjects.

**Backup:** a pre-recorded run of the same flow, ready to play.

---

## 20. Business and adoption (slide-only, stated as hypotheses)

| Question | Hypothesis (not validated) |
|---|---|
| Who pays? | Free for students. Revenue from **small/mid coaching institutes** (white-label diagnostic layer with their own videos, class heatmap) and an optional parent report. Prices are a hypothesis to test, not a claim. |
| Distribution | Teachers/YouTubers sharing "find your gap" links, Telegram study groups, coaching pilots; government path via DIKSHA/SCERT pilots later. |
| Why won't PW just build it? | They can. Our wedge is neutrality (route to whoever fixes the gap) and the long-tail institutes without tech teams. |
| Moat | Per-student longitudinal mastery data + "which resource fixed which gap" outcome data. Only a moat if retention is proven, and it is not yet. |
| Feature or company? | Today, a feature. A company only if the outcome data and retention materialise. |
| Legal | Official YouTube links only; creator partnerships later; DPDP compliance before any real launch. |

---

## 21. Deliverables checklist

- [ ] **Public GitHub repo + README:** problem, solution, architecture diagram, tech stack, setup (env vars, `npm run dev`, `npm test`, `npm run pipeline`), **how Cline was used (build + Bhaiya agent + pipeline)**, pipeline counts, limitations, privacy/safety notes.
- [ ] **PPT:** problem, insight (JEE-fication), product, demo screens, architecture, models/tools, Cline in build, Cline in product, challenges, real-student findings, business hypothesis, DPDP position, future scope, vision slide.
- [ ] **Demo video (mandatory):** Cline build footage + real user scenario + Under-the-hood trace.
- [ ] Social post tagging Cline.
- [ ] Keys in `.env.local` only; `.env.example` committed; repo scanned for secrets before going public.

---

## 22. Panel decision log (what we took, what we did not)

| Persona | Recommendation | Decision |
|---|---|---|
| Topper | Hand-verify demo path; builder writes twists; 3 states; chapter picker; real aspirant solves twists cold | **All taken** (4.1, 5.1, 5.2, 6.1, 16) |
| College Graduate | One chapter path; "next review" display; backup demo by 6pm | **Taken** (re-checks kept + simulate toggle, labelled) |
| Struggling IITian | Warm labels; one node at a time; "test in 48h"; time estimates; test a weak student | **All taken** (5.2, 14, 10.2, 7, 1) |
| Cline Judge | Spike first; visible agent trace; build evidence; wireframe; single loop | **All taken** (16, 11.1, 12.1, 14) |
| Weak Student | Sample question; one-tap defaults; progress bar; no jargon; one next step | **All taken** (6.1, 6.3, 7, 14) |
| Low-income Student | NCERT default + sizes + low-data toggle; save per answer; backup file; Hindi; privacy line | **Taken**; Hindi split into SHOULD (labels) / COULD (questions); offline cut (conflicts with server grading) |
| Fault Finder | Consistent numbers; budget conflict; privacy wording; simulated clock; cut video verification | **All taken** (4.1, 5.3, 15, 10.1, 8.2 to COULD) |
| Loophole Finder | Server grading + key stripping; rate/spend caps; safety gate; no LLM mastery tool; zod imports; parameterised numbers | **Taken**; **state HMAC skipped** (nothing to win; question instances are signed instead) |
| Tech Lead | Spike; deterministic engine + tests; one agent run/request; cut pipeline/Mode 2/flashcards/video verification | **Mostly taken**; **pipeline kept as mini 2-agent** (core Cline story); Mode 2 kept as fixed 5-question check |
| Business | Business slide; neutrality answer; YouTube legal line; coach heatmap | **Slides + README**; heatmap mock = COULD 7 |
| Government | DPDP slide/README; Hindi + NCERT default; teacher dashboard; "wrong user" | **Taken** as slides/README; JEE kept, with "same graph covers government-school Class 11-12" line |

---

## 23. Still open (only these)

1. **Name + headline:** at the end.
2. **Keys:** Gemini (AI Studio), Cline API (app.cline.bot, Settings, API Keys). Builder creates them; never pasted in chat.
3. **Real student** for 6:00-6:30pm (weak/average JEE aspirant).
4. **Verify before quoting:** Tele-MANAS 14416; DPDP child-data provisions; Gemini free-tier data terms; Embibe's diagnosis features.
