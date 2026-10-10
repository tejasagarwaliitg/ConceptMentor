import { describe, expect, it } from "vitest";
import {
  localDayKey,
  recordActivity,
  shouldNudgeInactivity,
  usualActiveHour,
} from "@/lib/rhythm";
import { initialState, reduce } from "@/lib/engine";
import { parseImport } from "@/lib/importer";
import { ans, give, start } from "./helpers";

const H = 60 * 60 * 1000;
// fixed student clock: UTC+5:30 (IST). 2026-10-05T00:00Z = Monday.
const MON = Date.UTC(2026, 9, 5);
const TZ = 330;

function at(dayOffset: number, hourLocal: number, min = 0): number {
  return MON + dayOffset * 24 * H + (hourLocal * 60 + min - TZ) * 60 * 1000;
}

describe("usualActiveHour", () => {
  it("needs at least 5 samples across 2 days, else null (no nagging without evidence)", () => {
    expect(usualActiveHour([], TZ)).toBeNull();
    expect(usualActiveHour([at(0, 19), at(0, 20), at(0, 19), at(0, 21), at(0, 19)], TZ)).toBeNull(); // 1 day
    expect(usualActiveHour([at(0, 19), at(1, 19), at(2, 20)], TZ)).toBeNull(); // 3 samples
  });

  it("returns the median local hour", () => {
    const log = [at(0, 19), at(1, 19), at(2, 20), at(3, 19), at(4, 22)];
    expect(usualActiveHour(log, TZ)).toBe(19);
  });

  it("recordActivity caps and prunes", () => {
    const old = MON - 70 * 24 * H;
    const log = recordActivity([old, at(0, 19)], at(1, 19));
    expect(log).not.toContain(old);
    expect(log).toHaveLength(2);
  });
});

describe("shouldNudgeInactivity", () => {
  const usualHour = 19;

  it("nudges after usual + grace with no activity today", () => {
    expect(
      shouldNudgeInactivity({ nowUtc: at(5, 21), tzOffsetMin: TZ, usualHour, lastActiveAt: at(4, 19) })
    ).toBe(true);
  });

  it("stays quiet before the grace passes", () => {
    expect(
      shouldNudgeInactivity({ nowUtc: at(5, 19, 30), tzOffsetMin: TZ, usualHour, lastActiveAt: at(4, 19) })
    ).toBe(false);
  });

  it("stays quiet when already active today (even at an odd hour)", () => {
    expect(
      shouldNudgeInactivity({ nowUtc: at(5, 22), tzOffsetMin: TZ, usualHour, lastActiveAt: at(5, 6) })
    ).toBe(false);
  });

  it("sends at most one nudge per day", () => {
    expect(
      shouldNudgeInactivity({ nowUtc: at(5, 22), tzOffsetMin: TZ, usualHour, lastActiveAt: at(4, 19), lastNudgeAt: at(5, 21) })
    ).toBe(false);
  });

  it("nudges a brand-new-but-rhythmed student with no activity at all", () => {
    expect(
      shouldNudgeInactivity({ nowUtc: at(5, 22), tzOffsetMin: TZ, usualHour, lastActiveAt: null })
    ).toBe(true);
  });
});

describe("localDayKey", () => {
  it("respects the student's timezone, not the server's", () => {
    // 2026-10-05 00:30 IST == 2026-10-04 19:00Z: still Oct 5 for the student
    expect(localDayKey(Date.UTC(2026, 9, 4, 19, 0), TZ)).toBe("2026-10-05");
  });
});

describe("engine recording", () => {
  it("records session starts and graded answers, ignores duplicates", () => {
    let s = start("projectile");
    expect(s.activity).toHaveLength(1);
    s = give(s, ans("projectile", "B1", false));
    expect(s.activity).toHaveLength(2);
    const dup = { ...ans("projectile", "A", true), instanceId: s.session!.answers[0].instanceId };
    expect(reduce(s, { type: "graded", answer: dup })).toBe(s); // idempotent: no record
  });

  it("old states without activity still work", () => {
    const s = start("projectile");
    expect(usualActiveHour(s.activity ?? [], TZ)).toBeNull();
    expect(initialState().activity).toEqual([]);
  });

  it("imports keep a valid activity log and default it otherwise", () => {
    const base = JSON.stringify({ ...initialState(), nodes: {}, activity: [1, 2, 3] });
    expect(parseImport(base)?.activity).toEqual([1, 2, 3]);
    const legacy = JSON.stringify({ ...initialState(), nodes: {}, activity: undefined });
    const { activity, ...rest } = JSON.parse(legacy);
    void activity;
    expect(parseImport(JSON.stringify(rest))?.activity).toEqual([]);
    expect(parseImport(JSON.stringify({ ...JSON.parse(base), activity: ["x"] }))).toBeNull();
  });
});
