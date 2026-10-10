import { GRAPH, LIVE_NODES } from "@/content/graph";
import type { NodeId } from "@/lib/types";

/**
 * Deterministic fallback mapping from question text to a graph node.
 * Used when the AI is unavailable, and to CHECK the AI's choice.
 * Ordered most-specific first: a later match must beat the earlier score to win.
 */
const SIGNALS: Record<NodeId, string[]> = {
  projectile: ["projectile", "projected", "projection", "trajectory", "range", "maximum height", "time of flight", "apex", "horizontally", "at an angle", "thrown at", "launched at"],
  motion_graphs: ["velocity-time", "position-time", "v-t", "x-t", "graph of velocity", "graph of position", "displacement-time", "slope of the graph", "area under"],
  kin_1d: ["uniform acceleration", "constant acceleration", "retardation", "braking", "deceleration", "starting from rest", "comes to rest", "distance travelled", "displacement", "speed of the car", "elevator", "free fall", "dropped from"],
  vec_comp: ["component", "components", "resolved", "resolution of", "horizontal component", "vertical component", "perpendicular axes", "sin theta", "cos theta"],
  vec_basics: ["resultant", "unit vector", "magnitude of the vector", "direction of the vector", "vector sum", "difference of two vectors", "addition of vectors", "inclined at an angle to each other"],
  deriv_rate: ["instantaneous", "average rate", "rate of change", "derivative", "differentiated", "f'(x)", "tangent to the curve", "slope of the tangent"],
  slope: ["slope", "gradient", "straight line passing through", "inclination of the line", "steepness"],
  trig: ["sin", "cos", "tan", "trigonometric", "angle of elevation", "angle of depression", "right triangle", "hypotenuse", "ladder"],
  coordinates: ["coordinates", "coordinate", "origin", "axes", "x-axis", "y-axis", "ordered pair", "abscissa", "ordinate", "distance from the origin", "quadrant"],
};

export interface MatchEvidence {
  node: NodeId;
  score: number;
  matched: string[];
}

export interface MatchResult {
  node: NodeId | null;
  confidence: "high" | "low" | "none";
  evidence: MatchEvidence[];
  reason: string;
}

/** Case-insensitive whole-word matching, so "sin" does not match "using". */
function hits(text: string, terms: string[]): string[] {
  const out: string[] = [];
  for (const term of terms) {
    const re = new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    if (re.test(text)) out.push(term);
  }
  return out;
}

export function matchQuestionToNodes(text: string): MatchResult {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 8) {
    return { node: null, confidence: "none", evidence: [], reason: "Not enough text recognised to judge." };
  }
  const evidence: MatchEvidence[] = [];
  for (const node of LIVE_NODES) {
    const matched = hits(clean, SIGNALS[node]);
    if (matched.length) evidence.push({ node, score: matched.length, matched });
  }
  evidence.sort((a, b) => b.score - a.score || LIVE_NODES.indexOf(a.node) - LIVE_NODES.indexOf(b.node));

  if (!evidence.length) {
    return { node: null, confidence: "none", evidence: [], reason: "I could not recognise a topic in this text." };
  }
  const top = evidence[0];
  const runnerUp = evidence[1];
  // high only when the winner is clearly ahead and has real signal
  const confident = top.score >= 2 && (!runnerUp || top.score >= runnerUp.score * 2);
  return {
    node: top.node,
    confidence: confident ? "high" : "low",
    evidence,
    reason: `Matched "${top.matched.join(", ")}" to ${GRAPH[top.node].name}.`,
  };
}

/** Human-readable list for the "why this node?" panel. */
export function explainMatch(m: MatchResult): string[] {
  return m.evidence.slice(0, 3).map((e) => `${GRAPH[e.node].name}: matched ${e.matched.join(", ") || "nothing"}`);
}
