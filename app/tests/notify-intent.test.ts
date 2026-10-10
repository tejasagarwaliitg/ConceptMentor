import { describe, expect, it } from "vitest";
import { parseReminderIntent } from "@/lib/notify/intent";

const cases: [string, ReturnType<typeof parseReminderIntent>][] = [
  // the headline conversation: can't study today, will cover tomorrow
  ["bhaiya i am unable to study today, i have a function. i will cover it tomorrow", { kind: "postpone", days: 1 }],
  ["kal karunga, aaj function hai", { kind: "postpone", days: 1 }],
  ["tomorrow please", { kind: "postpone", days: 1 }],
  ["aaj time nahi hai, kal pakka", { kind: "postpone", days: 1 }],
  ["busy hoon, subah yaad dilana", { kind: "postpone", days: 1 }],
  ["bahut tired hoon, kal", { kind: "postpone", days: 1 }],
  ["shaadi mein hoon, kal karunga", { kind: "postpone", days: 1 }],
  ["aaj nahi ho payega", { kind: "postpone", days: 1 }],
  // few days
  ["3 din baad yaad dilana", { kind: "postpone", days: 3 }],
  ["teen din baad", { kind: "postpone", days: 3 }],
  ["parson karunga", { kind: "postpone", days: 3 }],
  // week
  ["hafte baad", { kind: "postpone", days: 7 }],
  ["ek hafte baad yaad dilana", { kind: "postpone", days: 7 }],
  ["next week", { kind: "postpone", days: 7 }],
  // done (bot never marks completion itself; the reply says to open the app)
  ["ho gaya bhaiya", { kind: "done" }],
  ["check kar liya", { kind: "done" }],
  ["done", { kind: "done" }],
  // "nahi ho payega" is inability, never done
  ["nahi ho payega aaj", { kind: "postpone", days: 1 }],
  // stop / help
  ["/stop", { kind: "stop" }],
  ["reminders band kar do", { kind: "stop" }],
  ["/start", { kind: "help" }],
  ["help", { kind: "help" }],
  // gibberish / unrelated -> button fallback
  ["aur batao", { kind: "none" }],
  ["physics kya hai", { kind: "none" }],
  ["", { kind: "none" }],
];

describe("reminder intent parser", () => {
  for (const [text, expected] of cases) {
    it(JSON.stringify(text), () => {
      expect(parseReminderIntent(text)).toEqual(expected);
    });
  }
});
