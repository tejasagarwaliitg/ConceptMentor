/**
 * DRAFT QUESTION BANK. SERVER-ONLY. NOT YET APPROVED.
 *
 * Every item here was drafted by Cline and has NOT been verified by the builder.
 * An item is served to students ONLY if `approved: true`.
 * The builder must solve each item independently, then flip `approved` to true.
 *
 * Types: A = standard, B1 = changed-context probe, B2 = independent repair check,
 *        R = reasoning ("when does the rule apply?")
 * `answer` is the 0-based index of the correct option. `tags[i]` = candidate
 * misconception for wrong option i (a hint, never proof of reasoning).
 */
import type { ItemType, NodeId } from "@/lib/types";
import { ITEMS_DRAFT_2 } from "./items.draft2";
import { ITEMS_V2A } from "./items.v2a";
import { ITEMS_V2B } from "./items.v2b";
import { ITEMS_V2C } from "./items.v2c";
import { ITEMS_V2D } from "./items.v2d";
import { ITEMS_V2E } from "./items.v2e";

export interface Item {
  id: string;
  node: NodeId;
  type: ItemType;
  stem: string; // plain text; $...$ is rendered with KaTeX
  options: string[];
  answer: number;
  tags: (string | null)[]; // same length as options; null for the correct option
  approved: boolean;
  approvedBy?: string;
  note?: string; // reviewer note: why this item exists
  source?: { exam: "JEE Main" | "JEE Advanced" | "CBSE" | "derived"; year: number; topic: string; note?: string };
  /** the working, so the answer can be re-derived by tests instead of trusted */
  derivation?: string;
  /** what this item varies on, so repetition is a build failure */
  variant?: {
    surface: string;
    reference: string;
    target: string;
    representation: string;
    trap: string;
  };
  /**
   * Machine-checkable form of the derivation, used by tests/review.test.ts.
   * `key` is the numeric value the correct option stands for, so the answer is
   * verified against the maths and never against how the option text is written.
   */
  check?: { formula: string; vars: Record<string, number>; key?: number; components?: string[] };
}

const PART_1: Item[] = [
  {
    id: "vec_comp-A",
    node: "vec_comp",
    type: "A",
    stem: "A velocity of 10 m/s points at 30° ABOVE the +x axis (horizontal). What is its x-component?",
    options: ["5 m/s", "5√3 m/s (≈ 8.66 m/s)", "10 m/s", "10√3 m/s"],
    answer: 1,
    tags: ["swapped_sin_cos", null, "no_resolution", "wrong_factor"],
    approved: false,
    note: "vx = v cos(30°) = 10 x √3/2 = 5√3",
  },
  {
    id: "vec_comp-B1",
    node: "vec_comp",
    type: "B1",
    stem: "A velocity of 10 m/s makes an angle of 30° with the VERTICAL (+y axis). What is its x-component (horizontal)?",
    options: ["5√3 m/s (≈ 8.66 m/s)", "5 m/s", "10 m/s", "0 m/s"],
    answer: 1,
    tags: ["cos_always_for_x", null, "no_resolution", "no_resolution"],
    approved: false,
    note: "Angle from vertical: vx = v sin(30°) = 5. 'Always x = v cos(theta)' fails here.",
  },
  {
    id: "vec_comp-B2",
    node: "vec_comp",
    type: "B2",
    stem: "A force of 20 N acts at 60° from the +y axis. What is its component along the +y axis?",
    options: ["10 N", "10√3 N (≈ 17.3 N)", "20 N", "0 N"],
    answer: 0,
    tags: [null, "sin_cos_swapped", "no_resolution", "no_resolution"],
    approved: false,
    note: "Along the axis the angle is measured from: Fy = 20 cos(60°) = 10",
  },
  {
    id: "vec_comp-R",
    node: "vec_comp",
    type: "R",
    stem: "Which statement correctly says WHEN the component along an axis uses cos(θ)?",
    options: [
      "Always: the x-component uses cos and the y-component uses sin.",
      "When θ is measured from that axis, the component along it is v cos(θ).",
      "When the vector is in the first quadrant, the x-component uses cos.",
      "When the vector is longer than 1 unit.",
    ],
    answer: 1,
    tags: ["recipe_always_cos_x", null, "quadrant_recipe", "magnitude_confusion"],
    approved: false,
    note: "Checks understanding of when the rule applies, not another recipe.",
  },
  {
    id: "trig-A",
    node: "trig",
    type: "A",
    stem: "What is cos 60°?",
    options: ["√3/2", "1/2", "1", "√3"],
    answer: 1,
    tags: ["sin_cos_30_60_swapped", null, "wrong_value", "wrong_value"],
    approved: false,
  },
  {
    id: "trig-B1",
    node: "trig",
    type: "B1",
    stem: "In a right triangle, the angle θ is at the bottom-left. The side OPPOSITE to θ is 3 and the HYPOTENUSE is 5. What is sin θ?",
    options: ["4/5", "3/5", "3/4", "5/3"],
    answer: 1,
    tags: ["adjacent_for_sin", null, "tan_instead", "inverted"],
    approved: false,
  },
];

export const ITEMS_DRAFT: Item[] = [...PART_1, ...ITEMS_DRAFT_2];

/**
 * The bank we serve. The v2 items are the reviewed, non-repetitive set: each one
 * varies on (surface, reference, target), carries its derivation, and its answer
 * key is re-derived by tests/review.test.ts. The draft items above are kept only
 * as history and are never served.
 */
export const ITEMS_V2_ALL: Item[] = [
  ...ITEMS_V2A,
  ...ITEMS_V2B,
  ...ITEMS_V2C,
  ...ITEMS_V2D,
  ...ITEMS_V2E,
];
