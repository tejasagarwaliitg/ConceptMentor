import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
vi.mock("server-only", () => ({}));
import { findItem, gradeItem, issueItem } from "@/lib/items";
import { initialState, reduce } from "@/lib/engine";
import { q } from "./qbank-fixtures";
import type { BankQuestion } from "@/lib/qbank/types";

const oldPath = process.env.QBANK_PATH;
let dir: string;
let file: string;
const entry = (id: string): BankQuestion => ({ ...q(id, "B", "approved"), diagnosticRole: "B1", approvedBy: "test fixture reviewer", tags: [null, "wrong", "wrong", "wrong"] });
const save = (...questions: BankQuestion[]) => writeFileSync(file, JSON.stringify({ version: 1, questions, processed: [] }));
beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), "athena-bank-")); file = path.join(dir, "bank.json"); process.env.QBANK_PATH = file; });
afterEach(() => { if (oldPath === undefined) delete process.env.QBANK_PATH; else process.env.QBANK_PATH = oldPath; rmSync(dir, { recursive: true, force: true }); });

describe("diagnosis reads the question bank", () => {
  it("does not recycle exhausted items, and sees newly added entries without a restart", () => {
    save(entry("bank-first"));
    expect(findItem("projectile", "B1")?.id).toBe("bank-first");
    expect(findItem("projectile", "B1", ["bank-first"])).toBeNull();
    save(entry("bank-first"), entry("bank-new"));
    expect(findItem("projectile", "B1", ["bank-first"])?.id).toBe("bank-new");
  });
  it("does not infer a diagnostic role from practice difficulty", () => {
    save(q("ordinary-practice", "B", "approved"));
    expect(findItem("projectile", "B1")).toBeNull();
  });
  it("grades the question that was issued, with its shuffled choices", () => {
    const item = entry("bank-grade"); save(item);
    const issued = issueItem("projectile", "B1")!;
    const index = issued.item.options.indexOf(item.options[item.answer!]);
    expect(gradeItem({ instanceToken: issued.instanceToken, chosen: index, confidence: "pakka" }).answer?.correct).toBe(true);
    expect(Object.keys(issued.item)).not.toContain("answer");
  });
  it("records a shown question without changing concept evidence", () => {
    const initial = initialState();
    const next = reduce(initial, { type: "itemPresented", itemId: "shown-before-answer" });
    expect(next.nodes).toEqual(initial.nodes);
    expect(next.seenQuestionIds).toEqual(["shown-before-answer"]);
    expect(reduce(next, { type: "itemPresented", itemId: "shown-before-answer" }).seenQuestionIds).toHaveLength(1);
  });
});
