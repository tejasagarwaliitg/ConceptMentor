import { describe, expect, it, vi } from "vitest";
import type { PaperRef } from "@/lib/qbank/types";

// Replace the PDF reader: papers are fake page arrays, so no network or PDF parsing.
const PAGES: Record<string, { pages: string[]; scanned: boolean }> = {};
vi.mock("@/lib/qbank/extract", async (orig) => ({
  ...(await orig<typeof import("@/lib/qbank/extract")>()),
  readPdf: async (data: Uint8Array) => PAGES[new TextDecoder().decode(data)],
}));

const { harvest } = await import("@/lib/qbank/harvest");
const { emptyBank } = await import("@/lib/qbank/store");

const mk = (year: number): PaperRef => ({ exam: "JEE Advanced", tier: "advanced", year, paper: "Paper 1", url: `https://jeeadv.ac.in/past_qps/${year}_1.pdf` });
const body = (tag: string) => `${tag} velocity of the projectile (A) 1 (B) 2 `.padEnd(400, "filler text ");
PAGES["https://jeeadv.ac.in/past_qps/2022_1.pdf"] = { pages: [0, 1, 2, 3, 4, 5].map((i) => body(`p22-${i}`)), scanned: false };
PAGES["https://jeeadv.ac.in/past_qps/2019_1.pdf"] = { pages: [], scanned: true };
const download = async (url: string) => new TextEncoder().encode(url);

function make(seenChunks: string[]) {
  return {
    extract: async (chunk: string) => {
      seenChunks.push(chunk.slice(0, 6));
      return { value: { questions: [] } };
    },
    solve: async () => ({ value: null }),
  };
}

describe("harvest brings new material every run", () => {
  it("never re-reads a processed chunk and stops when the paper is used up", async () => {
    const bank = emptyBank();
    const papers = [mk(2022), mk(2019)];
    const first: string[] = [];
    const r1 = await harvest(bank, { maxChunks: 2, papers, download, agents: make(first), rand: () => 0.3 });
    expect(r1.chunksTried).toBe(2);
    expect(bank.processed).toHaveLength(2);

    const second: string[] = [];
    const r2 = await harvest(bank, { maxChunks: 5, papers, download, agents: make(second), rand: () => 0.3 });
    expect(r2.chunksTried).toBe(1); // the paper has 3 chunks; 2 were used in run 1
    expect(new Set(bank.processed).size).toBe(3); // no chunk processed twice
    expect(second.filter((c) => first.includes(c))).toEqual([]);

    const third: string[] = [];
    const r3 = await harvest(bank, { maxChunks: 5, papers, download, agents: make(third) });
    expect(r3.chunksTried).toBe(0); // exhausted: nothing is re-read
    expect(third).toEqual([]);
  });

  it("skips scanned PDFs and reports them", async () => {
    const r = await harvest(emptyBank(), { maxChunks: 5, papers: [mk(2019)], download, agents: make([]) });
    expect(r.skippedScanned).toEqual(["https://jeeadv.ac.in/past_qps/2019_1.pdf"]);
    expect(r.chunksTried).toBe(0);
  });
});
