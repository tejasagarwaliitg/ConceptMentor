import { GRAPH } from "@/content/graph";
import {
  MAX_PROBES,
  type NodeId,
  type ProbeResult,
  type Session,
  type SessionOutcome,
} from "./types";

/**
 * Evidence policy (idea.md section 5.3). Pure functions only.
 *
 * correct: true = right, false = wrong or unsure, null = void (unclear wording; no evidence)
 */

export function probeStatus(
  session: Session,
  node: NodeId
): { next: "B1" | "A" | "done"; result?: ProbeResult } {
  const answers = session.answers.filter((a) => a.node === node && (a.type === "B1" || a.type === "A"));
  const b1 = answers.find((a) => a.type === "B1");
  const a = answers.find((x) => x.type === "A");
  if (!b1) return { next: "B1" };

  const fromA = (): { next: "A" | "done"; result?: ProbeResult } => {
    if (!a) return { next: "A" };
    return { next: "done" };
  };

  // B1 void: ask A only
  if (b1.correct === null) {
    if (!a) return { next: "A" };
    if (a.correct === true || a.correct === null) return { next: "done", result: "untested" };
    return { next: "done", result: "gap" };
  }

  // B1 correct
  if (b1.correct === true) {
    if (b1.confidence !== "guess") return { next: "done", result: "no_difficulty_found" };
    if (!a) return { next: "A" };
    if (a.correct === true) return { next: "done", result: "no_difficulty_found" };
    if (a.correct === null) return { next: "done", result: "untested" };
    return { next: "done", result: "gap" };
  }

  // B1 wrong or unsure
  void fromA;
  if (!a) return { next: "A" };
  if (a.correct === true) return { next: "done", result: "context_difficulty" };
  if (a.correct === null) return { next: "done", result: "untested" };
  return { next: "done", result: "gap" };
}

export interface NextStep {
  kind: "item" | "finish";
  node?: NodeId;
  itemType?: "B1" | "A";
  outcome?: SessionOutcome;
  suspected?: NodeId;
}

/** What should happen next in a postmortem. Pure. */
export function nextStep(session: Session): NextStep {
  if (session.disputed) return { kind: "finish", outcome: "student_disputed" };

  for (const node of session.queue) {
    if (session.probed[node] !== undefined) continue;
    const st = probeStatus(session, node);
    if (st.next === "done") continue;
    // budget: a node already in progress may only continue while budget remains
    if (session.probeCount >= MAX_PROBES) return finishBudget(session);
    // wording-void items do not consume budget, but we never loop forever
    return { kind: "item", node, itemType: st.next };
  }
  return concludeSession(session);
}

function finishBudget(session: Session): NextStep {
  const c = concludeSession(session);
  if (c.kind === "finish" && (c.outcome === "suspected_gap" || c.outcome === "below_coverage")) return c;
  return { kind: "finish", outcome: "inconclusive" };
}

/**
 * Suspected-gap rule (5.5): the deepest node with difficulty whose
 * probed prerequisites all showed no difficulty (or that has none).
 */
export function concludeSession(session: Session): NextStep {
  const probed = session.probed;
  const probedNodes = Object.keys(probed) as NodeId[];
  const weak = probedNodes.filter((n) => probed[n] === "gap" || probed[n] === "context_difficulty");

  if (weak.length === 0) {
    const informative = probedNodes.filter((n) => probed[n] === "no_difficulty_found");
    return informative.length > 0
      ? { kind: "finish", outcome: "no_prereq_weakness" }
      : { kind: "finish", outcome: "inconclusive" };
  }

  const explained = weak.filter((n) =>
    GRAPH[n].prereqs.every((p) => probed[p] === "no_difficulty_found")
  );
  if (!explained.length) return { kind: "finish", outcome: "inconclusive" };
  const pool = explained;
  const sorted = [...pool].sort((a, b) => GRAPH[a].level - GRAPH[b].level);
  const suspected = sorted[0];

  const keystonesProbed = probedNodes.filter((n) => GRAPH[n].keystone);
  if (keystonesProbed.length >= 3 && keystonesProbed.every((n) => probed[n] === "gap")) {
    return { kind: "finish", outcome: "below_coverage", suspected };
  }
  return { kind: "finish", outcome: "suspected_gap", suspected };
}

/** Prerequisites of the entry chain that were never probed ("abhi check nahi kiya") */
export function notCheckedNodes(session: Session): NodeId[] {
  const out = new Set<NodeId>();
  const seen = new Set<NodeId>();
  const stack: NodeId[] = [session.entry];
  while (stack.length) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    for (const p of GRAPH[n].prereqs) {
      stack.push(p);
      if (session.probed[p] === undefined) out.add(p);
    }
  }
  return [...out];
}

export function probesRemaining(session: Session): number {
  return Math.max(0, MAX_PROBES - session.probeCount);
}
