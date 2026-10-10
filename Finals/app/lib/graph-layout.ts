import type { MapNodeId } from "@/content/graph-roadmap";
interface Edge { source: MapNodeId; target: MapNodeId }
/** Longest prerequisite path fixes a vertical rank. Every prerequisite is strictly lower. */
export function graphRanks(ids: MapNodeId[], edges: Edge[]): Map<MapNodeId, number> {
  const allowed = new Set(ids), ranks = new Map<MapNodeId, number>(), visiting = new Set<MapNodeId>();
  function rank(id: MapNodeId): number {
    if (ranks.has(id)) return ranks.get(id)!;
    if (visiting.has(id)) throw new Error("Prerequisite graph contains a cycle");
    visiting.add(id);
    const parents = edges.filter(e => e.target === id && allowed.has(e.source));
    const value = parents.length ? Math.max(...parents.map(e => rank(e.source))) + 1 : 0;
    visiting.delete(id); ranks.set(id, value); return value;
  }
  ids.forEach(rank); return ranks;
}
/** Directed reachability: siblings and unrelated neighbours are deliberately excluded. */
export function graphRelations(id: MapNodeId, edges: Edge[]) {
  function walk(up: boolean) {
    const found = new Set<MapNodeId>(), queue: MapNodeId[] = [id];
    while (queue.length) {
      const current = queue.pop()!;
      for (const edge of edges) {
        if ((up ? edge.target : edge.source) !== current) continue;
        const next = up ? edge.source : edge.target;
        if (next !== id && !found.has(next)) { found.add(next); queue.push(next); }
      }
    }
    return found;
  }
  return { prerequisites: walk(true), dependants: walk(false) };
}
