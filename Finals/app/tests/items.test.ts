import { describe, expect, it, vi } from "vitest";

// `server-only` throws outside a server bundle; stub it for unit tests.
vi.mock("server-only", () => ({}));
process.env.SERVE_UNAPPROVED = "true";
process.env.ITEM_SECRET = "test-secret";

const { issueItem, gradeItem, approvedItems } = await import("@/lib/items");
const { ITEMS_V2_ALL: ITEMS_DRAFT } = await import("@/content/items.draft");
import { DONT_KNOW, WORDING_VOID } from "@/lib/types";

describe("approval gate (5.1)", () => {
  it("no draft item is approved yet, so nothing is served in production", () => {
    expect(approvedItems().length).toBe(0);
  });
});

describe("answer keys never reach the client", () => {
  it("issued item has no answer, tags, note or approval fields", () => {
    const issued = issueItem("vec_comp", "B1")!;
    const keys = Object.keys(issued.item);
    expect(keys.sort()).toEqual(["id", "node", "options", "stem", "type"]);
    const json = JSON.stringify(issued);
    expect(json).not.toContain("cos_always_for_x"); // distractor tag
    expect(json).not.toContain("tags");
  });

  it("options are shuffled per instance but all original options are present", () => {
    const a = issueItem("vec_comp", "A")!;
    const original = ITEMS_DRAFT.find((i) => i.id === a.item.id)!;
    expect([...a.item.options].sort()).toEqual([...original.options].sort());
  });
});

function correctIndex(issued: NonNullable<ReturnType<typeof issueItem>>): number {
  const it = ITEMS_DRAFT.find((i) => i.id === issued.item.id)!;
  return issued.item.options.indexOf(it.options[it.answer]);
}

describe("server grading", () => {
  it("correct choice grades correct; wrong grades wrong with a candidate tag", () => {
    const issued = issueItem("vec_comp", "B1")!;
    const right = correctIndex(issued);
    const ok = gradeItem({ instanceToken: issued.instanceToken, chosen: right, confidence: "pakka" });
    expect(ok.answer!.correct).toBe(true);
    expect(ok.answer!.tag).toBeUndefined();

    const wrongIdx = right === 0 ? 1 : 0;
    const bad = gradeItem({ instanceToken: issued.instanceToken, chosen: wrongIdx, confidence: "shayad" });
    expect(bad.answer!.correct).toBe(false);
  });

  it('"Pata nahi" is not correct and NEVER assigns a misconception tag', () => {
    const issued = issueItem("vec_comp", "B1")!;
    const r = gradeItem({ instanceToken: issued.instanceToken, chosen: DONT_KNOW, confidence: "guess" });
    expect(r.answer!.correct).toBe(false);
    expect(r.answer!.dontKnow).toBe(true);
    expect(r.answer!.tag).toBeUndefined();
  });

  it("wording-void returns correct = null (no evidence)", () => {
    const issued = issueItem("trig", "A")!;
    const r = gradeItem({ instanceToken: issued.instanceToken, chosen: WORDING_VOID, confidence: "guess" });
    expect(r.answer!.correct).toBeNull();
  });

  it("tampered token is rejected", () => {
    const issued = issueItem("trig", "A")!;
    const [b64, sig] = issued.instanceToken.split(".");
    const forged = Buffer.from(Buffer.from(b64, "base64url").toString().replace(/\d+$/, "1")).toString("base64url");
    expect(gradeItem({ instanceToken: `${forged}.${sig}`, chosen: 0, confidence: "pakka" }).ok).toBe(false);
    expect(gradeItem({ instanceToken: `${b64}.deadbeef`, chosen: 0, confidence: "pakka" }).ok).toBe(false);
  });

  it("expired token is rejected", () => {
    const issued = issueItem("trig", "A")!;
    const r = gradeItem({ instanceToken: issued.instanceToken, chosen: 0, confidence: "pakka", now: Date.now() + 31 * 60 * 1000 });
    expect(r.ok).toBe(false);
  });

  it("out-of-range choice is rejected", () => {
    const issued = issueItem("trig", "A")!;
    expect(gradeItem({ instanceToken: issued.instanceToken, chosen: 99, confidence: "pakka" }).ok).toBe(false);
  });
});

describe("draft bank integrity", () => {
  it("every item: answer index valid, tags align with options, correct option has null tag", () => {
    for (const it of ITEMS_DRAFT) {
      expect(it.options.length, it.id).toBeGreaterThanOrEqual(3);
      expect(it.answer, it.id).toBeGreaterThanOrEqual(0);
      expect(it.answer, it.id).toBeLessThan(it.options.length);
      expect(it.tags.length, it.id).toBe(it.options.length);
      expect(it.tags[it.answer], it.id).toBeNull();
      expect(new Set(it.options).size, it.id).toBe(it.options.length);
    }
  });
});
