import { z } from "zod";
import { LIVE_NODES } from "@/content/graph";
import type { NodeId, StudentState } from "./types";

/**
 * Imported progress is SELF-REPORTED (idea.md 11.3): validated, flagged, never shown as verified.
 * Anything malformed is rejected.
 */
const NodeRecord = z.object({
  state: z.enum(["untested", "gap", "context_difficulty", "no_difficulty_found", "checked_immediate", "retained"]),
  lastChange: z.number(),
  nextRecheck: z.number().optional(),
  recheckStep: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)]),
  proficiency: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  history: z.array(z.object({ at: z.number(), event: z.string().max(60) })).max(30),
});

const Schema = z.object({
  version: z.literal(1),
  settings: z.object({ lowData: z.boolean(), preferredChannels: z.array(z.string().max(100)).max(30).optional(), videoFeedback: z.record(z.string().max(200), z.union([z.literal(1), z.literal(2), z.literal(3)])).optional() }),
  nodes: z.record(z.string(), NodeRecord),
  seenQuestionIds: z.array(z.string().max(100)).max(10000).optional(),
  seenInstances: z.array(z.string().max(80)).max(200),
  recentItems: z.record(z.string().max(40), z.array(z.string().max(80)).max(12)).optional(),
  weekly: z.record(z.string(), z.object({ done: z.number().int().min(0), passed: z.number().int().min(0) })),
  simulatedDays: z.number().int().min(0).max(400),
  flaggedItems: z.array(z.string().max(80)).max(200),
  activity: z.array(z.number()).max(120).optional(),
  levelQueue: z.array(z.string().max(20)).max(20).optional(),
});

const LIVE = new Set<string>(LIVE_NODES);

export function parseImport(text: string): StudentState | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const p = Schema.safeParse(json);
  if (!p.success) return null;
  const nodes: StudentState["nodes"] = {};
  for (const [k, v] of Object.entries(p.data.nodes)) {
    if (!LIVE.has(k)) continue; // unknown nodes are dropped
    nodes[k as keyof StudentState["nodes"]] = { ...v, selfReported: true };
  }
  return {
    ...p.data,
    nodes,
    recentItems: p.data.recentItems ?? {},
    activity: p.data.activity ?? [],
    levelQueue: p.data.levelQueue?.filter((n) => LIVE.has(n)) as NodeId[] | undefined,
    session: undefined,
  };
}
