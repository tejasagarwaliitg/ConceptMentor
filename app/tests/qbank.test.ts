import { describe, expect, it } from "vitest";
import { deriveLevel, levelDisagrees } from "@/lib/qbank/level";
import { anchorInSource } from "@/lib/qbank/extract";
import { isOfficialUrl, parseJeeAdvancedArchive } from "@/lib/qbank/sources";
import { pickFresh, servable } from "@/lib/qbank/select";
import { bankOf, CHUNK, DEV, PROD, q } from "./qbank-fixtures";

describe("level is derived by code, not trusted from the agent", () => {
  it("applies the rubric", () => {
    expect(deriveLevel(1, 1)).toBe("A");
    expect(deriveLevel(1, 2)).toBe("A");
    expect(deriveLevel(1, 3)).toBe("B");
    expect(deriveLevel(2, 3)).toBe("B");
    expect(deriveLevel(2, 4)).toBe("C");
    expect(deriveLevel(3, 6)).toBe("C");
    expect(deriveLevel(1, 8)).toBe("B");
  });
  it("flags only A-vs-C disagreement", () => {
    expect(levelDisagrees("C", "A")).toBe(true);
    expect(levelDisagrees("B", "A")).toBe(false);
  });
});

describe("official sources only", () => {
  it("accepts official hosts over https and rejects everything else", () => {
    expect(isOfficialUrl("https://jeeadv.ac.in/past_qps/2024_1_English.pdf")).toBe(true);
    expect(isOfficialUrl("https://cdn.nta.ac.in/x.pdf")).toBe(true);
    expect(isOfficialUrl("http://jeeadv.ac.in/x.pdf")).toBe(false);
    expect(isOfficialUrl("https://jeeadv.ac.in.evil.com/x.pdf")).toBe(false);
    expect(isOfficialUrl("https://coaching.example/jee.pdf")).toBe(false);
    expect(isOfficialUrl("not a url")).toBe(false);
  });
  it("discovers links from the archive (names differ by year) and skips Hindi/AAT", () => {
    const html = `<a href="past_qps/2014_1.pdf"></a><a href="past_qps/2019_1_English.pdf"></a>
      <a href="past_qps/2019_1_Hindi.pdf"></a><a href="past_qps/AAT-2019.pdf"></a><a href="past_qps/2014_1.pdf"></a>`;
    const papers = parseJeeAdvancedArchive(html);
    expect(papers.map((p) => `${p.year} ${p.paper}`)).toEqual(["2019 Paper 1", "2014 Paper 1"]);
    expect(papers[0].url).toBe("https://jeeadv.ac.in/past_qps/2019_1_English.pdf");
  });
});

describe("anchor guard", () => {
  it("matches despite line breaks and rejects invented text", () => {
    expect(anchorInSource("A projectile is thrown at 30 degrees\nabove the horizontal", CHUNK)).toBe(true);
    expect(anchorInSource("A cannonball is fired from a ship at sea level", CHUNK)).toBe(false);
  });
});

describe("serving rules", () => {
  const bank = bankOf(q("a1", "A", "approved"), q("a2", "A", "verified"), q("a3", "A", "needs_review"));
  it("production serves approved only", () => {
    expect(servable(bank, PROD).map((x) => x.id)).toEqual(["a1"]);
  });
  it("dev may add verified but never needs_review", () => {
    expect(servable(bank, DEV).map((x) => x.id)).toEqual(["a1", "a2"]);
  });
});

describe("new question every time", () => {
  const bank = bankOf(...["1", "2", "3", "4", "5"].map((n) => q(`p${n}`, "B", "approved")), q("other", "A", "approved"));
  it("never repeats within a student's seen list and then reports exhaustion", () => {
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      const pick = pickFresh(bank, "projectile", "B", seen, Math.random, PROD);
      expect(pick.question).not.toBeNull();
      expect(seen).not.toContain(pick.question!.id);
      seen.push(pick.question!.id);
    }
    expect(new Set(seen).size).toBe(5);
    const last = pickFresh(bank, "projectile", "B", seen, Math.random, PROD);
    expect(last.question).toBeNull();
    expect(last.exhausted).toBe(true);
  });
  it("respects node and level", () => {
    expect(pickFresh(bank, "projectile", "C", [], Math.random, PROD).question).toBeNull();
    expect(pickFresh(bank, "kin_1d", "B", [], Math.random, PROD).question).toBeNull();
  });
});

describe("relevance prefilter (saves model requests)", () => {
  it("keeps chunks that look like on-map MCQs and drops others", async () => {
    const { looksOnMap } = await import("@/lib/qbank/extract");
    expect(looksOnMap("A projectile has velocity 5 m/s. (A) 1 (B) 2")).toBe(true);
    expect(looksOnMap("Consider the ellipse. (A) 1 (B) 2")).toBe(false);
    expect(looksOnMap("The velocity of a particle is given.")).toBe(false); // no options
  });
});

describe("tolerant parsing of model output", () => {
  it("accepts an over-long anchor, and the schema stays expressible as JSON Schema for the tool", async () => {
    const { RawQuestionSchema, ExtractionSchema, trimAnchor } = await import("@/lib/qbank/types");
    const { z } = await import("zod");
    const { raw } = await import("./qbank-fixtures");
    const long = "A projectile is thrown at 30 degrees above the horizontal ".repeat(6);
    expect(RawQuestionSchema.safeParse({ ...raw(), anchor: long }).success).toBe(true);
    expect(trimAnchor(long).length).toBe(100);
    expect(() => z.toJSONSchema(ExtractionSchema)).not.toThrow();
  });
  it("matches anchors written with unicode math letters", async () => {
    const { anchorInSource } = await import("@/lib/qbank/extract");
    expect(anchorInSource("A particle of mass 𝑚 is moving in the 𝑥𝑦-plane", "A particle of mass m is moving in the xy-plane such that")).toBe(true);
  });
});
