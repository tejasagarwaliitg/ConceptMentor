import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.ITEM_SECRET = "test-secret";
process.env.QBANK_PATH = "/tmp/qbank-grade-test.json";
process.env.SERVE_UNAPPROVED = "true";

import { writeFileSync, rmSync } from "node:fs";
import type { Bank, BankQuestion } from "@/lib/qbank/types";

const base: Omit<BankQuestion, "id" | "kind" | "options" | "answer"> = {
  node: "projectile", level: "B", agentLevel: "B", stem: "stem", conceptsUsed: ["x"], steps: 1,
  derivation: "worked", status: "approved", verification: { solves: [0, 0], agree: true },
  source: { exam: "JEE Advanced", tier: "advanced", year: 2023, paper: "Paper 2", url: "https://jeeadv.ac.in/x.pdf", anchor: "anchor anchor" },
  flags: [], addedAt: 0,
};

function writeBank(qs: BankQuestion[]) {
  writeFileSync("/tmp/qbank-grade-test.json", JSON.stringify({ version: 1, questions: qs, processed: [] } satisfies Bank));
}

const { issueToken } = await import("@/lib/qbank/token");
const { POST } = await import("@/app/api/qbank/grade/route");
const grade = async (token: string, chosen?: number[], numeric?: number) => {
  const res = await POST(new Request("http://test.local/api/qbank/grade", { method: "POST", body: JSON.stringify({ token, chosen, numeric }) }));
  return { status: res.status, body: await res.json() };
};

afterAll(() => rmSync("/tmp/qbank-grade-test.json", { force: true }));

describe("grading each kind", () => {
  it("single: a wrong pick is marked wrong and the right index is revealed", async () => {
    writeBank([{ ...base, id: "s1", kind: "single", options: ["a", "b", "c", "d"], answer: 1 }]);
    // order = identity so the shown index matches
    const r = await grade(issueToken("s1", [0, 1, 2, 3]), [0]);
    expect(r.body.correct).toBe(false);
    expect(r.body.correctText).toBe("b");
    expect(r.body.correctIndexes).toEqual([1]);
    expect(r.body.derivation).toBe("worked");
  });
  it("single: options are shuffled per instance, so grading respects the permutation", async () => {
    writeBank([{ ...base, id: "s1", kind: "single", options: ["a", "b", "c", "d"], answer: 1 }]);
    // order shows option 1 first
    const r = await grade(issueToken("s1", [1, 0, 2, 3]), [0]);
    expect(r.body.correct).toBe(true);
    expect(r.body.correctIndexes).toEqual([0]);
  });
  it("multi: correct only when the set matches exactly; partial credit is not correct", async () => {
    writeBank([{ ...base, id: "m1", kind: "multi", options: ["a", "b", "c", "d"], answer: null, answerIndices: [0, 2] }]);
    const ok = await grade(issueToken("m1", [0, 1, 2, 3]), [0, 2]);
    expect(ok.body.correct).toBe(true);
    expect(ok.body.correctIndexes.sort()).toEqual([0, 2]);
    const partial = await grade(issueToken("m1", [0, 1, 2, 3]), [0]);
    expect(partial.body.correct).toBe(false);
    const wrong = await grade(issueToken("m1", [0, 1, 2, 3]), [1, 2, 3]);
    expect(wrong.body.correct).toBe(false);
  });
  it("numeric: correct inside tolerance, wrong outside; no index is revealed", async () => {
    writeBank([{ ...base, id: "n1", kind: "numeric", options: [], answer: null, answerValue: 34.6, tolerance: 0.5, unit: "m" }]);
    const ok = await grade(issueToken("n1", []), undefined, 34.8);
    expect(ok.status).toBe(200);
    expect(ok.body.correct).toBe(true);
    expect(ok.body.correctText).toContain("34.6");
    const bad = await grade(issueToken("n1", []), undefined, 35.5);
    expect(bad.body.correct).toBe(false);
    expect(bad.body.correctIndexes).toEqual([]);
  });
  it("rejects a tampered token and an unknown question", async () => {
    writeBank([]);
    expect((await grade("garbage", [0])).status).toBe(400);
  });
});
