/**
 * Safety gate (idea.md 11.5). Runs BEFORE any processing of free text, in both modes.
 * Keyword lists miss things; this is a first line, not a guarantee (stated in the README).
 */

export const HELPLINE = {
  name: "Tele-MANAS",
  number: "14416",
  note: "free, 24x7 (verify before shipping)",
};

const DISTRESS = [
  "marna chahta",
  "marna chahti",
  "mar jaana",
  "mar jana",
  "jeena nahi",
  "jeene ka mann nahi",
  "khud ko khatam",
  "suicide",
  "kill myself",
  "end my life",
  "want to die",
  "don't want to live",
  "dont want to live",
  "self harm",
  "self-harm",
  "aatmahatya",
  "आत्महत्या",
  "मरना चाहता",
  "मरना चाहती",
  "जीना नहीं",
];

const ABUSE = ["madarchod", "behenchod", "bhosdi", "chutiya", "fuck", "bitch"];

export type SafetyVerdict =
  | { kind: "ok" }
  | { kind: "distress"; message: string }
  | { kind: "abuse"; message: string };

export function checkText(text: string): SafetyVerdict {
  const t = text.toLowerCase().replace(/\s+/g, " ");
  if (DISTRESS.some((k) => t.includes(k))) {
    return {
      kind: "distress",
      message:
        `Lagta hai tum abhi bahut bhaari mehsoos kar rahe ho. Tum akele nahi ho. ` +
        `Kisi bharose ke insaan se baat karo, ya ${HELPLINE.name} par ${HELPLINE.number} dial karo (${HELPLINE.note}). ` +
        `Padhai baad mein bhi ho jayegi.`,
    };
  }
  if (ABUSE.some((k) => t.includes(k))) {
    return { kind: "abuse", message: "Chalo, seedhe sawal par aate hain. Kaunsa chapter dekhna hai?" };
  }
  return { kind: "ok" };
}

/** Remove phone numbers and emails before anything leaves the device (11.4). */
export function scrubPII(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/(?:\+?\d[\s-]?){10,13}/g, "[number]");
}

export const LIMITS = { paste: 1500, attempt: 500, message: 300 } as const;
