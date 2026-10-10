/**
 * Deterministic defer-by-chat intent parser (WP-C). No model, no network. Pure.
 * Understands English + Hinglish postponements; anything else is "none"
 * and the caller replies with the button fallback template.
 */

export type ReminderIntent =
  | { kind: "postpone"; days: 1 | 3 | 7 }
  | { kind: "done" }
  | { kind: "help" }
  | { kind: "stop" }
  | { kind: "none" };

const NEG = /nahi|nhi\b|\bnot\b|n't|\bno\b|mat\b/;

function has(t: string, ...words: string[]): boolean {
  return words.some((w) => t.includes(w));
}

export function parseReminderIntent(raw: string): ReminderIntent {
  const t = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (!t) return { kind: "none" };

  // stop first: honor it even if other words match
  if (/^\/stop\b/.test(t) || has(t, "unsubscribe", "reminder band", "band kar do", "stop reminders", "mat bhejo")) {
    return { kind: "stop" };
  }
  // /start without a code, or explicit help
  if (/^\/start\b/.test(t) || has(t, "help", "madad", "kaise karu", "kya likhu", "options dikhao")) {
    return { kind: "help" };
  }
  // done (guarded: "nahi ho payega" must NOT read as done)
  if (!NEG.test(t) && has(t, "ho gaya", "ho gya", "kar liya", "done", "complete", "finished", "attempt kar liya", "check kar liya")) {
    return { kind: "done" };
  }
  // explicit week
  if (has(t, "hafte", "hafta", "week", "7 din", "7 days")) return { kind: "postpone", days: 7 };
  // explicit few days (parson / do din have no exact slot; 3 is the nearest honest choice,
  // and the reply template always states what was understood)
  if (has(t, "3 din", "teen din", "3 days", "parson", "parso", "2 din", "do din", "2 days")) {
    return { kind: "postpone", days: 3 };
  }
  // tomorrow / morning / can't-today (default snooze is +1; the template states it plainly)
  if (
    has(
      t,
      "kal",
      "tomorrow",
      "subah",
      "morning",
      "unable",
      "can't",
      "cant",
      "function",
      "shaadi",
      "shadi",
      "busy",
      "tired",
      "thak gaya",
      "thak gayi",
      "time nahi",
      "mood nahi",
      "nahi ho",
      "nahi hoga",
      "ho payega",
      "aaj nahi",
      "aaj time"
    )
  ) {
    return { kind: "postpone", days: 1 };
  }
  return { kind: "none" };
}
