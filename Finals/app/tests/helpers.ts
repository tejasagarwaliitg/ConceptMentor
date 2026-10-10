import { initialState, reduce } from "@/lib/engine";
import type { Confidence, GradedAnswer, ItemType, NodeId, StudentState } from "@/lib/types";

let counter = 0;

export function ans(
  node: NodeId,
  type: ItemType,
  correct: boolean | null,
  confidence: Confidence = "shayad",
  at = 1_000_000
): GradedAnswer {
  counter += 1;
  return {
    instanceId: `inst-${counter}`,
    itemId: `${node}-${type}`,
    node,
    type,
    correct,
    dontKnow: false,
    confidence,
    at,
  };
}

export function start(entry: NodeId, at = 1_000_000): StudentState {
  return reduce(initialState(), { type: "startSession", entry, at, sessionId: "s1" });
}

export function give(s: StudentState, a: GradedAnswer): StudentState {
  return reduce(s, { type: "graded", answer: a });
}

/** vec_comp suspected, trig + vec_basics fine: the state right after the diagnosis in the demo */
export function repaired(): StudentState {
  let s = start("vec_comp");
  s = give(s, ans("vec_comp", "B1", false));
  s = give(s, ans("vec_comp", "A", true));
  s = give(s, ans("trig", "B1", true, "pakka"));
  s = give(s, ans("vec_basics", "B1", true, "pakka"));
  return s;
}
