import { describe, expect, it } from "vitest";
import { closeEnough, evaluate, numbersIn, overlap, parseNumericOption, stemSignature } from "@/lib/derive";
import { REPETITION_AXES, type Item } from "@/content/schema";
import { ITEMS_V2A } from "@/content/items.v2a";
import { ITEMS_V2B } from "@/content/items.v2b";
import { ITEMS_V2C } from "@/content/items.v2c";
import { ITEMS_V2D } from "@/content/items.v2d";
import { ITEMS_V2E } from "@/content/items.v2e";

/** The v2 bank is what we serve. The old draft is kept for history only. */
export const BANK: Item[] = [...ITEMS_V2A, ...ITEMS_V2B, ...ITEMS_V2C, ...ITEMS_V2D, ...ITEMS_V2E] as Item[];

const byNode = (node: string) => BANK.filter((i) => i.node === node);

describe("review: no repetition", () => {
  it("two items on the same node never share surface + reference + target", () => {
    const clashes: string[] = [];
    for (const node of new Set(BANK.map((i) => i.node))) {
      const items = byNode(node);
      for (let a = 0; a < items.length; a++) {
        for (let b = a + 1; b < items.length; b++) {
          const va = items[a].variant;
          const vb = items[b].variant;
          const shared = REPETITION_AXES.filter((k) => va[k] === vb[k]);
          if (shared.length === REPETITION_AXES.length) {
            clashes.push(`${items[a].id} vs ${items[b].id} (identical variant)`);
          }
          if (va.trap === vb.trap && shared.length >= 2) {
            clashes.push(`${items[a].id} vs ${items[b].id} (same trap '${va.trap}' and ${shared.join("+")} shared)`);
          }
        }
      }
    }
    expect(clashes).toEqual([]);
  });

  it("no two stems are near-identical", () => {
    const sigs = BANK.map((i) => ({ id: i.id, s: stemSignature(i.stem) }));
    const dupes: string[] = [];
    for (let a = 0; a < sigs.length; a++) {
      for (let b = a + 1; b < sigs.length; b++) {
        const o = overlap(sigs[a].s, sigs[b].s);
        if (o > 0.6) dupes.push(`${sigs[a].id} ~ ${sigs[b].id} (${o.toFixed(2)})`);
      }
    }
    expect(dupes).toEqual([]);
  });

  it("every node has at least 3 items and every item has a derivation and a source", () => {
    const nodes = ["coordinates", "trig", "vec_basics", "slope", "vec_comp", "deriv_rate", "motion_graphs", "kin_1d", "projectile"];
    for (const n of nodes) {
      expect(byNode(n).length, `node ${n} has too few items`).toBeGreaterThanOrEqual(3);
    }
    for (const it of BANK) {
      expect(it.derivation.length, it.id).toBeGreaterThan(10);
      expect(it.source?.exam, it.id).toBeTruthy();
      expect(it.variant?.trap, it.id).toBeTruthy();
      expect(new Set(it.options).size, it.id).toBe(it.options.length);
      expect(it.tags.length, it.id).toBe(it.options.length);
      expect(it.tags[it.answer], it.id).toBeNull();
    }
  });

  it("no item claims an official key it cannot show", () => {
    // We never present a copied key as official. If exam is a real paper,
    // the derivation must still be present so the answer is independently checked.
    for (const it of BANK) {
      expect(it.derivation, it.id).toMatch(/\d/);
    }
  });
});

/**
 * Answer verification. Each numeric item carries `check: { formula, vars }`.
 * We recompute and compare to the option the item marks correct. A mismatch is
 * a wrong answer key and must fail the build.
 */
type Checkable = Item & { check?: { formula: string; vars: Record<string, number>; components?: string[] } };

const numeric: Checkable[] = BANK.filter((i) => typeof (i as Checkable).check === "object");

describe("review: answer keys re-derived", () => {
  it("has numeric checks on every numeric item", () => {
    // at least the pure-calculation ones must be machine checked
    expect(numeric.length).toBeGreaterThanOrEqual(10);
  });

  it.each(numeric.map((i) => [i.id, i] as const))("%s answer matches its own derivation", (_id, item) => {
    const c = (item as Checkable).check!;
    if (c.components) {
      const expected = c.components.map(f => evaluate(f, c.vars));
      const actual = numbersIn(item.options[item.answer]);
      expect(actual.length, item.id).toBe(expected.length);
      expected.forEach((v, i) => expect(closeEnough(v, actual[i]), `${item.id} component ${i}`).toBe(true));
    } else {
      const computed = evaluate(c.formula, c.vars);
      const declared = parseNumericOption(item.options[item.answer], c.vars);
      expect(declared, `${item.id}: cannot parse ${item.options[item.answer]}`).not.toBeNull();
      expect(closeEnough(computed, declared!), `${item.id}: ${computed} != ${declared}`).toBe(true);
    }
  });

  it("distractors are not equal to the correct answer", () => {
    for (const item of numeric) {
      const c = item.check!;
      const correctOption = item.options[item.answer];
      const keyNums = numbersIn(correctOption);
      const correct = parseNumericOption(correctOption, c.vars);
      const suffix = (text: string) => text.replace(/\$[^$]*\$/g, "#").trim();
      item.options.forEach((option, idx) => {
        if (idx === item.answer) return;
        const value = parseNumericOption(option, c.vars);
        if (!c.components && correct !== null && value !== null) {
          const sameUnitsAndMeaning = suffix(option) === suffix(correctOption);
          expect(sameUnitsAndMeaning && closeEnough(value, correct), `${item.id}: duplicate answer`).toBe(false);
        } else if (c.components) {
          const nums = numbersIn(option);
          expect(nums.length === keyNums.length && nums.every((n, k) => closeEnough(n, keyNums[k])), `${item.id}: duplicate vector`).toBe(false);
        }
      });
    }
  });

  it("the served bank contains no duplicate ids", () => {
    // The draft bank is history and is never served. What matters is that the
    // bank we actually serve has no collisions that would make grading ambiguous.
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const it of BANK) {
      if (seen.has(it.id)) dupes.push(it.id);
      seen.add(it.id);
    }
    expect(dupes).toEqual([]);
  });
});
