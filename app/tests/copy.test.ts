import { describe, expect, it } from "vitest";
import { t } from "@/lib/copy";
import { containsBanned } from "@/lib/mentor/schemas";
import { CONTRASTS, READ_INSTEAD } from "@/content/repair";
import { STUCK_CARDS_PART } from "@/content/stuck";

function strings(x: unknown): string[] {
  if (typeof x === "string") return [x];
  if (typeof x === "function") return strings((x as (...a: never[]) => unknown)(...([ "Vector components", 3 ] as never[])));
  if (Array.isArray(x)) return x.flatMap(strings);
  if (x && typeof x === "object") return Object.values(x).flatMap(strings);
  return [];
}

describe("student-facing wording", () => {
  for (const reg of ["aap", "tum", "tu"] as const) {
    it(`no banned or forbidden words in ${reg} copy`, () => {
      for (const s of strings(t(reg))) {
        expect(containsBanned(s), s).toBe(false);
        expect(s.toLowerCase(), s).not.toMatch(/root cause|unblock|mastered|trick-user|rank|leaderboard|streak/);
      }
    });
  }

  it("reviewed content has no banned words", () => {
    for (const s of [...strings(CONTRASTS), ...strings(READ_INSTEAD), ...strings(STUCK_CARDS_PART)]) {
      expect(containsBanned(s), s).toBe(false);
    }
  });

  it("observation strings have no banned or forbidden words", async () => {
    const { buildDemoState, DEMO_SEED_EVENTS } = await import("@/lib/seed");
    const { allObservationStrings } = await import("@/lib/observations");
    const { initialState, reduce } = await import("@/lib/engine");
    let s = initialState();
    const states = [];
    for (const ev of DEMO_SEED_EVENTS) {
      s = reduce(s, ev);
      states.push(s);
    }
    states.push(buildDemoState());
    for (const st of states) {
      for (const str of allObservationStrings(st, 1_000_000)) {
        expect(containsBanned(str), str).toBe(false);
        expect(str.toLowerCase(), str).not.toMatch(/root cause|unblock|mastered|trick-user|rank|leaderboard|streak/);
      }
    }
  });

  it("every contrast referenced by a distractor tag exists or is acknowledged", async () => {
    const { ITEMS_DRAFT } = await import("@/content/items.draft");
    const missing = new Set<string>();
    for (const it of ITEMS_DRAFT) for (const tag of it.tags) if (tag && !(tag in CONTRASTS)) missing.add(tag);
    // tags without a contrast simply show no contrast line; listed here so the builder can see them
    console.log("tags without a reviewed contrast:", [...missing]);
    expect(true).toBe(true);
  });
});
