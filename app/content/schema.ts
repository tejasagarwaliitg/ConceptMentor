import type { ItemType, NodeId } from "@/lib/types";

/**
 * Item schema. Every item declares the axes it varies on, so "repetitive" becomes
 * a test failure rather than an opinion (review gate, tests/review.test.ts).
 */
export interface ItemSource {
  exam: "JEE Main" | "JEE Advanced" | "CBSE" | "derived";
  year: number;
  topic: string;
  note?: string;
}

export interface Variant {
  /** what the vector/quantity is */
  surface: "velocity" | "force" | "displacement" | "acceleration" | "abstract" | "position" | "graph" | "price" | "length";
  /** where the angle is measured from, or which axis is emphasised */
  reference: "horizontal" | "vertical" | "negative-x" | "negative-y" | "incline" | "rotated-axes" | "graph-scale" | "other-angle" | "none";
  /** what is being asked for */
  target: "x-component" | "y-component" | "magnitude" | "direction" | "resultant" | "rate" | "area" | "sign" | "compare" | "when";
  /** how the information is presented */
  representation: "text" | "diagram" | "graph" | "table" | "word-problem";
  /** the specific misconception the item is designed to expose */
  trap: string;
}

export interface Figure {
  kind: "axes" | "incline" | "vector" | "triangle" | "graph-vt" | "graph-xt";
  caption?: string;
  /** kind-specific payload; rendered by components/Figure.tsx */
  data: Record<string, unknown>;
}

export interface Item {
  id: string;
  node: NodeId;
  type: ItemType;
  stem: string;
  options: string[];
  answer: number;
  tags: (string | null)[];
  approved: boolean;
  approvedBy?: string;
  note?: string;
  source: ItemSource;
  /** the working, stored for review; never shown to the student */
  derivation: string;
  variant: Variant;
  figure?: Figure;
}

/** Repetition gate: two items on the same node may not share these three axes. */
export const REPETITION_AXES: (keyof Variant)[] = ["surface", "reference", "target"];
