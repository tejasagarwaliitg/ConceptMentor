import { describe, expect, it } from "vitest";
import { graphRanks, graphRelations } from "@/lib/graph-layout";
import { LIVE_NODES, LIVE_EDGES, MAP_NODES, MAP_EDGES } from "@/content/graph";
describe("ordered concept map", () => {
  it("puts every prerequisite strictly below its dependant in both views", () => {
    for (const [ids, edges] of [[LIVE_NODES, LIVE_EDGES], [MAP_NODES.map(n => n.id), MAP_EDGES]] as const) {
      const ranks = graphRanks([...ids], [...edges]);
      for (const e of edges) expect(ranks.get(e.source)).toBeLessThan(ranks.get(e.target)!);
    }
  });
  it("follows transitive prerequisites and dependants without highlighting siblings", () => {
    const {prerequisites, dependants} = graphRelations("motion_graphs", LIVE_EDGES);
    expect([...prerequisites].sort()).toEqual(["coordinates","deriv_rate","slope"]);
    expect([...dependants].sort()).toEqual(["kin_1d","projectile"]);
    expect(prerequisites.has("vec_comp")).toBe(false);
    expect(dependants.has("vec_comp")).toBe(false);
  });
  it("rejects cycles instead of assigning misleading levels", () => {
    expect(() => graphRanks(["slope","coordinates"], [{source:"slope",target:"coordinates"},{source:"coordinates",target:"slope"}])).toThrow("cycle");
  });
});
