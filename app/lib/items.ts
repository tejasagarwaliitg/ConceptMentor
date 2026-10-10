import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Item } from "@/content/items.draft";
import { loadBank } from "./qbank/store";
import {
  DONT_KNOW,
  WORDING_VOID,
  type Confidence,
  type GradedAnswer,
  type ItemType,
  type NodeId,
  type PublicItem,
} from "./types";

/**
 * SERVER-ONLY. Answer keys never leave this module.
 * Only items with approved === true are ever served (idea.md 5.1).
 */

const SECRET = process.env.ITEM_SECRET ?? "dev-only-secret-change-me";
const TTL_MS = 30 * 60 * 1000;

/** Fetch the current question-bank file for every issue/grade request. */
export function diagnosticBankItems(): Item[] {
  return loadBank().questions.flatMap((q): Item[] => {
    if (!q.diagnosticRole || (q.kind && q.kind !== "single") || !Number.isInteger(q.answer) || q.answer === null || q.answer < 0 || q.answer >= q.options.length) return [];
    const approved = q.status === "approved" && !!q.approvedBy?.trim();
    const draft = process.env.SERVE_UNAPPROVED === "true" && process.env.NODE_ENV !== "production" && q.origin === "authored";
    if (!approved && !draft) return [];
    return [{ id: q.id, node: q.node, type: q.diagnosticRole, stem: q.stem, options: q.options, answer: q.answer,
      tags: q.tags ?? q.options.map(() => null), approved, approvedBy: q.approvedBy,
      source: { exam: "derived", year: q.source.year, topic: q.source.paper, note: q.source.exam },
      derivation: q.derivation, variant: q.variant, check: q.check }];
  });
}

export function approvedItems(): Item[] { return diagnosticBankItems().filter(i => i.approved); }
function servable(): Item[] { return diagnosticBankItems(); }

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function findItem(node: NodeId, type: ItemType, excludeIds: string[] = []): Item | null {
  const pool = servable().filter((i) => i.node === node && i.type === type);
  const fresh = pool.filter((item) => !excludeIds.includes(item.id));
  // Exhaustion is explicit: never recycle a seen question.
  return fresh.length ? fresh[Math.floor(Math.random() * fresh.length)] : null;
}

export interface IssuedItem {
  item: PublicItem;
  instanceId: string;
  instanceToken: string;
}

/** Shuffle options per instance so a position is never the answer; token carries the permutation. */
export function issueItem(node: NodeId, type: ItemType, excludeIds: string[] = []): IssuedItem | null {
  const it = findItem(node, type, excludeIds);
  if (!it) return null;
  const order = it.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const instanceId = randomUUID();
  const issuedAt = Date.now();
  const payload = `${instanceId}|${it.id}|${order.join(",")}|${issuedAt}`;
  const instanceToken = `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
  const item: PublicItem = {
    id: it.id,
    node: it.node,
    type: it.type,
    stem: it.stem,
    options: order.map((o) => it.options[o]),
  };
  return { item, instanceId, instanceToken };
}

export interface GradeResult {
  ok: boolean;
  error?: string;
  answer?: GradedAnswer;
  /** shown only AFTER grading */
  correctText?: string;
  tag?: string | null;
}

export function gradeItem(input: {
  instanceToken: string;
  chosen: number; // index into the shuffled options, or DONT_KNOW / WORDING_VOID
  confidence: Confidence;
  now?: number;
}): GradeResult {
  const [b64, sig] = input.instanceToken.split(".");
  if (!b64 || !sig) return { ok: false, error: "bad token" };
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString();
  } catch {
    return { ok: false, error: "bad token" };
  }
  if (!safeEqual(sign(payload), sig)) return { ok: false, error: "bad signature" };
  const [instanceId, itemId, orderStr, issuedAtStr] = payload.split("|");
  const issuedAt = Number(issuedAtStr);
  const t = input.now ?? Date.now();
  if (!Number.isFinite(issuedAt) || t - issuedAt > TTL_MS) return { ok: false, error: "expired" };

  const it = servable().find((i) => i.id === itemId);
  if (!it) return { ok: false, error: "unknown item" };
  const order = orderStr.split(",").map(Number);

  let correct: boolean | null;
  let tag: string | null = null;
  let dontKnow = false;
  if (input.chosen === WORDING_VOID) {
    correct = null;
  } else if (input.chosen === DONT_KNOW) {
    correct = false;
    dontKnow = true; // never assigns a misconception tag
  } else {
    if (!Number.isInteger(input.chosen) || input.chosen < 0 || input.chosen >= order.length) {
      return { ok: false, error: "bad choice" };
    }
    const original = order[input.chosen];
    correct = original === it.answer;
    tag = correct ? null : it.tags[original] ?? null;
  }

  const answer: GradedAnswer = {
    instanceId,
    itemId: it.id,
    node: it.node,
    type: it.type,
    correct,
    dontKnow,
    confidence: input.confidence,
    tag: tag ?? undefined,
    at: t,
  };
  return { ok: true, answer, correctText: it.options[it.answer], tag };
}
