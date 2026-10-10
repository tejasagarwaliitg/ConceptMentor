import type { NodeId } from "@/lib/types";
import type { Bank, BankQuestion, Level } from "./types";

/**
 * Which questions may be served. Production: human-approved only (same rule as the
 * diagnostic items, idea.md 5.1). Local dev with SERVE_UNAPPROVED=true also allows
 * `verified` (two blind solves agreed). `needs_review` is NEVER served.
 */
export function servable(bank: Bank, env: Record<string, string | undefined> = process.env): BankQuestion[] {
  const dev = env.SERVE_UNAPPROVED === "true" && env.NODE_ENV !== "production";
  return bank.questions.filter((q) => !q.diagnosticRole && (q.status === "approved" || (dev && q.status === "verified")));
}

export interface PickResult {
  question: BankQuestion | null;
  /** how many unseen questions remain for this node+level AFTER this pick */
  unseenLeft: number;
  /** true when the student has seen everything: caller should run a harvest */
  exhausted: boolean;
}

/**
 * Never returns a question whose id is in `seen`. If the pool is exhausted it returns
 * null with exhausted=true rather than repeating, so "new every time" is a guarantee,
 * not a tendency. `rand` is injectable for tests.
 */
export function pickFresh(
  bank: Bank,
  node: NodeId,
  level: Level,
  seen: string[],
  rand: () => number = Math.random,
  env: Record<string, string | undefined> = process.env
): PickResult {
  const seenSet = new Set(seen);
  const pool = servable(bank, env).filter((q) => q.node === node && q.level === level);
  const fresh = pool.filter((q) => !seenSet.has(q.id));
  if (!fresh.length) return { question: null, unseenLeft: 0, exhausted: true };
  const question = fresh[Math.floor(rand() * fresh.length)];
  return { question, unseenLeft: fresh.length - 1, exhausted: false };
}

/** Coverage table: how many servable questions exist per node and level. */
export function coverage(bank: Bank, env: Record<string, string | undefined> = process.env) {
  const table: Record<string, Record<Level, number>> = {};
  for (const q of servable(bank, env)) {
    table[q.node] ??= { A: 0, B: 0, C: 0 };
    table[q.node][q.level] += 1;
  }
  return table;
}
