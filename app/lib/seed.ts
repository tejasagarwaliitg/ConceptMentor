import { reduce, initialState, type Event } from "./engine";
import type { Confidence, GradedAnswer, ItemType, NodeId, StudentState } from "./types";

const H = 60 * 60 * 1000;
const DAY = 24 * H;
// 19:00 IST across 7 days (Oct 1-7 2026). Also gives the demo a real usual hour.
const T0 = Date.UTC(2026, 9, 1, 13, 30);

function ans(seq: number, node: NodeId, type: ItemType, correct: boolean | null, at: number, confidence: Confidence = "shayad"): GradedAnswer {
  return { instanceId: `demo-${seq}`, itemId: `demo-${node}-${type}-${seq}`, node, type, correct, dontKnow: false, confidence, at };
}

function session(entry: NodeId, at: number, answers: GradedAnswer[]): Event[] {
  return [
    { type: "startSession", entry, at, sessionId: `demo-s-${entry}-${at}` },
    ...answers.map((a) => ({ type: "graded" as const, answer: a })),
    { type: "endSession" },
  ];
}

/**
 * Demo account history (all simulated data), as a fixed event list so tests
 * can replay it and observe mid-run outcomes. Drives the reducer directly.
 * End states: vec_comp context_difficulty (via retained), kin_1d gap,
 * trig no_difficulty_found, slope checked_immediate, motion_graphs retained.
 * Pakka calibration is 4/5 correct (0.8).
 */
export const DEMO_SEED_EVENTS: Event[] = [
  // day 0: vec_comp gap, repaired -> checked_immediate
  ...session("vec_comp", T0, [ans(1, "vec_comp", "B1", false, T0), ans(2, "vec_comp", "A", false, T0), ans(3, "vec_comp", "B2", true, T0)]),
  // day 1: re-check passes -> retained
  ...session("vec_comp", T0 + DAY, [ans(4, "vec_comp", "B2", true, T0 + DAY + 5 * 60 * 1000)]),
  // day 2: kin_1d gap, repair attempt misses -> stays gap
  ...session("kin_1d", T0 + 2 * DAY, [
    ans(5, "kin_1d", "B1", false, T0 + 2 * DAY),
    ans(6, "kin_1d", "A", false, T0 + 2 * DAY, "pakka"),
    ans(7, "kin_1d", "B2", false, T0 + 2 * DAY),
  ]),
  // day 3: vec_comp re-check misses -> context_difficulty (retention is honest)
  ...session("vec_comp", T0 + 3 * DAY, [ans(8, "vec_comp", "B2", false, T0 + 3 * DAY)]),
  // day 4: trig clean -> no_prereq_weakness session
  ...session("trig", T0 + 4 * DAY, [ans(9, "trig", "B1", true, T0 + 4 * DAY, "pakka")]),
  // day 5: slope gap, repaired -> checked_immediate (stays)
  ...session("slope", T0 + 5 * DAY, [
    ans(10, "slope", "B1", false, T0 + 5 * DAY),
    ans(11, "slope", "A", false, T0 + 5 * DAY),
    ans(12, "slope", "B2", true, T0 + 5 * DAY, "pakka"),
  ]),
  // day 5-6: motion_graphs gap, repaired, re-checked -> retained (stays)
  ...session("motion_graphs", T0 + 5 * DAY + H, [
    ans(13, "motion_graphs", "B1", false, T0 + 5 * DAY + H),
    ans(14, "motion_graphs", "A", false, T0 + 5 * DAY + H),
    ans(15, "motion_graphs", "B2", true, T0 + 5 * DAY + H, "pakka"),
  ]),
  ...session("motion_graphs", T0 + 6 * DAY + 2 * H, [ans(16, "motion_graphs", "B2", true, T0 + 6 * DAY + 2 * H + 5 * 60 * 1000, "pakka")]),
];

export function buildDemoState(): StudentState {
  let s = initialState();
  for (const ev of DEMO_SEED_EVENTS) s = reduce(s, ev);
  return s;
}
