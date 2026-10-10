import type { SessionOutcome } from "./types";

/** English-only, student-facing product copy. Templates only; model output never reaches the student. */
export function t(_legacyPreference?: string) {
  void _legacyPreference;
  return {
    aiDisclosure: "This is an AI mentor, not a person.",
    dataNote: "No account is needed. Progress stays in this browser. In this mode, nothing is sent to AI. Do not enter your name or phone number.",
    startTitle: "Where would you like to start?",
    chapter: "Choose a chapter",
    sample: "Try a sample question",
    guest: "Using a shared device? Start a guest session",
    later: "Take a break",
    pataNahi: "I don't know",
    wordingVoid: "I don't understand this question",
    pakka: "Sure",
    shayad: "Somewhat sure",
    guess: "Guessing",
    confidenceQ: "How confident are you?",
    dispute: "This doesn't explain my mistake",
    immediatePassed: "Immediate check passed; retention untested.",
    disputeReply: "Understood. We'll set that estimate aside. Where did you get stuck?",
    outcomes: {
      suspected_gap: (name: string, live: number, planned: number) =>
        `Possible contributing gap: ${name}. It connects to ${live} other concepts in this map and ${planned} planned concepts.`,
      no_prereq_weakness: "This check did not find difficulty with an earlier concept. The original problem is still unresolved.",
      inconclusive: "There is not enough evidence to draw a conclusion from this check.",
      out_of_scope: "This topic is outside the current map. Choose another chapter to explore.",
      below_coverage: "The difficulty may begin before the earliest concept covered here. Start with the NCERT reference below.",
      student_disputed: "Understood. We'll set that estimate aside. Where did you get stuck?",
    } as Record<SessionOutcome, string | ((name: string, live: number, planned: number) => string)>,
    stuckTitle: "Where did you get stuck?",
    stuckOptions: { setup: "Choosing a model or equation", calculation: "Working through the calculation", interpretation: "Understanding what the question asks", dontKnow: "I'm not sure" },
    askTeacher: (topic: string) => `I got stuck on a ${topic} question. Earlier concepts seemed okay, but I couldn't follow the setup or meaning. Could you help me work through it?`,
    checkNow: "Try a quick check",
    readInstead: "Review this explanation",
    watch: "Watch a video",
    moreOptions: "Other ways to review",
    reportWrong: "Report a problem with this question",
    todayGreeting: (due: number) => due > 0 ? `${due} ${due === 1 ? "concept is" : "concepts are"} ready for a review.` : "Welcome back. What are you working on today?",
    simulateLabel: "SIMULATED (demo only)",
    remind: {
      linkDisclosure: "Only due review reminders are sent. Reply to postpone a review, or send /stop to stop reminders.",
      codeReady: (code: string) => `Open the Telegram bot and send /start ${code}. This code expires in 10 minutes.`,
      linked: "Connected. We will remind you when a review is due.",
      nudge: (name: string) => `A short review is ready: ${name}. Open the app when you are ready.`,
      postponed: (days: 1 | 3 | 7) => `Your review reminder is postponed by ${days} ${days === 1 ? "day" : "days"}.`,
      doneReply: "Open the app and complete the check so your review result is recorded.",
      fallback: "Try tomorrow, 3 days, next week, or done. You can also use the buttons below.",
      stopped: "Reminders stopped. You can reconnect in Settings anytime.",
      needLink: "Get a link code from the app Settings, then send /start <code>.",
      appliedInApp: "Your review reminder was updated from your Telegram reply.",
      gentleNudge: "A short review is ready whenever you want to return.",
    },
  };
}
