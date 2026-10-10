import { describe, expect, it } from "vitest";
import { processChunk, type Agents } from "@/lib/qbank/pipeline";
import { emptyBank } from "@/lib/qbank/store";
import { agree, CHUNK, extractor, paper, raw } from "./qbank-fixtures";

describe("pipeline trust ladder", () => {
  it("verifies when two blind solves match, and never auto-approves", async () => {
    const bank = emptyBank();
    const r = await processChunk(bank, paper, 0, CHUNK, { extract: extractor([raw()]), solve: agree(2) });
    expect(r.added).toBe(1);
    expect(bank.questions[0].status).toBe("verified");
    expect(bank.questions[0].level).toBe("B"); // advanced source: an easy question is promoted to B
    expect(bank.questions[0].flags.join()).toContain("tier policy");
    expect(bank.questions[0].approvedBy).toBeUndefined();
    expect(bank.processed).toEqual([`${paper.url}#0`]);
  });
  it("keeps disagreeing questions as needs_review", async () => {
    const bank = emptyBank();
    await processChunk(bank, paper, 0, CHUNK, { extract: extractor([raw()]), solve: agree(1) });
    expect(bank.questions[0].status).toBe("needs_review");
    expect(bank.questions[0].flags.join()).toContain("disagree");
  });
  it("needs_review when a blind solve is unavailable", async () => {
    const bank = emptyBank();
    await processChunk(bank, paper, 0, CHUNK, { extract: extractor([raw()]), solve: async () => ({ value: null, error: "x" }) });
    expect(bank.questions[0].status).toBe("needs_review");
  });
  it("rejects a question whose anchor is not in the official text", async () => {
    const bank = emptyBank();
    const r = await processChunk(bank, paper, 0, CHUNK, {
      extract: extractor([raw({ anchor: "A cannonball is fired from a ship at sea level" })]),
      solve: agree(2),
    });
    expect(r.added).toBe(0);
    expect(r.rejected[0].reason).toContain("anchor");
  });
  it("rejects duplicate options and duplicate stems", async () => {
    const bank = emptyBank();
    const dup = await processChunk(bank, paper, 0, CHUNK, {
      extract: extractor([raw({ options: ["1", "1", "2", "3"] })]), solve: agree(2),
    });
    expect(dup.added).toBe(0);
    await processChunk(bank, paper, 0, CHUNK, { extract: extractor([raw()]), solve: agree(2) });
    const again = await processChunk(bank, paper, 1, CHUNK, { extract: extractor([raw()]), solve: agree(2) });
    expect(again.added).toBe(0);
    expect(bank.questions).toHaveLength(1);
  });
  it("does not mark a chunk processed when the agent fails, so it is retried", async () => {
    const bank = emptyBank();
    await processChunk(bank, paper, 0, CHUNK, { extract: async () => ({ value: null, error: "timeout" }), solve: agree(0) });
    expect(bank.processed).toEqual([]);
  });
  it("level comes from concepts and steps even if the agent claims A", async () => {
    const bank = emptyBank();
    await processChunk(bank, paper, 0, CHUNK, {
      extract: extractor([raw({ conceptsUsed: ["range", "relative motion"], steps: 5, agentLevel: "A" })]),
      solve: agree(2),
    });
    expect(bank.questions[0].level).toBe("C");
    expect(bank.questions[0].flags.join()).toContain("level audit");
  });
});

describe("multi-correct and numeric questions", () => {
  const multi = (over: Partial<ReturnType<typeof raw>> = {}) => raw({ kind: "multi", options: ["a", "b", "c", "d"], answerIndices: [0, 2], answerIndex: undefined, ...over });
  const numeric = (over: Partial<ReturnType<typeof raw>> = {}) => raw({ kind: "numeric", options: [], answerIndex: undefined, answerValue: 34.6, tolerance: 0.5, unit: "m", ...over });
  const solve = (kind: "multi" | "numeric", v: Partial<{ answerIndices: number[]; answerValue: number }>): Agents["solve"] =>
    async () => ({ value: { kind, ...v } as never });

  it("verifies a multi-correct question when both blind solves pick the same set", async () => {
    const bank = emptyBank();
    await processChunk(bank, paper, 0, CHUNK, { extract: extractor([multi()]), solve: solve("multi", { answerIndices: [0, 2] }) });
    expect(bank.questions[0].kind).toBe("multi");
    expect(bank.questions[0].answerIndices).toEqual([0, 2]);
    expect(bank.questions[0].status).toBe("verified");
  });
  it("flags a multi-correct question when a solver picks a different set", async () => {
    const bank = emptyBank();
    await processChunk(bank, paper, 0, CHUNK, { extract: extractor([multi()]), solve: solve("multi", { answerIndices: [1] }) });
    expect(bank.questions[0].status).toBe("needs_review");
  });
  it("verifies a numeric question inside tolerance, rejects one outside", async () => {
    const bank = emptyBank();
    await processChunk(bank, paper, 0, CHUNK, { extract: extractor([numeric()]), solve: solve("numeric", { answerValue: 34.7 }) });
    expect(bank.questions[0].status).toBe("verified");
    expect(bank.questions[0].answerValue).toBe(34.6);
    expect(bank.questions[0].answer).toBeNull();

    const bank2 = emptyBank();
    await processChunk(bank2, paper, 0, CHUNK, { extract: extractor([numeric()]), solve: solve("numeric", { answerValue: 40 }) });
    expect(bank2.questions[0].status).toBe("needs_review");
  });
  it("rejects a numeric question that still has options, and one without a value", async () => {
    const bank = emptyBank();
    await processChunk(bank, paper, 0, CHUNK, { extract: extractor([numeric({ options: ["1", "2", "3", "4"] })]), solve: solve("numeric", { answerValue: 34.6 }) });
    await processChunk(bank, paper, 1, CHUNK, { extract: extractor([numeric()]), solve: solve("numeric", { answerValue: 34.6 }) });
    expect(bank.questions.map((q) => q.id)).toHaveLength(1); // only the well-formed one landed
    // a numeric question with no answerValue at all is rejected before a solve is even requested
    const q = numeric() as Record<string, unknown>;
    delete q.answerValue;
    const { structuralProblem } = await import("@/lib/qbank/pipeline");
    expect(structuralProblem(q as never, CHUNK)).toContain("answerValue");
  });
});
