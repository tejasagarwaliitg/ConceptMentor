import { describe, expect, it } from "vitest";
import { initialState, reduce } from "@/lib/engine";
import { buildDemoState, DEMO_SEED_EVENTS } from "@/lib/seed";

describe("demo seed by reducer replay (D-07)", () => {
  it("yields checked_immediate, retained, and context_difficulty with no live session", () => {
    const s = buildDemoState();
    const states = new Set(Object.values(s.nodes).map((r) => r!.state));
    expect(states.has("checked_immediate")).toBe(true);
    expect(states.has("retained")).toBe(true);
    expect(states.has("context_difficulty")).toBe(true);
    expect(s.session).toBeUndefined();
  });

  it("produces an honest no_prereq_weakness outcome mid-replay", () => {
    let s = initialState();
    const outcomes = new Set<string>();
    for (const ev of DEMO_SEED_EVENTS) {
      s = reduce(s, ev);
      if (s.session?.outcome) outcomes.add(s.session.outcome);
    }
    expect(outcomes.has("no_prereq_weakness")).toBe(true);
  });

  it("keeps pakka calibration at 70 to 80 percent correct", () => {
    const pakka = DEMO_SEED_EVENTS.filter(
      (e) => e.type === "graded" && e.answer.confidence === "pakka"
    );
    const correct = pakka.filter(
      (e) => e.type === "graded" && e.answer.correct === true
    ).length;
    expect(pakka.length).toBeGreaterThan(0);
    const ratio = correct / pakka.length;
    expect(ratio).toBeGreaterThanOrEqual(0.7);
    expect(ratio).toBeLessThanOrEqual(0.8);
  });

  it("is reproducible: two consecutive builds give identical node states", () => {
    const a = buildDemoState();
    const b = buildDemoState();
    expect(JSON.stringify(a.nodes)).toBe(JSON.stringify(b.nodes));
    expect(JSON.stringify(a.seenInstances)).toBe(JSON.stringify(b.seenInstances));
  });
});
