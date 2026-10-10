# Requirements — Phase 1: Profile system

| ID | Requirement |
|----|-------------|
| PROF-01 | Login: app asks who is using it on entry — profile picker with demo account + fresh profile creation (name, class, target exam) |
| PROF-02 | Remember the user with no login expiry — active profile persists across restarts indefinitely |
| PROF-03 | Per-profile progress — each profile owns a full engine `StudentState` (nodes, weekly, re-checks) |
| PROF-04 | Per-profile strengths & weaknesses — evidence-backed view computed from real engine state and answer logs |
| PROF-05 | Per-profile revision framework — spaced re-checks (+1/+7/+30) and due items surfaced per profile, student-chosen commitment |
| PROF-06 | Seeded demo account with reproducible history and visible "simulated data" badge |

# Requirements — Phase 2: YouTube redirection

| ID | Requirement |
|----|-------------|
| YT-01 | Repair video section shows max 2 curated videos per node with verified start time, length + size, no autoplay (idea.md §6.2 step 5, §8) |
| YT-02 | Priority order honours preferred teacher first, then student's own "Samajh aaya?" preference; reorder only, never effectiveness claims |
| YT-03 | Model never emits URLs — agent/tools pick allowlist resource IDs only; UI renders links from reviewed `resources.json` with youtube.com/youtu.be host validation |
| YT-04 | Weak-topic traversal nudge: when a prerequisite node is gap/context_difficulty, prompt completing its concepts before proceeding (one next action, honest wording) |
| YT-05 | Low-data toggle hides videos; missing/pending curation degrades to NCERT read-instead, never blank |
