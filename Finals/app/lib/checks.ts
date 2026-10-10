import { MAX_REPAIR_ATTEMPTS, type GradedAnswer, type NodeId, type Session, type StudentState } from "./types";
import { bumpWeek, now, setNode, weekKey } from "./state";
import { bucketOf, proficiencyOf, revisionStep, scheduleAfter } from "./revision";
import { connectedLaterCount } from "@/content/graph";

/** Repair checks (within a session) and re-checks (later). Pure. */
export function applyCheckAnswer(state: StudentState, session: Session, a: GradedAnswer): StudentState {
  const node = a.node;
  const rec = state.nodes[node];
  const t = a.at;
  if (!rec) return state; // invalid: no record for this node
  const withAnswer: Session = { ...session, answers: [...session.answers, a] };
  if (a.correct === null) return { ...state, session: withAnswer }; // void: no evidence

  // --- re-check of an already-checked node
  if (rec.state === "checked_immediate" || rec.state === "retained") {
    const passed = a.correct === true;
    const base: StudentState = { ...state, weekly: bumpWeek(state, t, passed), session: withAnswer };
    if (!passed) {
      return setNode(base, node, "context_difficulty", t, "recheck:fail", { recheckStep: 0, proficiency: undefined, nextRecheck: undefined });
    }
    const due = rec.nextRecheck ?? t;
    if (t < due) return base; // not due yet: a pass now is not evidence of retention
    // same/better proficiency -> a further bucket; lower proficiency -> a nearer one
    const { bucket, proficiency } = revisionStep(rec, a.confidence);
    const event = bucket > Math.max(1, bucketOf(rec)) ? "recheck:pass" : bucket < bucketOf(rec) ? "recheck:pass:nearer" : "recheck:pass:same";
    return setNode(base, node, "retained", t, event, {
      recheckStep: bucket,
      proficiency,
      nextRecheck: scheduleAfter(t, bucket),
    });
  }

  // --- repair check within a session
  if (rec.state !== "gap" && rec.state !== "context_difficulty") return state; // invalid
  const attempts = (session.repairAttempts[node] ?? 0) + 1;
  const sess: Session = { ...withAnswer, repairAttempts: { ...session.repairAttempts, [node]: attempts } };
  const base: StudentState = { ...state, session: sess, weekly: bumpWeek(state, t, a.correct === true) };
  if (a.correct === true) {
    // retention is untested, so every repaired topic starts in the nearest bucket (+1 day);
    // how securely it was answered is kept to decide the next move
    return setNode(base, node, "checked_immediate", t, "repair:pass", {
      recheckStep: 1,
      proficiency: proficiencyOf(a.confidence),
      nextRecheck: scheduleAfter(t, 1),
    });
  }
  return base;
}

// ---------------------------------------------------------------- selectors

export function repairExhausted(session: Session, node: NodeId): boolean {
  return (session.repairAttempts[node] ?? 0) >= MAX_REPAIR_ATTEMPTS;
}

export function dueNodes(state: StudentState, realNow = Date.now()): NodeId[] {
  const t = now(state, realNow);
  return (Object.keys(state.nodes) as NodeId[])
    .filter((n) => {
      const r = state.nodes[n]!;
      return (r.state === "checked_immediate" || r.state === "retained") && r.nextRecheck !== undefined && r.nextRecheck <= t;
    })
    .sort((a, b) => state.nodes[a]!.nextRecheck! - state.nodes[b]!.nextRecheck!); // most overdue first
}

export function connectedCount(node: NodeId): number {
  return connectedLaterCount(node);
}

export function thisWeek(state: StudentState, realNow = Date.now()): { done: number; passed: number } {
  return state.weekly[weekKey(now(state, realNow))] ?? { done: 0, passed: 0 };
}
