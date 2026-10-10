import { describe, expect, it } from "vitest";
import {
  DEMO_PROFILE_ID,
  createProfile,
  ensureDemoProfile,
  freshStore,
  loadStore,
  saveStore,
} from "@/lib/profiles";
import { buildDemoState } from "@/lib/seed";
import { usualActiveHour } from "@/lib/rhythm";
import { initialState } from "@/lib/engine";

function mem(initial: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  } as Storage;
}

describe("profile store", () => {
  it("fresh store shows the picker (no active profile)", () => {
    expect(freshStore()).toEqual({ activeId: null, profiles: {} });
  });

  it("migrates the legacy single student into an active You profile", () => {
    const store = loadStore(mem({ "kadi.student.v1": JSON.stringify(initialState()) }));
    expect(store.activeId).not.toBeNull();
    expect(store.profiles[store.activeId!].displayName).toBe("You");
  });

  it("survives corruption and round-trips", () => {
    expect(loadStore(mem({ "kadi.profiles.v1": "{broken" }))).toEqual(freshStore());
    const s = mem();
    const p = createProfile({ displayName: "Aarav", classLabel: "Class 11", targetExam: "JEE" });
    saveStore(s, { activeId: p.id, profiles: { [p.id]: p } });
    const back = loadStore(s);
    expect(back.activeId).toBe(p.id);
    expect(back.profiles[p.id].classLabel).toBe("Class 11");
  });

  it("drops unknown profiles and a dangling active id", () => {
    const s = mem({
      "kadi.profiles.v1": JSON.stringify({
        activeId: "ghost",
        profiles: { ghost: { id: "ghost", displayName: "x" }, bad: { no: true } },
      }),
    });
    const back = loadStore(s);
    expect(back).toEqual({ activeId: null, profiles: {} });
  });
});

describe("demo seed", () => {
  it("replays into checked, retained-then-slipped, gap and clean states", () => {
    const s = buildDemoState();
    expect(s.nodes.vec_comp?.state).toBe("context_difficulty");
    expect(s.nodes.vec_comp?.history.map((h) => h.event)).toContain("recheck:pass");
    expect(s.nodes.kin_1d?.state).toBe("gap");
    expect(s.nodes.trig?.state).toBe("no_difficulty_found");
    expect(s.nodes.slope?.state).toBe("checked_immediate");
    expect(s.nodes.motion_graphs?.state).toBe("retained");
    expect(s.session).toBeUndefined();
    const weeks = Object.values(s.weekly);
    expect(weeks.reduce((a, w) => a + w.done, 0)).toBe(7); // one per check answer
    expect(weeks.reduce((a, w) => a + w.passed, 0)).toBe(5);
    // a real rhythm: ~13 timestamps across 5 days at ~19:00 IST
    expect((s.activity ?? []).length).toBeGreaterThanOrEqual(9);
    expect(usualActiveHour(s.activity ?? [], 330)).toBe(19);
  });

  it("ensureDemoProfile marks simulated data under the demo id", () => {
    const d = ensureDemoProfile(buildDemoState());
    expect(d.id).toBe(DEMO_PROFILE_ID);
    expect(d.isDemo).toBe(true);
    expect(d.state.nodes.vec_comp?.state).toBe("context_difficulty");
  });
});
