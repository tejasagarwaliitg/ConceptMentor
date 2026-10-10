import { GRAPH, LIVE_NODES } from "@/content/graph";
import { connectedCount } from "./checks";
import { dueNodes, thisWeek } from "./engine";
import type { NodeId, NodeState, StudentState } from "./types";

const STATE_LABEL: Record<NodeState, string> = {
  untested: "Not checked yet",
  gap: "Suspected contributing gap",
  context_difficulty: "Different on changed context",
  no_difficulty_found: "No difficulty found in this check",
  checked_immediate: "Immediate check passed; retention untested",
  retained: "Still correct on a later check",
};

export interface NodeChip {
  node: NodeId;
  state: NodeState;
  laterTopics: number;
  label: string;
}

/** Per-node chips citing only real node states plus later-topic counts. */
export function nodeChips(state: StudentState): NodeChip[] {
  const out: NodeChip[] = [];
  for (const node of LIVE_NODES) {
    const rec = state.nodes[node];
    if (!rec) continue;
    const laterTopics = connectedCount(node);
    out.push({
      node,
      state: rec.state,
      laterTopics,
      label: `${GRAPH[node].name} — ${STATE_LABEL[rec.state]}. Connected to ${laterTopics} later topics.`,
    });
  }
  return out;
}

/** Two to three evidence lines counted from session answers. */
export function evidenceLines(state: StudentState): string[] {
  const answers = state.session?.answers ?? [];
  const stdTotal = answers.filter((a) => a.type === "A").length;
  const stdCorrect = answers.filter((a) => a.type === "A" && a.correct === true).length;
  const chTotal = answers.filter((a) => a.type === "B1").length;
  const chNotCorrect = answers.filter((a) => a.type === "B1" && a.correct === false).length;
  const guessTotal = answers.filter((a) => a.confidence === "guess").length;
  const guessNotCorrect = answers.filter(
    (a) => a.confidence === "guess" && a.correct === false
  ).length;
  return [
    `Standard: ${stdCorrect} correct out of ${stdTotal} answered.`,
    `Changed context: ${chNotCorrect} not correct out of ${chTotal} answered.`,
    `Guessing: ${guessTotal} marked as guessing, ${guessNotCorrect} not correct.`,
  ];
}

/** Revision line reusing dueNodes/thisWeek rather than new date math. */
export function revisionLine(state: StudentState, realNow = Date.now()): string {
  const due = dueNodes(state, realNow).length;
  const week = thisWeek(state, realNow);
  const unit = due === 1 ? "concept is" : "concepts are";
  return `${due} ${unit} ready for review. This week ${week.done} checks, ${week.passed} passed.`;
}

/** Every student-facing string this module can render (for the copy sweep). */
export function allObservationStrings(state: StudentState, realNow = Date.now()): string[] {
  return [...nodeChips(state).map((c) => c.label), ...evidenceLines(state), revisionLine(state, realNow)];
}
