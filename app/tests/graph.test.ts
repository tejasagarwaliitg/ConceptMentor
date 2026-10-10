import { describe, expect, it } from "vitest";
import {
  GRAPH, LIVE_NODES, ENTRY_NODES, LIVE_EDGES, MAP_NODES, MAP_EDGES,
  ROADMAP_NODES, connectionSummary, connectedLaterCount, descendantsOf, mapDescendantsOf,
} from "@/content/graph";
import { CONCEPT_SCOPES, LIVE_EDGE_REVIEW } from "@/content/graph-review";
import { nextStep } from "@/lib/engine";
import { parseImport } from "@/lib/importer";
import { ans, give, start } from "./helpers";

describe("knowledge graph integrity", () => {
  it("keeps the nine diagnostic nodes and seventy-one display-only nodes separate", () => {
    expect(LIVE_NODES).toHaveLength(9);
    expect(ROADMAP_NODES).toHaveLength(71);
    expect(MAP_NODES).toHaveLength(80);
    expect(new Set(MAP_NODES.map((node) => node.id)).size).toBe(80);
    for (const node of ROADMAP_NODES) expect(node.id in GRAPH).toBe(false);
    for (const entry of ENTRY_NODES) expect(entry in GRAPH).toBe(true);
  });

  it("has valid, unique edges and no cycles in either map", () => {
    expect(new Set(MAP_EDGES.map((edge) => edge.id)).size).toBe(MAP_EDGES.length);
    const ids = new Set<string>(MAP_NODES.map((node) => node.id));
    for (const edge of MAP_EDGES) {
      expect(ids.has(edge.source)).toBe(true);
      expect(ids.has(edge.target)).toBe(true);
      expect(edge.source).not.toBe(edge.target);
    }
    const visited = new Set<string>();
    const active = new Set<string>();
    const visit = (id: string) => {
      if (active.has(id)) throw new Error(`Cycle at ${id}`);
      if (visited.has(id)) return;
      active.add(id);
      for (const edge of MAP_EDGES.filter((edge) => edge.source === id)) visit(edge.target);
      active.delete(id);
      visited.add(id);
    };
    for (const id of ids) visit(id);
  });

  it("adds coordinates before slope and preserves the demo suspect order", () => {
    expect(LIVE_EDGES.map((edge) => edge.id).sort()).toEqual([
      "coordinates->slope",
      "trig->vec_comp", "vec_basics->vec_comp", "vec_comp->projectile", "kin_1d->projectile",
      "slope->deriv_rate", "slope->motion_graphs", "deriv_rate->motion_graphs", "motion_graphs->kin_1d",
    ].sort());
    expect(GRAPH.projectile.prereqs).toEqual(["vec_comp", "kin_1d"]);
    expect(GRAPH.vec_comp.prereqs).toEqual(["trig", "vec_basics"]);
    for (const node of LIVE_NODES) {
      expect(new Set(GRAPH[node].prereqs).size).toBe(GRAPH[node].prereqs.length);
      for (const prerequisite of GRAPH[node].prereqs) expect(LIVE_NODES).toContain(prerequisite);
    }
  });

  it("counts each reachable topic once and distinguishes future coverage", () => {
    expect(descendantsOf("vec_comp")).toEqual(["projectile"]);
    expect(connectionSummary("vec_comp")).toEqual({ live: 1, comingNext: 48, total: 49 });
    expect(connectedLaterCount("vec_comp")).toBe(49);
    const fromTrig = mapDescendantsOf("trig");
    expect(fromTrig.filter((id) => id === "work_energy")).toHaveLength(1);
    expect(fromTrig).not.toContain("trig");
    expect(connectionSummary("projectile")).toEqual({ live: 0, comingNext: 0, total: 0 });
  });

  it("does not traverse backwards into roadmap foundations during diagnosis", () => {
    expect(GRAPH.trig.prereqs).toEqual([]);
    expect(GRAPH.coordinates.prereqs).toEqual([]);
    expect(GRAPH.slope.prereqs).toEqual(["coordinates"]);
    expect(mapDescendantsOf("ratios")).toContain("trig");
    expect(descendantsOf("trig")).not.toContain("ratios");
  });

  it("supplies a bounded authoring brief and a source for every live concept", () => {
    for (const node of LIVE_NODES) {
      expect(CONCEPT_SCOPES[node].skill.length).toBeGreaterThan(0);
      expect(CONCEPT_SCOPES[node].excludes.length).toBeGreaterThan(0);
      expect(CONCEPT_SCOPES[node].candidateMisconceptions).toHaveLength(2);
      expect(new URL(GRAPH[node].ncertUrl).hostname).toBe("ncert.nic.in");
    }
    for (const edge of LIVE_EDGES) expect(LIVE_EDGE_REVIEW[edge.id]).toBeDefined();
  });

  it("investigates coordinates when the slope probes show difficulty", () => {
    let state = start("slope");
    state = give(state, ans("slope", "B1", false));
    state = give(state, ans("slope", "A", true));
    expect(state.session!.outcome).toBeUndefined();
    expect(nextStep(state.session!)).toMatchObject({ kind: "item", node: "coordinates", itemType: "B1" });
  });

  it("retains coordinates progress during import and marks it self-reported", () => {
    const state = give(start("coordinates"), ans("coordinates", "B1", true, "pakka"));
    const imported = parseImport(JSON.stringify(state));
    expect(imported?.nodes.coordinates).toMatchObject({ state: "no_difficulty_found", selfReported: true });
  });
});
