import { GRAPH } from "@/content/graph";
import { applyCheckAnswer } from "./checks";
import { nextStep, notCheckedNodes, probeStatus } from "./probe";
import { recordActivity } from "./rhythm";
import { initialState, newSession, setNode, type Event } from "./state";
import { DAY_MS, type GradedAnswer, type NodeState, type Session, type StudentState } from "./types";

export { nextStep, probeStatus, probesRemaining, concludeSession } from "./probe";
export { initialState, now, levelQueueOf, isClearedState, reconcileLevelQueue, CLEARED_STATES } from "./state";
export { REVISION_BUCKET_DAYS, TOP_BUCKET } from "./revision";
export { dueNodes, connectedCount, thisWeek, repairExhausted } from "./checks";
export type { Event } from "./state";

/** The reducer never throws; invalid events return the state unchanged. */
export function reduce(state: StudentState, ev: Event): StudentState {
  try {
    switch (ev.type) {
      case "itemPresented":
        return { ...state, seenQuestionIds: [...new Set([...(state.seenQuestionIds ?? []), ev.itemId])] };
      case "reset":
        return initialState();
      case "load":
        return ev.state && ev.state.version === 1 ? { ...ev.state, settings: { lowData: ev.state.settings.lowData, preferredChannels: ev.state.settings.preferredChannels, videoFeedback: ev.state.settings.videoFeedback }, recentItems: ev.state.recentItems ?? {}, session: undefined } : state;
      case "setSettings":
        return { ...state, settings: { ...state.settings, ...ev.settings } };
      case "simulateDays":
        return { ...state, simulatedDays: Math.max(0, state.simulatedDays + ev.days) };
      case "flagItem":
        return state.flaggedItems.includes(ev.itemId)
          ? state
          : { ...state, flaggedItems: [...state.flaggedItems, ev.itemId] };
      case "startSession":
        return { ...state, session: newSession(ev.entry, ev.at, ev.sessionId), activity: recordActivity(state.activity ?? [], ev.at) };
      case "endSession":
        return { ...state, session: undefined };
      case "dispute":
        if (!state.session) return state;
        return { ...state, session: { ...state.session, disputed: true, outcome: "student_disputed" } };
      case "setRecheckChoice": {
        const rec = state.nodes[ev.node];
        if (!rec || (rec.state !== "checked_immediate" && rec.state !== "retained")) return state;
        return { ...state, nodes: { ...state.nodes, [ev.node]: { ...rec, nextRecheck: ev.at + ev.days * DAY_MS } } };
      }
      case "graded":
        return applyGraded(state, ev.answer);
    }
  } catch {
    return state;
  }
}

function applyGraded(state: StudentState, a: GradedAnswer): StudentState {
  if (state.seenInstances.includes(a.instanceId)) return state; // idempotent
  const seen = [...state.seenInstances, a.instanceId].slice(-200);
  const session = state.session;
  if (!session) return state; // invalid: no session
  const active: StudentState = { ...state, activity: recordActivity(state.activity ?? [], a.at) };
  const withInstance: StudentState = { ...active, seenInstances: seen };
  const next = a.type === "B2" || a.type === "R"
    ? applyCheckAnswer(withInstance, session, a)
    : applyProbeAnswer(withInstance, seen, session, a);
  if (next === state) return next;
  const key = `${a.node}:${a.type}`;
  const history = next.recentItems?.[key] ?? [];
  const recentItems = { ...next.recentItems, [key]: [...history.filter(id => id !== a.itemId), a.itemId].slice(-12) };
  return { ...next, recentItems };
}

function applyProbeAnswer(state: StudentState, seen: string[], session: Session, a: GradedAnswer): StudentState {
  const node = a.node;
  const st = probeStatus(session, node);
  if (st.next === "done" || a.type !== st.next) return state; // invalid transition
  if (session.outcome) return state; // session already concluded

  // void items consume no budget and carry no evidence
  const probeCount = a.correct === null ? session.probeCount : session.probeCount + 1;
  let next: Session = { ...session, answers: [...session.answers, a], probeCount };

  const status = probeStatus(next, node);
  if (status.next === "done" && status.result) {
    next = { ...next, probed: { ...next.probed, [node]: status.result } };
    // The check never ends on one right answer: whenever a node's check is
    // finished (cleared OR difficulty found), its supporting concepts go right
    // after it, in builder-recorded suspect order, so the session keeps walking
    // the a/b/c chain until the probe budget runs out or the queue is empty.
    const idx = next.queue.indexOf(node);
    const add = GRAPH[node].prereqs.filter((p) => !next.queue.includes(p));
    next = { ...next, queue: [...next.queue.slice(0, idx + 1), ...add, ...next.queue.slice(idx + 1)] };
  }

  const step = nextStep(next);
  if (step.kind === "finish") {
    next = { ...next, outcome: step.outcome, suspected: step.suspected };
    next = { ...next, notChecked: notCheckedNodes(next) };
  }

  let out: StudentState = { ...state, seenInstances: seen, session: next };
  const res = next.probed[node];
  if (res && res !== session.probed[node] && res !== "untested") {
    // evidence wins over history
    out = setNode(out, node, res as NodeState, a.at, `probe:${res}`, { nextRecheck: undefined, recheckStep: 0 });
  }
  return out;
}
