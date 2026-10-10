import type { NodeId } from "@/lib/types";
import { ROADMAP_EDGES, ROADMAP_NODES, type MapNodeId } from "./graph-roadmap";

export { ROADMAP_EDGES, ROADMAP_NODES } from "./graph-roadmap";
export type { MapNodeId, RoadmapNodeId } from "./graph-roadmap";

export interface GraphNode {
  id: NodeId;
  name: string;
  level: 0 | 1 | 2 | 3;
  keystone: boolean;
  /** prerequisites in BUILDER-RECORDED suspect order (most suspect first) */
  prereqs: NodeId[];
  /** short plain-language description for the chapter picker */
  blurb: string;
  /** NCERT reference checked against the official 2026-27 PDFs on 2026-10-10. */
  ncert: string;
  ncertUrl: string;
}

export const GRAPH: Record<NodeId, GraphNode> = {
  coordinates: {
    id: "coordinates",
    name: "Coordinates and axes",
    level: 0,
    keystone: true,
    prereqs: [],
    blurb: "read ordered pairs, axis labels, signs and scales",
    ncert: "NCERT Maths Class 10, Ch 7 (Coordinate Geometry), Sec 7.1 (Coordinate-axes recap)",
    ncertUrl: "https://ncert.nic.in/textbook/pdf/jemh107.pdf",
  },
  trig: {
    id: "trig",
    name: "Trigonometric ratios",
    level: 1,
    keystone: true,
    prereqs: [],
    blurb: "sin, cos, tan of standard angles",
    ncert: "NCERT Maths Class 10, Ch 8, Sec 8.2-8.3 (Ratios and standard angles)",
    ncertUrl: "https://ncert.nic.in/textbook/pdf/jemh108.pdf",
  },
  vec_basics: {
    id: "vec_basics",
    name: "Vector basics",
    level: 1,
    keystone: true,
    prereqs: [],
    blurb: "magnitude, direction, adding vectors",
    ncert: "NCERT Physics Class 11, Ch 3 (Motion in a Plane), Sec 3.2-3.4",
    ncertUrl: "https://ncert.nic.in/textbook/pdf/keph103.pdf",
  },
  slope: {
    id: "slope",
    name: "Slope of a line / graph",
    level: 1,
    keystone: true,
    prereqs: ["coordinates"],
    blurb: "how steep a graph is",
    ncert: "NCERT Maths Class 11, Ch 9 (Straight Lines), Sec 9.2",
    ncertUrl: "https://ncert.nic.in/textbook/pdf/kemh109.pdf",
  },
  vec_comp: {
    id: "vec_comp",
    name: "Vector components",
    level: 2,
    keystone: true,
    prereqs: ["trig", "vec_basics"],
    blurb: "splitting a vector along axes",
    ncert: "NCERT Physics Class 11, Ch 3, Sec 3.5 (Resolution of vectors)",
    ncertUrl: "https://ncert.nic.in/textbook/pdf/keph103.pdf",
  },
  deriv_rate: {
    id: "deriv_rate",
    name: "Derivative as rate of change",
    level: 2,
    keystone: true,
    prereqs: ["slope"],
    blurb: "how fast something changes",
    ncert: "NCERT Maths Class 11, Ch 12 (Limits and Derivatives), Sec 12.2 and 12.5",
    ncertUrl: "https://ncert.nic.in/textbook/pdf/kemh112.pdf",
  },
  motion_graphs: {
    id: "motion_graphs",
    name: "Motion graphs (x-t, v-t)",
    level: 2,
    keystone: false,
    prereqs: ["slope", "deriv_rate"],
    blurb: "reading position-time and velocity-time graphs",
    ncert: "NCERT Physics Class 11, Ch 2, Sec 2.2-2.4 (Velocity, acceleration and graphs)",
    ncertUrl: "https://ncert.nic.in/textbook/pdf/keph102.pdf",
  },
  kin_1d: {
    id: "kin_1d",
    name: "1D kinematics",
    level: 3,
    keystone: false,
    prereqs: ["motion_graphs"],
    blurb: "equations of motion in a straight line",
    ncert: "NCERT Physics Class 11, Ch 2, Sec 2.4 (Uniformly accelerated motion)",
    ncertUrl: "https://ncert.nic.in/textbook/pdf/keph102.pdf",
  },
  projectile: {
    id: "projectile",
    name: "Projectile motion",
    level: 3,
    keystone: false,
    // builder-recorded suspect order: components first, then kinematics
    prereqs: ["vec_comp", "kin_1d"],
    blurb: "things thrown at an angle",
    ncert: "NCERT Physics Class 11, Ch 3, Sec 3.8-3.9 (Constant acceleration; projectile motion)",
    ncertUrl: "https://ncert.nic.in/textbook/pdf/keph103.pdf",
  },
};

export const LIVE_NODES = Object.keys(GRAPH) as NodeId[];

/** Chapter picker entries (nodes a student can start from) */
export const ENTRY_NODES: NodeId[] = ["projectile", "kin_1d", "motion_graphs", "vec_comp"];

export const COMING_NEXT = ROADMAP_NODES.map((node) => node.name);

export interface GraphEdge {
  id: string;
  source: MapNodeId;
  target: MapNodeId;
  kind: "diagnostic_route" | "coming_next_connection";
}

/** A node being in the live scope does not certify its questions as approved. */
export const MAP_NODES = [
  ...LIVE_NODES.map((id) => ({ id, name: GRAPH[id].name, coverage: "live_scope" as const })),
  ...ROADMAP_NODES.map(({ id, name }) => ({ id, name, coverage: "coming_next" as const })),
];

/** Live routes in idea.md 4.1, including the coordinates-before-slope amendment. */
export const LIVE_EDGES: GraphEdge[] = LIVE_NODES.flatMap((target) =>
  GRAPH[target].prereqs.map((source) => ({
    id: `${source}->${target}`, source, target, kind: "diagnostic_route" as const,
  }))
);

/** Complete display graph; only LIVE_EDGES belong to diagnostic traversal. */
export const MAP_EDGES: GraphEdge[] = [
  ...LIVE_EDGES,
  ...ROADMAP_EDGES.map(({ source, target }) => ({
    id: `${source}->${target}`, source, target, kind: "coming_next_connection" as const,
  })),
];

/** Edges: prerequisite -> dependent */
export function dependentsOf(id: NodeId): NodeId[] {
  return LIVE_NODES.filter((n) => GRAPH[n].prereqs.includes(id));
}

/** All live descendants (transitive dependents) of a node */
export function descendantsOf(id: NodeId): NodeId[] {
  const seen = new Set<NodeId>();
  const stack: NodeId[] = [...dependentsOf(id)];
  while (stack.length) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    stack.push(...dependentsOf(n));
  }
  return [...seen];
}

/** Reachability for the display graph, not assessment eligibility or learning gains. */
export function mapDescendantsOf(id: MapNodeId): MapNodeId[] {
  const seen = new Set<MapNodeId>([id]);
  const stack: MapNodeId[] = [id];
  const descendants: MapNodeId[] = [];
  while (stack.length) {
    const current = stack.pop()!;
    for (const edge of MAP_EDGES) {
      if (edge.source !== current || seen.has(edge.target)) continue;
      seen.add(edge.target);
      descendants.push(edge.target);
      stack.push(edge.target);
    }
  }
  return descendants;
}

/** Always expose the planned/live split beside a displayed total. */
export function connectionSummary(id: NodeId): { live: number; comingNext: number; total: number } {
  const descendants = mapDescendantsOf(id);
  const live = descendants.filter((node) => LIVE_NODES.includes(node as NodeId)).length;
  return { live, comingNext: descendants.length - live, total: descendants.length };
}

/** idea.md 4.4 includes coming-next connections; this is not a mastery claim. */
export function connectedLaterCount(id: NodeId): number {
  return connectionSummary(id).total;
}
