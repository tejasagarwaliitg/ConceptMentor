import { describe, expect, it } from "vitest";
import { containsBanned } from "@/lib/mentor/schemas";
import type { NodeId, StudentState } from "@/lib/types";
import {
  allObservationStrings,
  evidenceLines,
  nodeChips,
} from "@/lib/observations";

const WORDING_RE = /root cause|unblock|mastered|trick-user|rank|leaderboard|streak/;

function fixture(): StudentState {
  return {
    version: 1,
    settings: { lowData: false },
    nodes: {
      vec_comp: {
        state: "checked_immediate",
        lastChange: 1_000_000,
        nextRecheck: 2_000_000,
        recheckStep: 1,
        history: [],
      },
      projectile: {
        state: "retained",
        lastChange: 1_000_000,
        nextRecheck: 2_000_000,
        recheckStep: 2,
        history: [],
      },
    },
    seenInstances: [],
    recentItems: {},
    session: {
      id: "obs-fixture",
      entry: "projectile" as NodeId,
      startedAt: 1_000_000,
      answers: [
        {
          instanceId: "obs-1",
          itemId: "projectile-A",
          node: "projectile" as NodeId,
          type: "A",
          correct: true,
          dontKnow: false,
          confidence: "pakka",
          at: 1_000_000,
        },
        {
          instanceId: "obs-2",
          itemId: "projectile-A",
          node: "projectile" as NodeId,
          type: "A",
          correct: true,
          dontKnow: false,
          confidence: "shayad",
          at: 1_000_000,
        },
        {
          instanceId: "obs-3",
          itemId: "projectile-A",
          node: "projectile" as NodeId,
          type: "A",
          correct: false,
          dontKnow: false,
          confidence: "shayad",
          at: 1_000_000,
        },
        {
          instanceId: "obs-4",
          itemId: "vec_comp-B1",
          node: "vec_comp" as NodeId,
          type: "B1",
          correct: false,
          dontKnow: false,
          confidence: "shayad",
          at: 1_000_000,
        },
        {
          instanceId: "obs-5",
          itemId: "vec_comp-B1",
          node: "vec_comp" as NodeId,
          type: "B1",
          correct: false,
          dontKnow: false,
          confidence: "guess",
          at: 1_000_000,
        },
        {
          instanceId: "obs-6",
          itemId: "trig-B1",
          node: "trig" as NodeId,
          type: "B1",
          correct: true,
          dontKnow: false,
          confidence: "guess",
          at: 1_000_000,
        },
      ],
      probeCount: 3,
      queue: ["projectile" as NodeId],
      probed: {},
      repairAttempts: {},
      notChecked: [],
      disputed: false,
    },
    weekly: {},
    simulatedDays: 0,
    flaggedItems: [],
  };
}

describe("observations selectors (D-05)", () => {
  it("counts real answers: standard-A split, changed-context-B1 split, guess calibration", () => {
    const lines = evidenceLines(fixture());
    expect(lines).toHaveLength(3);
    // 2 correct out of 3 standard-A
    expect(lines[0]).toContain("2 correct out of 3");
    // 2 not correct out of 3 changed-context B1
    expect(lines[1]).toContain("2 not correct out of 3");
    // 2 guessing, 1 not correct
    expect(lines[2]).toContain("2");
    expect(lines[2]).toContain("1 not correct");
  });

  it("chips cite real node states with later-topic counts", () => {
    const chips = nodeChips(fixture());
    expect(chips.length).toBeGreaterThanOrEqual(2);
    for (const c of chips) {
      expect(fixture().nodes[c.node]!.state).toBe(c.state);
      expect(c.laterTopics).toBeGreaterThanOrEqual(0);
      expect(c.label).toContain("Connected to");
    }
  });

  it("every observation string passes the wording gate", () => {
    for (const s of allObservationStrings(fixture())) {
      expect(containsBanned(s), s).toBe(false);
      expect(s.toLowerCase(), s).not.toMatch(WORDING_RE);
    }
  });
});
