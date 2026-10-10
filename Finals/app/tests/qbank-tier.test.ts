import { describe, expect, it, vi } from "vitest";
import { applyTierPolicy, processChunk } from "@/lib/qbank/pipeline";
import { configuredPapers } from "@/lib/qbank/sources";
import { emptyBank } from "@/lib/qbank/store";
import { agree, CHUNK, extractor, paper, raw } from "./qbank-fixtures";

vi.mock("server-only", () => ({}));
process.env.ITEM_SECRET = "test-secret";
const { issueToken, readToken, shuffleOrder } = await import("@/lib/qbank/token");

describe("source tier decides the level", () => {
  it("JEE Main is always A; advanced is never A", () => {
    expect(applyTierPolicy("C", "main")).toBe("A");
    expect(applyTierPolicy("B", "main")).toBe("A");
    expect(applyTierPolicy("A", "advanced")).toBe("B");
    expect(applyTierPolicy("B", "advanced")).toBe("B");
    expect(applyTierPolicy("C", "advanced")).toBe("C");
  });
  it("a hard JEE Main question is capped at A and flagged", async () => {
    const bank = emptyBank();
    await processChunk(bank, { ...paper, exam: "JEE Main", tier: "main" }, 0, CHUNK, {
      extract: extractor([raw({ conceptsUsed: ["a", "b"], steps: 6 })]), solve: agree(2),
    });
    expect(bank.questions[0].level).toBe("A");
    expect(bank.questions[0].source.tier).toBe("main");
    expect(bank.questions[0].flags.join()).toContain("tier policy");
  });
  it("configured sources: official URLs and local files pass, others are dropped", () => {
    const out = configuredPapers([
      { exam: "JEE Main", tier: "main", year: 2024, paper: "Shift 2", url: "https://nta.ac.in/Download/ExamPaper/x.pdf" },
      { exam: "Irodov", tier: "advanced", year: 1979, paper: "Ch 1", localPath: "/books/irodov.pdf" },
      { exam: "Blog", tier: "main", year: 2024, paper: "x", url: "https://coaching.example/x.pdf" },
    ]);
    expect(out.map((p) => p.exam)).toEqual(["JEE Main", "Irodov"]);
    expect(out[1].localPath).toBe("/books/irodov.pdf");
  });
});

describe("signed question tokens", () => {
  it("round-trips the id and option order", () => {
    const t = issueToken("q1", [2, 0, 3, 1]);
    expect(readToken(t)).toEqual({ id: "q1", order: [2, 0, 3, 1] });
  });
  it("rejects tampering and expiry", () => {
    const t = issueToken("q1", [0, 1, 2, 3], 1000);
    expect(readToken(t, 1000 + 61 * 60 * 1000)).toBeNull();
    const [b64, sig] = t.split(".");
    const forged = Buffer.from(Buffer.from(b64, "base64url").toString().replace("q1", "q2")).toString("base64url");
    expect(readToken(`${forged}.${sig}`, 1000)).toBeNull();
    expect(readToken("garbage")).toBeNull();
  });
  it("shuffleOrder is a permutation", () => {
    expect([...shuffleOrder(4)].sort()).toEqual([0, 1, 2, 3]);
  });
});
