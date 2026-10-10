import { describe, expect, it } from "vitest";
import { chooseStuckCard, composeRepair, lookupTools, proposeProbeOrder } from "@/lib/mentor/tools";

// Offline: no model call. Confirms the Cline SDK tools build with the right lifecycle flags
// and that the read-only lookups return reviewed graph data only.
const ctx = { summary: { entry: "projectile" as const, probedStates: {}, tone: { mentor: "bhaiya", register: "tum", language: "hinglish" } } };
const lookups = lookupTools(ctx);

describe("mentor tools (Cline SDK createTool)", () => {
  it("exactly three finishing tools complete the run; lookups do not", () => {
    for (const t of [proposeProbeOrder, chooseStuckCard, composeRepair]) {
      expect(t.lifecycle?.completesRun, t.name).toBe(true);
    }
    for (const t of lookups) expect(t.lifecycle?.completesRun ?? false, t.name).toBe(false);
  });

  it("there is no tool that grades, changes progress or returns a URL", () => {
    const names = [...lookups, proposeProbeOrder, chooseStuckCard, composeRepair].map((t) => t.name);
    expect(names.sort()).toEqual(["choose_stuck_card", "compose_repair", "get_node", "get_student_summary", "propose_probe_order"]);
    for (const n of names) expect(n).not.toMatch(/grade|update|mastery|state|url|link|set_/);
  });

  it("get_node returns reviewed graph facts in the builder's suspect order", async () => {
    const out = await (lookups[0] as unknown as { execute(input: { nodeId: string }, ctx: object): Promise<{ prerequisites: string[]; name: string }> }).execute({ nodeId: "projectile" }, {});
    expect(out.prerequisites).toEqual(["vec_comp", "kin_1d"]);
    expect(out.name).toBe("Projectile motion");
    expect(JSON.stringify(out)).not.toMatch(/http/);
  });

  it("get_student_summary exposes only structured, non-identifying fields", async () => {
    const out = await (lookups[1] as unknown as { execute(input: object, ctx: object): Promise<object> }).execute({}, {});
    expect(Object.keys(out).sort()).toEqual(["entry", "probedStates", "tone"]);
  });
});
