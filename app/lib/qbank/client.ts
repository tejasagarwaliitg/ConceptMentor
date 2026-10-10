"use client";
import type { Level } from "./types";
import type { NodeId } from "@/lib/types";

export interface PracticeQuestion {
  id: string;
  node: NodeId;
  level: Level;
  kind: "single" | "multi" | "numeric";
  unit?: string;
  stem: string;
  options: string[];
  source: string;
  tier: "main" | "advanced";
  unseenLeft: number;
  token: string;
}

export type FetchResult = { ok: true; q: PracticeQuestion } | { ok: false; reason: "pool_exhausted" | "no_question" | "network" };

export async function fetchPractice(node: NodeId, level: Level, seen: string[]): Promise<FetchResult> {
  try {
    const r = await fetch("/api/qbank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node, level, seen }),
    });
    if (r.ok) return { ok: true, q: (await r.json()) as PracticeQuestion };
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    return { ok: false, reason: j.error === "pool_exhausted" ? "pool_exhausted" : "no_question" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export interface PracticeGrade {
  correct: boolean;
  dontKnow: boolean;
  correctText: string;
  kind: "single" | "multi" | "numeric";
  /** indexes into the SHOWN options that were correct; empty for numeric */
  correctIndexes: number[];
  derivation: string;
  verified: "approved" | "ai-checked";
}

/** chosen: indexes into the shown options (single: one; multi: many; -1 = do not know). numeric: the entered value. */
export async function gradePractice(token: string, chosen: number[], numeric?: number): Promise<PracticeGrade | null> {
  try {
    const r = await fetch("/api/qbank/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, chosen, numeric }),
    });
    return r.ok ? ((await r.json()) as PracticeGrade) : null;
  } catch {
    return null;
  }
}

export async function fetchCoverage(): Promise<Record<string, Record<Level, number>> | null> {
  try {
    const r = await fetch("/api/qbank");
    return r.ok ? ((await r.json()) as { coverage: Record<string, Record<Level, number>> }).coverage : null;
  } catch {
    return null;
  }
}

/** Question history is scoped to a profile; guest history lasts for this tab. */
const memory = new Map<string, string[]>();
function storage(scope: string): Storage { return scope === "guest" ? window.sessionStorage : window.localStorage; }
const key = (scope: string) => `qbank.seen.v2:${scope}`;
export function loadSeen(scope = "device"): string[] {
  try {
    const raw: unknown = JSON.parse(storage(scope).getItem(key(scope)) ?? "[]");
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : [];
  } catch { return memory.get(scope) ?? []; }
}
export function markSeen(id: string, scope = "device"): string[] {
  const next = [...new Set([...loadSeen(scope), id])];
  memory.set(scope, next);
  try { storage(scope).setItem(key(scope), JSON.stringify(next)); } catch { /* retain this session's history */ }
  return next;
}
export function clearSeen(scope = "device"): void {
  memory.delete(scope);
  try { storage(scope).removeItem(key(scope)); } catch { /* storage unavailable */ }
}
