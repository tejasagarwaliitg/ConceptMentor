import { describe, expect, it } from "vitest";
import { dueNodes, now, reduce } from "@/lib/engine";
import { DAY_MS } from "@/lib/types";
import { ans, give, repaired } from "./helpers";

describe("repair and re-checks (5.4)", () => {
  it("diagnosis leaves vec_comp suspected", () => {
    expect(repaired().session!.suspected).toBe("vec_comp");
  });

  it("repair pass -> checked_immediate, re-check due +1 day", () => {
    let s = repaired();
    const t = 1_000_000;
    s = give(s, ans("vec_comp", "B2", true, "pakka", t));
    expect(s.nodes.vec_comp!.state).toBe("checked_immediate");
    expect(s.nodes.vec_comp!.nextRecheck).toBe(t + DAY_MS);
  });

  it("repair fail keeps the node and counts the attempt", () => {
    let s = repaired();
    s = give(s, ans("vec_comp", "B2", false));
    expect(s.nodes.vec_comp!.state).toBe("context_difficulty");
    expect(s.session!.repairAttempts.vec_comp).toBe(1);
  });

  it("a pass before the due time does NOT promote to retained", () => {
    let s = repaired();
    s = give(s, ans("vec_comp", "B2", true, "pakka", 1_000_000));
    const early = give(s, ans("vec_comp", "R", true, "pakka", 1_000_000 + 1000));
    expect(early.nodes.vec_comp!.state).toBe("checked_immediate");
  });

  it("pass after +1 day -> retained, next re-check +7 days", () => {
    let s = repaired();
    s = give(s, ans("vec_comp", "B2", true, "pakka", 1_000_000));
    s = reduce(s, { type: "simulateDays", days: 1 });
    expect(dueNodes(s, 1_000_000)).toContain("vec_comp");
    const t = now(s, 1_000_000);
    s = give(s, ans("vec_comp", "R", true, "pakka", t));
    expect(s.nodes.vec_comp!.state).toBe("retained");
    expect(s.nodes.vec_comp!.nextRecheck).toBe(t + 7 * DAY_MS);
  });

  it("a failed re-check -> context_difficulty again", () => {
    let s = repaired();
    s = give(s, ans("vec_comp", "B2", true, "pakka", 1_000_000));
    s = reduce(s, { type: "simulateDays", days: 1 });
    const t = now(s, 1_000_000);
    s = give(s, ans("vec_comp", "B2", false, "shayad", t));
    expect(s.nodes.vec_comp!.state).toBe("context_difficulty");
  });
});

describe("revision buckets", () => {
  const T = 1_000_000;
  /** repair vec_comp with the given confidence, then answer each re-check when it is due */
  function run(repairConf: "pakka" | "shayad" | "guess", checks: { ok: boolean; conf: "pakka" | "shayad" | "guess" }[]) {
    let s = give(repaired(), ans("vec_comp", "B2", true, repairConf, T));
    const trail: number[] = [s.nodes.vec_comp!.recheckStep];
    for (const c of checks) {
      const due = s.nodes.vec_comp!.nextRecheck!;
      s = give(s, ans("vec_comp", "R", c.ok, c.conf, due));
      trail.push(s.nodes.vec_comp!.recheckStep);
    }
    return { s, trail };
  }

  it("every repaired topic starts in the nearest bucket (+1 day): retention is untested", () => {
    for (const conf of ["pakka", "shayad", "guess"] as const) {
      const s = give(repaired(), ans("vec_comp", "B2", true, conf, T));
      expect(s.nodes.vec_comp!.recheckStep).toBe(1);
      expect(s.nodes.vec_comp!.nextRecheck).toBe(T + DAY_MS);
    }
  });

  it("a topic answered 'sure' each time moves out fast and stops coming back", () => {
    const { s, trail } = run("pakka", [
      { ok: true, conf: "pakka" },
      { ok: true, conf: "pakka" },
      { ok: true, conf: "pakka" },
      { ok: true, conf: "pakka" },
    ]);
    expect(trail).toEqual([1, 3, 5, 7, 7]);
    expect(s.nodes.vec_comp!.state).toBe("retained");
  });

  it("intervals grow: 1d -> 7d -> 30d -> 120d", () => {
    let s = give(repaired(), ans("vec_comp", "B2", true, "pakka", T));
    const gaps: number[] = [];
    for (let i = 0; i < 3; i++) {
      const due = s.nodes.vec_comp!.nextRecheck!;
      s = give(s, ans("vec_comp", "R", true, "pakka", due));
      gaps.push((s.nodes.vec_comp!.nextRecheck! - due) / DAY_MS);
    }
    expect(gaps).toEqual([7, 30, 120]);
  });

  it("'somewhat sure' climbs one bucket at a time", () => {
    const { trail } = run("shayad", [{ ok: true, conf: "shayad" }, { ok: true, conf: "shayad" }, { ok: true, conf: "shayad" }]);
    expect(trail).toEqual([1, 2, 3, 4]);
  });

  it("improved proficiency still moves further out", () => {
    const { trail } = run("shayad", [{ ok: true, conf: "pakka" }]);
    expect(trail).toEqual([1, 3]);
  });

  it("reduced proficiency moves the topic to a nearer bucket", () => {
    // sure x2 -> bucket 5, then only 'somewhat sure' -> back one bucket
    const { trail } = run("pakka", [{ ok: true, conf: "pakka" }, { ok: true, conf: "pakka" }, { ok: true, conf: "shayad" }]);
    expect(trail).toEqual([1, 3, 5, 4]);
  });

  it("a correct guess is not evidence: the bucket does not advance", () => {
    const { trail } = run("guess", [{ ok: true, conf: "guess" }, { ok: true, conf: "guess" }]);
    expect(trail).toEqual([1, 1, 1]);
  });

  it("never drops below the nearest bucket", () => {
    const { trail } = run("pakka", [{ ok: true, conf: "guess" }]);
    expect(trail).toEqual([1, 1]);
  });

  it("a wrong answer leaves the ladder: context_difficulty, nothing scheduled", () => {
    const { s } = run("pakka", [{ ok: true, conf: "pakka" }, { ok: true, conf: "pakka" }, { ok: false, conf: "pakka" }]);
    const r = s.nodes.vec_comp!;
    expect(r.state).toBe("context_difficulty");
    expect(r.recheckStep).toBe(0);
    expect(r.nextRecheck).toBeUndefined();
    expect(r.proficiency).toBeUndefined();
  });

  it("after a slip the repair starts the ladder over from the nearest bucket", () => {
    let { s } = run("pakka", [{ ok: true, conf: "pakka" }, { ok: false, conf: "shayad" }]);
    s = give(s, ans("vec_comp", "B2", true, "pakka", T + 400 * DAY_MS));
    expect(s.nodes.vec_comp!.recheckStep).toBe(1);
  });

  it("a strong topic is not due again for months", () => {
    const { s } = run("pakka", [{ ok: true, conf: "pakka" }, { ok: true, conf: "pakka" }, { ok: true, conf: "pakka" }]);
    const at = s.nodes.vec_comp!.lastChange;
    expect(dueNodes(s, at + 30 * DAY_MS)).not.toContain("vec_comp");
    expect(dueNodes(s, at + 119 * DAY_MS)).not.toContain("vec_comp");
    expect(dueNodes(s, at + 120 * DAY_MS)).toContain("vec_comp");
  });

  it("records saved with the old 1/7/30-day steps keep their spacing", () => {
    // old step 3 (30 days) is now bucket 5 (30 days); a sure pass moves it to the top
    let s = repaired();
    s = {
      ...s,
      nodes: { ...s.nodes, vec_comp: { state: "retained", lastChange: T, recheckStep: 3, nextRecheck: T + 30 * DAY_MS, history: [] } },
    };
    s = give(s, ans("vec_comp", "R", true, "pakka", T + 30 * DAY_MS));
    expect(s.nodes.vec_comp!.recheckStep).toBe(7);
  });
});
