import { z } from "zod";
import { GRAPH, LIVE_NODES } from "@/content/graph";
import type { NodeId } from "@/lib/types";

export const NodeIdSchema = z.enum(LIVE_NODES as [NodeId, ...NodeId[]]);

/** Job 0: map a real question (from a photo or typed) to the graph. */
export const ProposeEntrySchema = z.object({
  nodeId: NodeIdSchema,
  reason: z.string().min(8).max(200),
  confidence: z.enum(["high", "low"]),
});
export type ProposeEntry = z.infer<typeof ProposeEntrySchema>;

/** Job 1: choose the order in which to probe a node's prerequisites. Must be a permutation. */
export const ProbeOrderSchema = z.object({
  nodeId: NodeIdSchema,
  prereqOrder: z.array(NodeIdSchema).max(4),
  reason: z.string().max(160),
});
export type ProbeOrder = z.infer<typeof ProbeOrderSchema>;

/** Job 2: which stuck-point card to show first. */
export const StuckChoiceSchema = z.object({
  cardId: z.enum(["setup", "calculation", "interpretation"]),
  reason: z.string().max(160),
});
export type StuckChoice = z.infer<typeof StuckChoiceSchema>;

/** Job 3: order the repair options for this student. */
export const RepairOrderSchema = z.object({
  order: z.array(z.enum(["contrast", "check", "read", "video"])).max(4),
  reason: z.string().max(160),
});
export type RepairOrder = z.infer<typeof RepairOrderSchema>;

/**
 * Code-side validation. The model's output is only ever a *suggestion*.
 * Returns the validated value, or null (the caller then falls back to the default).
 */
export function validateProbeOrder(raw: unknown): ProbeOrder | null {
  const parsed = ProbeOrderSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { nodeId, prereqOrder } = parsed.data;
  const real = [...GRAPH[nodeId].prereqs].sort();
  const got = [...prereqOrder].sort();
  if (real.length !== got.length) return null;
  if (!real.every((p, i) => p === got[i])) return null; // must be an exact permutation
  return parsed.data;
}

export function validateStuckChoice(raw: unknown): StuckChoice | null {
  const p = StuckChoiceSchema.safeParse(raw);
  return p.success ? p.data : null;
}

/** The agent may only name a real node, and only from the candidates the engine could see. */
export function validateEntry(raw: unknown, allowed: NodeId[] | null): ProposeEntry | null {
  const p = ProposeEntrySchema.safeParse(raw);
  if (!p.success) return null;
  if (allowed && !allowed.includes(p.data.nodeId)) return null;
  return p.data;
}

export function validateRepairOrder(raw: unknown): RepairOrder | null {
  const p = RepairOrderSchema.safeParse(raw);
  if (!p.success) return null;
  const set = new Set(p.data.order);
  if (set.size !== p.data.order.length) return null; // no duplicates
  if (!set.has("check")) return null; // the immediate check can never be dropped
  return p.data;
}

/** Words that must never reach a student (7). */
export const BANNED = ["weak", "fail", "failed", "dumb", "stupid", "bekaar", "trick-user", "loser"];
export function containsBanned(text: string): boolean {
  const t = text.toLowerCase();
  return BANNED.some((w) => new RegExp(`\\b${w}\\b`).test(t));
}
