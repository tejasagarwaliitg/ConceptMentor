import { ENTRY_NODES, dependentsOf } from "@/content/graph";
import {
  DAY_MS,
  type NodeId,
  type NodeRecord,
  type NodeState,
  type Session,
  type StudentSettings,
  type StudentState,
  type GradedAnswer,
} from "./types";

export function initialState(): StudentState {
  const settings: StudentSettings = { lowData: false, preferredChannels: ["physics-wallah", "apna-college", "vedantu-jee"] };
  return { version: 1, settings, nodes: {}, seenInstances: [], seenQuestionIds: [], recentItems: {}, weekly: {}, simulatedDays: 0, flaggedItems: [], activity: [], levelQueue: [...ENTRY_NODES] };
}

/** A node counts as fixed/solved ("cleared") in these states. */
export const CLEARED_STATES: NodeState[] = ["no_difficulty_found", "checked_immediate", "retained"];

export function isClearedState(state: NodeState | undefined): boolean {
  return state !== undefined && CLEARED_STATES.includes(state);
}

/** The "check your level" queue of a state (never mutates its input). */
export function levelQueueOf(state: StudentState): NodeId[] {
  return state.levelQueue ?? [...ENTRY_NODES];
}

/**
 * Keep the card queue in sync: a cleared node leaves the queue and every topic
 * it connects to / advances to (its dependents) joins the back, once each.
 */
export function reconcileLevelQueue(state: StudentState, node: NodeId): StudentState {
  const queue = levelQueueOf(state).filter((n) => n !== node && !isClearedState(state.nodes[n]?.state));
  for (const d of dependentsOf(node)) {
    if (!queue.includes(d) && !isClearedState(state.nodes[d]?.state)) queue.push(d);
  }
  return { ...state, levelQueue: queue };
}

/** Current time including the simulated offset (demo only; labelled in the UI) */
export function now(state: StudentState, realNow = Date.now()): number {
  return realNow + state.simulatedDays * DAY_MS;
}

export function weekKey(t: number): string {
  const d = new Date(t);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / DAY_MS + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export type Event =
  | { type: "itemPresented"; itemId: string }
  | { type: "startSession"; entry: NodeId; at: number; sessionId: string }
  | { type: "graded"; answer: GradedAnswer }
  | { type: "dispute" }
  | { type: "endSession" }
  | { type: "simulateDays"; days: number }
  | { type: "setSettings"; settings: Partial<StudentSettings> }
  | { type: "flagItem"; itemId: string }
  | { type: "setRecheckChoice"; node: NodeId; days: 1 | 3 | 7; at: number }
  | { type: "reset" }
  | { type: "load"; state: StudentState };

export function newSession(entry: NodeId, at: number, id: string): Session {
  return {
    id,
    entry,
    startedAt: at,
    answers: [],
    probeCount: 0,
    queue: [entry],
    probed: {},
    repairAttempts: {},
    notChecked: [],
    disputed: false,
  };
}

export function setNode(
  state: StudentState,
  node: NodeId,
  next: NodeState,
  at: number,
  event: string,
  patch: Partial<NodeRecord> = {}
): StudentState {
  const prev: NodeRecord = state.nodes[node] ?? { state: "untested", lastChange: at, recheckStep: 0, history: [] };
  const rec: NodeRecord = {
    ...prev,
    ...patch,
    state: next,
    lastChange: at,
    history: [...prev.history, { at, event }].slice(-30),
  };
  const out: StudentState = { ...state, nodes: { ...state.nodes, [node]: rec } };
  // a fixed/solved node leaves the "check your level" cards; its dependents join
  return isClearedState(rec.state) ? reconcileLevelQueue(out, node) : out;
}

export function bumpWeek(state: StudentState, t: number, passed: boolean): StudentState["weekly"] {
  const k = weekKey(t);
  const w = state.weekly[k] ?? { done: 0, passed: 0 };
  return { ...state.weekly, [k]: { done: w.done + 1, passed: w.passed + (passed ? 1 : 0) } };
}
