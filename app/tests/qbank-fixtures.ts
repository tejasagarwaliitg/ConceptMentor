import type { Agents } from "@/lib/qbank/pipeline";
import type { Bank, BankQuestion, PaperRef, RawQuestion } from "@/lib/qbank/types";

export const paper: PaperRef = { exam: "JEE Advanced", tier: "advanced", year: 2024, paper: "Paper 1", url: "https://jeeadv.ac.in/past_qps/2024_1_English.pdf" };
export const CHUNK = "Q.7 A projectile is thrown at 30 degrees above the horizontal with speed 20 m/s. Find the range. (A) 10 (B) 20 (C) 35 (D) 40";

export function raw(over: Partial<RawQuestion> = {}): RawQuestion {
  return {
    kind: "single",
    anchor: "A projectile is thrown at 30 degrees above the horizontal",
    node: "projectile",
    stem: "A projectile is thrown at 30 degrees above the horizontal with speed 20 m/s. Find the range (g=10).",
    options: ["10 m", "20 m", "34.6 m", "40 m"],
    answerIndex: 2,
    conceptsUsed: ["projectile range"],
    steps: 2,
    agentLevel: "B",
    derivation: "R = v^2 sin2θ / g = 400 × 0.866 / 10 = 34.6",
    ...over,
  };
}

export const agree = (n: number): Agents["solve"] => async () => ({ value: { kind: "single", answerIndex: n, derivation: "worked solution" } });
export const extractor = (qs: RawQuestion[]): Agents["extract"] => async () => ({ value: { questions: qs } });

export function q(id: string, level: "A" | "B" | "C", status: BankQuestion["status"]): BankQuestion {
  return {
    id, kind: "single", node: "projectile", level, agentLevel: level, stem: `stem ${id}`, options: ["a", "b", "c", "d"], answer: 0,
    conceptsUsed: ["x"], steps: 1, derivation: "d", status, verification: { solves: [0, 0], agree: true },
    source: { exam: "JEE Advanced", tier: "advanced", year: 2024, paper: "Paper 1", url: paper.url, anchor: "anchor anchor anchor" },
    flags: [], addedAt: 0,
  };
}
export const bankOf = (...qs: BankQuestion[]): Bank => ({ version: 1, questions: qs, processed: [] });
export const PROD = { NODE_ENV: "production" };
export const DEV = { SERVE_UNAPPROVED: "true", NODE_ENV: "development" };
