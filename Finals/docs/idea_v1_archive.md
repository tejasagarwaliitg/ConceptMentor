# idea.md: What We Are Building (v1, locked 2pm, 10 Oct 2026)

> Working title: **TBD. Name and headline are picked at the very end, by decision.**
> Event: Cline AI Builder Hackathon, Round 2. Deadline **8:00pm today**.
> Team: 1 non-developer (product + content review) + Cline (writes the code).
> Rule: this file is the single source of truth. If it is not here, we are not building it.

---

## 0. Reality check

| Fact | Consequence |
|---|---|
| It is 2pm. We have **6 hours, not 8**. | Scope is cut hard (section 17). Code freeze **5:15pm**. |
| The builder cannot code. | Builder owns product decisions, **content review**, the real-student test and the pitch. Cline owns all code. Nothing here assumes the builder can debug. |
| The PS wants a **working product a real person could use tomorrow**. | Real graph, real questions, real student test. Anything simulated is labelled "simulated". |
| Bonus for **Cline inside the product**. | The mentor agent runs on the Cline SDK, and so does the content pipeline. |
| Deliverables: public repo + README, PPT, **demo video showing Cline during the build**, optional social post. | About 2 hours reserved. Screen recording is already running. |

---

## 1. The problem

A JEE student gets a question wrong and concludes "I'm bad at physics." Usually the cause is smaller and older: a shaky Class 9-10 concept (vector components, trig ratios, slope as a derivative) that nobody noticed.

- Coaching teachers have hundreds of students and cannot see it.
- The student is too embarrassed to ask.
- The only feedback is an exam score: it says *that* they failed, not *why*.
- **"JEE-fication"**: shortcuts and tricks from coaching and YouTube let students get answers right without understanding the concept. Their own sense of "I know this" is unreliable. The foundation looks fine until a twisted question brings it down.

**User:** a Class 11-12 JEE (or board) student who already has teachers and content, and has **no one who knows how *they* think**.

---

## 2. The product in one line

**A mentor (bhaiya/didi) that finds the exact concept your understanding breaks on, including the ones you only pass by trick, sends you to the right 9 minutes of the teachers you already like, then comes back to check it stuck.**

It is a **diagnosis and routing layer on top of PW, Allen, YouTube and NCERT**. It does not replace teachers. *Cline coordinates tools to finish a job; this coordinates teachers to fix a student.*

### What it is NOT
- Not a tutor or content platform. Fixing = a teacher video / NCERT page + a 2-line hint + flashcards. No lectures.
- Not a leaderboard, test series or rank predictor.
- Not a career-verdict engine (slides only).
- Not a "learning styles" product. That theory is debunked; we never claim it.

---

## 3. Honest positioning

| Challenger | Honest answer |
|---|---|
| **ChatGPT / GPT-7** | A chatbot can run *one* decent diagnostic chat. It lacks a **checked JEE prerequisite graph**, **per-concept memory that decays and gets re-checked**, **code-graded answers** (not LLM opinion) and **proactive review**. A smarter model does not give you a durable, verified map of one student over months. |
| **Brainly / Doubtnut / PW AI** | They answer the question you asked. We find the question you *should* have asked. |
| **ALEKS / Khanmigo / Embibe / Squirrel AI** | The knowledge-graph idea is **not ours**. It is proven research (Knowledge Space Theory). *Unverified: how deep Embibe's JEE diagnosis goes. Check before any novelty claim on stage.* We never say "nobody has done this." |

### What is genuinely ours
1. **Fragile-mastery detection.** Others ask "did you get it right?" We ask "does it survive a twist?" Aimed at JEE-fication. **Our sharpest claim.**
2. **Router, not teacher.** Built around the student's own favourite teacher and free content. Opposite incentive to ed-tech: we tell you to watch *less*.
3. **A transparent cross-subject graph with fan-out.** "Fix vector components once: 6 physics + 4 maths topics unblocked." A chatbot cannot show this.
4. **A real Cline SDK agent with a visible decision trace.** Code decides what must be correct; the LLM talks and interprets.

Pitch line: *"Proven research (knowledge graphs, retrieval practice, spaced repetition), aimed at JEE-fication, with an agent built on the Cline SDK."* A sharp demo beats claimed originality.

---

## 4. Knowledge scope (Option A)

**JEE Mechanics (Physics) + Calculus & Vectors (Maths)**, sharing an Algebra/Trig/Graphs base.

Why: the overlap *is* the demo. Students who cannot differentiate fail kinematics, and nobody connects the two. Chemistry and other chapters go on the "What's next" slide.

**Graph size: about 32-36 nodes, capped.** Granularity is deliberately **coarse**. Finer graphs make diagnosis slow and "find my level" long, which kills retention.

Levels are a *data field*, never a sequence the student must climb.

| Level | Examples |
|---|---|
| L0 Foundations | ratio and proportion, linear/quadratic equations, graphs and slope intuition, units |
| L1 Keystones | trig ratios and identities, vector basics, straight-line geometry |
| L2 Bridges | vector components, dot/cross product (basic), derivative as rate, basic integration, differentiation rules |
| L3 Mechanics core | 1D kinematics, motion graphs, projectile, relative motion, Newton's laws, friction, work-energy |
| L4 Applications | JEE-style multi-step problems |

**Keystones** (high fan-out): trigonometry, vector basics, vector components, derivative as rate, slope. Only keystones may be split into 2-3 sub-nodes. Everything else stays one node.

---

## 5. Core concepts

### 5.1 Mastery states (per concept, per student)
"Green" does **not** mean "answered correctly." It means "answered correctly where a trick would not work."

| State | Meaning | Look (colour-blind safe: colour + icon) |
|---|---|---|
| Unknown | Not tested | grey, circle |
| Gap | Failed the standard question (A) | red, cross |
| **Fragile** | Passed A, failed a twist (B) or cross-context (C): **the trick-user** | amber, crack |
| Solid ("no weakness found yet") | Passed A and B/C with sensible confidence | green, tick |
| Inferred | Not tested, probably fine because a harder dependent node was passed. Provisional, **never counted as Solid** | pale green, dotted tick |
| Due | Solid, but its re-check date has passed | green, clock |

We never say "mastered". A few questions cannot prove understanding.

### 5.2 Three question types per node
| Type | Purpose | Example (vector components) |
|---|---|---|
| **A Standard** | Usual JEE form. A trick can pass it. | Components of 10 m/s at 30 degrees |
| **B Twist** | Same concept, surface changed so the common shortcut gives a wrong answer. **Every wrong option carries a misconception tag.** | Angle measured from the vertical, so "x = v cos(theta)" fails |
| **C Cross-context** | Same concept in the other subject | Components of a force on a slope, in a maths vector problem |

Tags (e.g. `uses_cos_always`, `degree_radian_mix`) mean a wrong answer says *why*, not only *that*. Each tag has a reviewed one-line **contrast** (wrong rule vs right rule), reused in hints and flashcards.

### 5.3 Careless vs concept errors
Every answer records a **confidence tap** (Pakka / Shayad / Guess) and response time. Both are already collected, so this costs almost nothing.

| Pattern | Reading | Bhaiya's move |
|---|---|---|
| Fast + Pakka + wrong | Overconfidence or carelessness | Calibration nudge, one more question |
| Slow + Guess + wrong | Genuine gap | Go one level down |
| Right + Guess | Lucky or shaky | Unverified, ask one more |
| Right on A, wrong on B | **Fragile** | "Tera formula yahan tak chalta hai, is twist pe nahi" |

Limit: one wrong twist can be a slip. **Fragile is only assigned after a second twist is also wrong** ("ek aur try?"). It is worded as an observation, never an accusation.

### 5.4 Time budgets
- Question Postmortem: **max 4 probes**; first useful insight under 2 minutes.
- Find My Level: **max 10 adaptive questions** (3-4 minutes), hard stop, then a result.

---

## 6. Two entry points, one engine

Both modes run the same adaptive search on the same graph and write to the same mastery record. Only the **start** and **direction** differ. One engine to build and test.

### Mode 1: Question Postmortem (the daily trigger)
1. Student pastes a question they got wrong (a DPP or PYQ question) and optionally the answer they got. Typed or pasted text only; no photos.
2. The agent maps it to an **entry node**. The LLM proposes, the engine validates against the node list, and the student confirms in one tap: "Ye **Projectile motion** ka sawal hai, sahi?" If unsure or out of scope: "Ye abhi mere map ke bahar hai." It never bluffs.
3. The engine tests the entry node with a **B (twist)** question. A pass means probably fine, so it exits fast. A fail drops to the most-suspect prerequisite, repeating up to the budget.
4. Output: a **root cause** plus **fan-out** ("Vector components. Isse 6 physics + 4 maths topics jude hain").
5. **Route**: 3 teacher options + 2-line hint + flashcards (sections 8-9).
6. A **check question** (B-type, fresh numbers). Pass schedules re-checks. Fail continues the search or offers a different teacher.

### Mode 2: Find My Level (optional; also "check me again")
- Starts at **keystones**, not L0. Adaptive: a pass on a higher node marks what it depends on as **Inferred** and skips it; a fail drops down.
- **Inference is never "Solid".** This answers the trick-user concern: passing a harder question by shortcut does not buy free green on the foundations beneath it. Keystones are always probed directly with twist questions.
- Next question = untested node with the most untested ancestors and descendants (most information). **If this heuristic misbehaves in testing, fall back to a fixed keystone order.** Do not tune it.
- Cap of 10 questions, then a **map, not a score**: "Trig solid. Vectors fragile." No percentile, no rank, no "Level 3 of 10".
- It is opt-in and can be gamified as *progress* (map filling in, "you unblocked N topics"), never as competition (section 10).

### Cold start (optional, 30 seconds, skippable)
1. Choose a mentor: **bhaiya or didi**, tone **aap / tum / tu**, and **Hindi-heavy / Hinglish / English-heavy**.
2. "Kaun sa teacher tujhe samajh aata hai?" Free text or a pasted channel link. Skippable.
3. Choose: "Ek sawal ka postmortem" or "Find my level (4 min)". No account, no forms.

---

## 7. The bhaiya/didi persona (a spec, not a vibe)

Personality is free. **Memory, proactivity and evidence are the product.**

| Behaviour | Concrete form |
|---|---|
| **Opens the conversation** | First message on app open, from real data: "Kal vectors ka re-check chhoda tha. 2 min mein kar lete hain?" Push notifications are out (fiddly on PWA); a WhatsApp/Telegram bot goes on the slide. |
| **Never shames, never involves parents** | Hard system-prompt rule, tested with adversarial inputs ("main bekaar hoon"). |
| **Honest with evidence** | "Pichhle 4 jawab 'Pakka' bolke galat the." Every claim cites a logged count. |
| **One next step** | Never a list of 5 things. |
| **Brief** | Respects the student's time. |
| **Remembers** | "Ye vector wali dikkat projectile mein bhi aayi thi." |

### Tone and language adaptation
- Student picks **register** (aap/tum/tu) and **language mix** up front, and can change it any time. Some people prefer "aap yahan galat ho"; others "tu yahan galat hai bhai".
- Bhaiya also **mirrors** the student's own writing style as a secondary signal. The explicit setting always wins over inference.
- Limit: tone adaptation is prompt-level. We verify with 5 fixed sample inputs per register. We do not claim "we detect your comfort level" as a feature.
- "Expandable to regional languages" is a **slide**, not a build item.

---

## 8. Routing: finding the right 9 minutes

**Hard rule: the LLM never produces a URL.** Models invent links with total confidence. URLs come only from (a) our curated list, (b) the YouTube Data API, or (c) the student. The UI renders only links that arrive in a tool result.

**Always 3 options, never push 1**, from different teachers, with a one-line difference each ("12 min, step-by-step" / "5 min, sirf formula derivation"). The student picks. Before any data exists, *he* is the signal.

| Source | How |
|---|---|
| **Student's favourite teacher** | Asked at onboarding (free text or channel link). We resolve the channel, then search *within that channel* for the node. A 70-subscriber teacher works, so we are never forced into Apna College. |
| **Curated shortlist** | For **keystone nodes only**: 2-3 teachers/videos hand-verified by the builder. This is the guaranteed fallback. Timestamps only on these. |
| **YouTube search** | For other nodes, cached. A language filter (Hindi/English) is applied. |
| **NCERT page** | Always available as the low-data alternative to video. |

**Learning signal:** a resource "worked" only if the **check question passed afterwards**, not if it was clicked. We store `resource -> check result` and prefer proven teachers *for this student*. No "learning style" claims.

### 8.1 My teachers (2-5) and AI video verification
- The student can add **2-5 favourite teachers/channels** (settings or onboarding). Searches for a concept run *inside those channels first*.
- **AI verification (Gemini video understanding on a public YouTube URL):** checks the video covers the target concept, the language, the rough level and the length, and **suggests a start timestamp** (MM:SS).
- **It runs once per (video, concept) and is cached.** Curated keystone videos are verified *before* the demo. Live verification happens only for videos a student adds. *Unverified: Gemini free-tier limits for video input; check before relying on it.*
- Timestamps are labelled **"AI-suggested"** until a human or the student confirms. We never present one as certain.
- If verification fails, errors out or the video is unavailable, fall back to the curated list or NCERT page.

### 8.2 "Did this help?" and fit warnings (honest version)
- After a video the student gets a one-tap **"Isse samajh aaya?"** (yes/partly/no) **and** the check question. The **check pass rate is the primary signal**; the tap is secondary. Liked is not the same as learned.
- Warnings only show **real counts**: "Is video ke baad 5 mein se 1 ne check pass kiya." **Minimum 5 attempts** before any warning appears. Zero data means no badge and no claim.
- The warning is private and framed as fit: "Ek aur option dekhna chahega?" Never a public "bad teacher" label.
- **Hackathon limit:** ratings are stored **per device** (no accounts, no server database), so "other students" aggregation is the roadmap slide. Any pre-seeded counts in the demo are labelled **"simulated"**.

**YouTube API limits (checked against docs):** `search.list` has its own bucket of **100 calls/day** by default; most other calls share 10,000 units. Therefore:
- Pre-fetch and cache search results for all nodes before the demo. Do not search live in front of judges.
- Search only when the student names a teacher or no cached result exists.
- Verify each video ID is live and embeddable via `videos.list` (1 unit) before showing it.
- Fallback when quota is exhausted: curated list + NCERT.
- Links open YouTube in a new tab. We do not scrape transcripts.

---

## 9. Hints, notes and flashcards (AI-generated, bounded)

We are not teachers, so this stays small. After routing, bhaiya gives:
- A **2-line hint** built from the matched misconception tag's reviewed contrast.
- **3-5 flashcards** from *this student's* wrong answers. One contrast per card: "wrong rule vs right rule", plus a fresh retrieval question.

**Why bounded:** LLMs make physics mistakes, and a wrong flashcard actively harms.
- The reviewed misconception `contrast` field is the source of truth. The LLM only personalises wording and sets the example.
- Any numeric answer on a flashcard is **recomputed by code** before display; a mismatch means the card is dropped.
- Cards are labelled **"AI-generated"**.
- Flashcards join the same 1/7/30 re-check schedule. That is retrieval practice, a pillar of the research we cite.

---

## 10. Accountability and "gamification" without cheating

**Principle: cheating needs something to win. Nothing here can be won.**

| Do | Don't |
|---|---|
| Map nodes turning red -> amber -> green | Leaderboards, points, XP, ranks, public scores |
| "You unblocked 9 topics" | Comparing students to each other |
| Compare a student **only to himself** ("vs. 2 weeks ago") | "Level 3 of 10" labels that read as a rank |
| Streak with **one built-in forgiveness day** | Streak that wipes weeks on one miss |
| Re-checks at **1, 7 and 30 days** after a node turns Solid; a failed re-check turns it amber | Notification spam |

- **Today panel:** up to 3 due re-check questions (about 3 minutes) plus the streak. It adds no new class to the day; it fits around the DPP routine the coaching already gave.
- **Exam-near mode ("3 din bache hain"):** sorts Gap/Fragile nodes by (PYQ frequency x fan-out) and shows the top 5. **Only if PYQ counts are sourced from real papers** for headline nodes, labelled "JEE Main, approx." with the source named. The AI is never allowed to produce those numbers. If we cannot source them, the feature is cut.
- **Study buddy** (accountability from a friend, not a parent): slide only. It needs two users and a backend. Stretch: a "share my weak spots" link with state encoded in the URL.

---

## 11. The agent: Cline SDK, code, and who decides what

**Principle: code decides what must be correct. The LLM interprets and talks.**

If the engine did everything, the agent would be decorative. So the split is deliberate:

| The agent (LLM) does | Code (tools) does |
|---|---|
| Maps messy pasted text to an entry node | Validates that node exists; walks prerequisites |
| Reads free-form replies ("pata nahi yaar", "ye toh trick se hota hai") | Grades MCQ/numeric answers, records confidence and timing |
| Chooses when to hint, route or push on | Updates mastery state; schedules re-checks |
| Writes in the student's tone and language | Supplies the question, options, tags, resource URLs |
| Explains *why* it suspects a gap, citing logged counts | Computes fan-out and PYQ numbers |

**Planned tools** (Cline SDK `createTool` + zod schemas; names final at build):
`find_entry_node`, `get_prerequisites`, `next_probe`, `grade_answer`, `update_mastery`, `get_fanout`, `route_resources`, `make_flashcards`, `schedule_recheck`, `finish_diagnosis` (ends the run via `completesRun`).

**Visible decision trace:** the UI shows each tool call as a compact "bhaiya ne kya socha" panel. It proves the agent is real and earns the "Cline inside the product" points.

**Stateless by design:** the client holds the student state (localStorage) and sends it with each request; the server returns the updated state. This avoids the SDK's persistence layer and suits serverless hosting.

### Model choices (be realistic)
- **Dev/default:** Gemini via Google AI Studio (free tier). *Limits and data-use terms must be checked at signup.*
- **Also possible:** OpenRouter or NVIDIA-hosted models via the SDK's `openai-compatible` provider (untested).
- **Cline $40 credits:** usable for the Cline extension while *building*, and **very likely for the in-product model via the Cline API**: an OpenAI-compatible endpoint (`https://api.cline.bot/api/v1/chat/completions`, key created at app.cline.bot, model ids like `anthropic/claude-sonnet-4-6`, some free models) used through the SDK's `openai-compatible` provider. *Documented but not yet run by us; tested in Gate G1.* **Decision: develop on Gemini free, switch to a Cline-API model for the demo.** The key is created by the builder, kept in `.env.local`, never committed, never pasted into chat.
- **Skipped: freellmapi.** An unverified proxy pooling free keys: privacy and reliability risk for a student product and a live demo.
- **Gate G1 (by 2:45pm):** a tool-calling loop works reliably on the chosen model. Weak models fumble tool calls. If it fails: switch model, or use a small paid key for demo day.

---

## 12. Content pipeline: independent Cline subagents

Hand-writing about 100 questions is not viable and would hide the AI. Blindly trusting AI output is fatal (a wrong key in a live demo). The middle path is **independent agents checking each other**, built on the Cline SDK's sub-agent / team features (`enableSpawnAgent` or `enableAgentTeams`; teammates get a task board and mailbox).

| Agent | Job | Independence rule |
|---|---|---|
| **Architect** | Proposes nodes, prerequisites, levels, keystone flags | Output reviewed by the builder before generation starts |
| **Question writer** | Drafts A/B/C questions, tagged distractors, contrasts | Never sees the solver's output |
| **Blind solver** | Solves every question **without the answer key** | Disagreement with the key = question discarded |
| **Code verifier** | For numeric items, writes a separate small JS computation and compares to the key | Mismatch = discard |
| **Adversary** | Tries to find a *second* correct option, an ambiguous stem, or a twist where the trick still works | Any hit = rewrite |

- **Human review is concentrated:** the builder reviews all keystone nodes and everything on the demo path. Remaining nodes ship flagged "AI-verified, not human-reviewed".
- **"AI grows the graph":** re-running the pipeline on a new topic is the extension story. That is a strong Cline narrative.
- Quality is measured, not assumed: we log the discard rate. Do not claim accuracy figures we have not measured.
- **Videos are the exception:** never generated by the LLM (section 8).
- Risk: if the pipeline produces junk by **4:00pm**, fall back to the builder hand-fixing the demo path only (about 12 nodes) and the rest shipping as "beta".

---

## 13. Tech stack (chosen for a non-developer + Cline)

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js (App Router) + TypeScript + Tailwind** | One repo, API routes as backend, mobile-friendly, deploys with one click |
| Graph view | **React Flow** | Fast to build; node colour is a state change |
| Maths rendering | **KaTeX** | Physics/maths text must render correctly (to be added) |
| Agent | **@cline/sdk** (Node 22+; machine has Node 24) | Required for the "Cline inside" bonus |
| Models | Gemini (free) by default; see section 11 | Cost and access |
| Storage | **Browser localStorage** + "export/import my progress" JSON | No accounts, no database, no minors' data on our servers |
| Hosting | **Vercel** | Free, public link for judges |
| Video data | YouTube Data API v3 | Real video IDs only |

**Hosting risk:** the SDK on Vercel serverless is **not yet verified**. Gate G1 also tests this. Plan B: run the Next.js server locally for the demo or deploy it on a Node host. Do not discover this at 6pm.

**Mobile-first PWA**: runs in Chrome on a low-end Android with nothing to install. Affordability claims we can make honestly:
- Graph traversal and grading are plain code, so model calls per session are few (low cost).
- Content is free (NCERT, YouTube); NCERT pages are the low-data option.
- No account or login.

**Tooling in place:** Node 24, npm, git, Homebrew. **Missing:** GitHub CLI, Cline CLI, model key, YouTube key, git user name. All set up in T0.

---

## 14. Screens (mobile-first)

1. **Home / Today**: bhaiya's opening message, due re-checks, streak, two big buttons ("Sawal ka postmortem", "Find my level").
2. **Postmortem chat**: paste, confirm node, probe cards (tap answer, then confidence tap), root-cause reveal.
3. **Map**: the **full graph** collapsed by cluster (Foundations / Vectors / Calculus / Mechanics), expand on tap. Highlights "you are here" and the path from the failed question to the root. States via colour **and** icon. Tap a node for its fan-out and history.
4. **Fix card**: 3 teacher options, 2-line hint, flashcards, then the check question.
5. **Settings**: mentor, tone, language, favourite teacher, export/import progress, "delete my data".

Optional (if time): a small **evidence card** with 2-3 trait-like observations (e.g. calibration), each citing a count. Off by default.

---

## 15. Privacy, safety and ethics

- Students may be minors. **No accounts, no data stored on our servers**; progress lives in the browser.
- **But:** question text is sent to the model provider. *Free tiers may retain or train on inputs; verify before launch and state it plainly in the README.*
- Never tell a student "you are not X." Observations are patterns that change, backed by counts.
- Never give a career verdict. The career layer (slide) is "evidence plus questions to ask yourself."
- Never shame, never contact parents.
- A student can clear localStorage and lose everything. Export/import mitigates it. Multi-device sync is "What's next".

---

## 16. Build plan (2:00pm -> 8:00pm)

| Time | Work | Gate |
|---|---|---|
| 2:00-2:30 | **T0 setup**: create the Next.js repo, push public, get Gemini + YouTube keys, set git user, install `@cline/sdk` | |
| 2:30-2:45 | SDK hello-tool test on Gemini, also hosting check | **G1: tool-calling works** (else switch model) |
| 2:45-3:45 | **Parallel A:** content pipeline v1 on the demo path first (vectors, trig, components, derivative, kinematics, projectile). **Parallel B:** Cline builds the engine, state model and graph loader. Builder reviews keystones as they land. | |
| 3:45-4:30 | Mode 1 end-to-end: agent + tools + UI | **G2 (4:00): content usable?** else hand-fix demo path only |
| 4:30-5:15 | Map view, routing (curated + cached YouTube), flashcards, Today panel, tone settings, Mode 2 basic | **FREEZE 5:15** |
| 5:15-6:00 | **Real JEE student test** + bug fixes only. No new features. | |
| 6:00-7:30 | README, PPT, demo video (reuse the build footage), social post | |
| 7:30-8:00 | Submit. Buffer. | |

This is extremely tight. If behind at any gate, cut in the order of section 17. **Never cut the end-to-end loop to keep an extra.**

---

## 17. Scope tiers

| Tier | Features |
|---|---|
| **MUST** | Graph (about 30 nodes) with keystones and fan-out; one engine; **Mode 1 end-to-end**; mastery states incl. **Fragile** with A/B questions; confidence tap; code grading; live map; 3-option routing (curated + NCERT); Today panel with 1/7/30 re-checks; persona with tone setting; decision trace; localStorage |
| **SHOULD** | Mode 2 basic (fixed keystone order, simple inference); flashcards; YouTube favourite-teacher search; misconception tags on all keystones; C-type cross-context questions |
| **COULD (cut in this order)** | 1) PYQ counts and exam-near mode; 2) heuristic next-question for Mode 2; 3) evidence card; 4) share-link buddy; 5) mirroring tone adaptation |
| **SLIDES ONLY** | Study buddy, career profile (evidence plus questions, never a verdict), JoSAA lens, olympiad suggestions, WhatsApp bot, more chapters/subjects, regional languages, parent view |
| **DEAD** | Leaderboards, points/XP, Pomodoro, photo and voice input, native app, accounts, AI-generated video lessons, rank prediction, learning-styles claims |

---

## 18. Loopholes and risks (critical, with mitigations)

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Time: 6 hours, builder cannot code.** | Gates G1/G2, freeze at 5:15, strict cut order |
| 2 | **Wrong answer key in the demo** | Blind solver + code verifier + adversary + builder review of the demo path |
| 3 | **Free model: weak tool-calling or rate limits mid-demo** | G1; response caching; recorded backup demo; paid fallback key |
| 4 | **SDK not hosting cleanly on Vercel** | Tested in G1; Plan B local/Node host |
| 5 | **Trick-user false positive** | Twist questions; Fragile state; Inferred never = Solid |
| 6 | **Fragile mislabelled from one slip** | Needs a second wrong twist; worded as observation |
| 7 | **Guessing on MCQ** | Confidence tap; second question on Guess-right |
| 8 | **Wrong diagnosis erodes trust** | Check question after fix; failure continues the search |
| 9 | **Strong student wastes time** | Pass on the first twist exits in 30 seconds |
| 10 | **Out-of-scope question** | Say so honestly; never bluff |
| 11 | **Hallucinated links** | LLM never emits URLs; allowlist check |
| 12 | **YouTube quota (100 search/day)** | Pre-cache; curated fallback; do not search live on stage |
| 13 | **Student dislikes the suggested teacher** | 3 options; his teacher first; outcome-based learning |
| 14 | **Flashcard physics errors** | Reviewed contrasts; code-checked numbers; "AI-generated" label |
| 15 | **Math rendering** | KaTeX |
| 16 | **Data loss in localStorage** | Export/import; stated limit |
| 17 | **Privacy of minors + provider data use** | No accounts; verify provider terms; disclose in README |
| 18 | **Over-claiming** | No accuracy or efficacy numbers unless measured. A test with 1-3 real students proves usability, **not** effectiveness. Say so. |
| 19 | **"Isn't this ALEKS/Embibe?"** | Concede the base; lead with fragile-mastery, routing, the Cline agent |
| 20 | **Demo failure on stage** | Rehearse 3x; backup recording; pre-test the exact question 5 times |
| 21 | **Scope creep (our proven habit)** | Anything new goes on a slide unless it replaces something in MUST |

---

## 19. The 3-minute demo

1. **(20s) Hook:** "Tricks se answer sahi, concept se nahi." Raise-your-hand: who got a projectile question right by formula?
2. **(80s) Live postmortem:** a real student (or a clearly labelled replay) pastes a wrong projectile question. Bhaiya maps it, probes in 3 questions, and the map lights up backwards. **Fragile** is caught: right on the standard question, wrong on the twist. Root cause "vector components", fan-out "10 topics". Routing shows 3 teachers, including the student's own.
3. **(40s) Fix and proof:** a teacher video, a flashcard, a check question; the node goes green; the 1/7/30 re-check is scheduled.
4. **(25s) Under the hood:** the decision trace. "This is a Cline SDK agent. The LLM talks; code decides. The pipeline that built the question bank is also Cline sub-agents."
5. **(15s) What's next:** one slide with the career lens, study buddy, WhatsApp, more subjects.

---

## 20. Deliverables checklist

- [ ] **GitHub repo (public) + README**: problem, solution, architecture, stack, setup, how Cline was used (build + in product)
- [ ] **PPT**: problem, insight, product, demo, architecture, models/tools, Cline in build, Cline in product, challenges, future scope, vision slide
- [ ] **Demo video** (mandatory) with a real user scenario, **showing Cline working during the build**. Recording has started; keep the footage.
- [ ] Social post tagging Cline (brownie points)
- [ ] Cline evidence: commits, session logs, screenshots of agent runs

---

## 21. Still open

1. **Name and headline:** decided last, by choice.
2. **Model keys:** Gemini key + YouTube key + a Cline API key (app.cline.bot) needed at T0. Cline-API-through-SDK is documented but untested (G1).
3. **Real student:** who, and available at 5:15pm?
4. **PYQ source:** a real, citable chapter-wise analysis, or cut the feature.
5. **Embibe check:** quick review of what existing JEE diagnosis tools do, before the novelty slide.
6. **Mentor persona:** both bhaiya and didi selectable (assumed yes).
