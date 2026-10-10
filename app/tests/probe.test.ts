import { describe, expect, it } from "vitest";
import { initialState, levelQueueOf, nextStep, reduce } from "@/lib/engine";
import { ans, give, start } from "./helpers";

describe("check my level: the check keeps walking after a right answer", () => {
  it("a cleared entry node continues to its supporting concepts instead of ending", () => {
    let s = start("projectile");
    s = give(s, ans("projectile", "B1", true, "pakka"));
    expect(s.session!.probed.projectile).toBe("no_difficulty_found");
    // the session did NOT end: the next question is a supporting concept
    expect(s.session!.outcome).toBeUndefined();
    expect(nextStep(s.session!)).toMatchObject({ kind: "item", itemType: "B1" });
    const nextNode = nextStep(s.session!).node;
    expect(["vec_comp", "kin_1d"]).toContain(nextNode);
  });

  it("the whole a/b/c chain is checked on right answers, then reports no weakness", () => {
    let s = start("vec_comp");
    let guard = 0;
    while (nextStep(s.session!).kind === "item" && guard++ < 10) {
      const step = nextStep(s.session!);
      if (step.kind !== "item" || !step.node || !step.itemType) break;
      s = give(s, ans(step.node, step.itemType, true, "pakka"));
    }
    expect(s.session!.outcome).toBe("no_prereq_weakness");
    expect(Object.keys(s.session!.probed).length).toBeGreaterThan(1);
  });
});

describe("check your level cards: a queue fed by cleared nodes", () => {
  it("starts with the four entry topics", () => {
    expect(levelQueueOf(initialState()).slice(0, 4)).toEqual(["projectile", "kin_1d", "motion_graphs", "vec_comp"]);
  });

  it("a cleared (solved) node leaves the queue and the topics it advances to join", () => {
    let s = start("slope");
    s = give(s, ans("slope", "B1", true, "pakka")); // slope cleared
    const q = levelQueueOf(s);
    expect(q).not.toContain("slope"); // solved node removed (if present)
    expect(q).toContain("deriv_rate"); // dependent joins even though it was not listed
    expect(q).toContain("motion_graphs"); // dependent already queued is not duplicated
    expect(q.filter((n) => n === "motion_graphs")).toHaveLength(1);
    // first 4 shown on the landing page are simply the head of the queue
    expect(q.slice(0, 4)).toEqual(["projectile", "kin_1d", "motion_graphs", "vec_comp"]);
  });

  it("a repaired (fixed) node also leaves the cards and unlocks its dependents", () => {
    let s = start("vec_comp");
    s = give(s, ans("vec_comp", "B1", false));
    s = give(s, ans("vec_comp", "A", true)); // context difficulty
    s = give(s, ans("vec_comp", "B2", true)); // repair check passed -> fixed
    const q = levelQueueOf(s);
    expect(q).not.toContain("vec_comp");
    expect(q).toContain("projectile");
  });
});

describe("node probe (5.3)", () => {
  it("B1 correct + confident -> no_difficulty_found in 1 item", () => {
    let s = start("trig");
    s = give(s, ans("trig", "B1", true, "pakka"));
    expect(s.session!.probed.trig).toBe("no_difficulty_found");
    expect(s.session!.probeCount).toBe(1);
  });

  it("B1 correct but Guess -> asks A; A wrong -> gap", () => {
    let s = start("trig");
    s = give(s, ans("trig", "B1", true, "guess"));
    expect(s.session!.probed.trig).toBeUndefined();
    expect(nextStep(s.session!)).toMatchObject({ kind: "item", node: "trig", itemType: "A" });
    s = give(s, ans("trig", "A", false));
    expect(s.session!.probed.trig).toBe("gap");
  });

  it("B1 wrong + A right -> context_difficulty (two observations)", () => {
    let s = start("vec_comp");
    s = give(s, ans("vec_comp", "B1", false));
    s = give(s, ans("vec_comp", "A", true));
    expect(s.session!.probed.vec_comp).toBe("context_difficulty");
  });

  it("B1 wrong + A wrong -> gap", () => {
    let s = start("vec_comp");
    s = give(s, ans("vec_comp", "B1", false));
    s = give(s, ans("vec_comp", "A", false));
    expect(s.session!.probed.vec_comp).toBe("gap");
  });

  it("void (wording) items consume no budget and carry no evidence", () => {
    let s = start("trig");
    s = give(s, ans("trig", "B1", null));
    expect(s.session!.probeCount).toBe(0);
    expect(s.session!.probed.trig).toBeUndefined();
    s = give(s, ans("trig", "A", true));
    expect(s.session!.probed.trig).toBe("untested");
    expect(s.nodes.trig).toBeUndefined();
  });
});

describe("demo path fits in 6 probes (5.6)", () => {
  it("projectile -> vec_comp suspected, kin_1d not checked", () => {
    let s = start("projectile");
    s = give(s, ans("projectile", "B1", false));
    s = give(s, ans("projectile", "A", true));
    s = give(s, ans("vec_comp", "B1", false));
    s = give(s, ans("vec_comp", "A", true));
    s = give(s, ans("trig", "B1", true, "pakka"));
    s = give(s, ans("vec_basics", "B1", true, "pakka"));
    const sess = s.session!;
    expect(sess.probeCount).toBe(6);
    expect(sess.outcome).toBe("suspected_gap");
    expect(sess.suspected).toBe("vec_comp");
    expect(sess.notChecked).toContain("kin_1d");
  });
});

describe("honest outcomes (5.5)", () => {
  it("no weakness found -> no_prereq_weakness", () => {
    let s = start("kin_1d");
    for (let i = 0; i < 6 && !s.session!.outcome; i++) {
      const step = nextStep(s.session!);
      if (step.kind !== "item") break;
      s = give(s, ans(step.node!, step.itemType!, true, "pakka"));
    }
    expect(s.session!.outcome).toBe("no_prereq_weakness");
  });

  it("student dispute ends the hypothesis", () => {
    let s = start("projectile");
    s = give(s, ans("projectile", "B1", false));
    s = reduce(s, { type: "dispute" });
    expect(s.session!.outcome).toBe("student_disputed");
  });

  it("a chain of difficulty ends with a defined outcome", () => {
    let s = start("motion_graphs");
    s = give(s, ans("motion_graphs", "B1", false));
    s = give(s, ans("motion_graphs", "A", false));
    s = give(s, ans("slope", "B1", false));
    s = give(s, ans("slope", "A", false));
    s = give(s, ans("deriv_rate", "B1", false));
    s = give(s, ans("deriv_rate", "A", false));
    expect(s.session!.outcome).toBeDefined();
    expect(s.session!.probeCount).toBeLessThanOrEqual(6);
  });
});

describe("integrity (5.4)", () => {
  it("duplicate instanceId is ignored (no double counting)", () => {
    let s = start("trig");
    const a = ans("trig", "B1", false);
    s = give(s, a);
    const again = give(s, a);
    expect(again.session!.probeCount).toBe(s.session!.probeCount);
    expect(again.session!.answers.length).toBe(s.session!.answers.length);
  });

  it("graded event with no session is ignored", () => {
    const s = give(initialState(), ans("trig", "B1", true));
    expect(s.session).toBeUndefined();
  });

  it("wrong item type for the step is rejected", () => {
    const s0 = start("trig");
    const s1 = give(s0, ans("trig", "A", true));
    expect(s1.session!.answers.length).toBe(0);
  });

  it("reducer never throws on garbage", () => {
    // @ts-expect-error deliberately invalid
    expect(() => reduce(initialState(), { type: "nonsense" })).not.toThrow();
  });
});

