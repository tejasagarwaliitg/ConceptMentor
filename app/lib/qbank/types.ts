import { z } from "zod";
import { LIVE_NODES } from "@/content/graph";
import type { ItemType, NodeId } from "@/lib/types";

/**
 * Question-bank types. NOTE: `Level` (A/B/C = difficulty) is unrelated to the
 * diagnostic item roles A/B1/B2/R in lib/types.ts.
 */
export type Level = "A" | "B" | "C";
export const LEVELS: Level[] = ["A", "B", "C"];

/** Level rubric (the single definition used by code AND shown to the agent). */
export const LEVEL_RUBRIC = `Level A: ONE concept, at most 2 steps, direct use of a formula or definition.
Level B: one concept in a changed context, or two concepts, about 3 steps; a rule must be applied with care about when it is valid.
Level C: two or more concepts combined AND at least 4 steps, or a non-obvious setup (JEE Advanced style).`;

export const NodeIdSchema = z.enum(LIVE_NODES as [NodeId, ...NodeId[]]);

/** What the extraction agent submits for each question it finds in a chunk. */
export const RawQuestionSchema = z.object({
  /** Text copied EXACTLY from the start of the question. Models often over-run the requested length, so it is accepted long here and trimmed by `trimAnchor` in code. (No .transform: the tool JSON schema cannot express it.) */
  anchor: z.string().min(20).max(600),
  node: NodeIdSchema,
  /** Clean transcription of the question; maths in LaTeX with $...$. */
  stem: z.string().min(15).max(1500),
  /**
   * kind:
   *  - single: exactly 4 options, one correct (answerIndex)
   *  - multi: 4-6 options, two or more correct (answerIndices) — common in JEE Advanced
   *  - numeric: no options; a value to enter (answerValue, with tolerance)
   */
  kind: z.enum(["single", "multi", "numeric"]).default("single"),
  /** exactly 4 for kind=single; 4-6 for kind=multi; empty for numeric */
  options: z.array(z.string().min(1).max(300)).max(6).default([]),
  /** index of the correct option as the agent worked it out (kind=single) */
  answerIndex: z.number().int().min(0).max(5).optional(),
  /** the correct options (kind=multi) */
  answerIndices: z.array(z.number().int().min(0).max(5)).max(6).optional(),
  /** the correct numerical answer and accepted range (kind=numeric) */
  answerValue: z.number().optional(),
  tolerance: z.number().min(0).optional(),
  unit: z.string().max(30).optional(),
  /** short names of the distinct concepts needed */
  conceptsUsed: z.array(z.string().min(2).max(60)).min(1).max(6),
  /** number of distinct reasoning/calculation steps */
  steps: z.number().int().min(1).max(12),
  agentLevel: z.enum(["A", "B", "C"]),
  derivation: z.string().min(10).max(1500),
});
export type RawQuestion = z.infer<typeof RawQuestionSchema>;

export const ExtractionSchema = z.object({
  questions: z.array(RawQuestionSchema).max(8),
  /** why other questions in the chunk were skipped (numeric answer, diagram needed, off-map ...) */
  skipped: z.string().max(400).optional(),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

export const SolutionSchema = z.object({
  kind: z.enum(["single", "multi", "numeric"]),
  answerIndex: z.number().int().min(0).max(5).optional(),
  answerIndices: z.array(z.number().int().min(0).max(5)).max(6).optional(),
  answerValue: z.number().optional(),
  derivation: z.string().min(5).max(1500),
});
export type Solution = z.infer<typeof SolutionSchema>;

/** needs_review -> verified (two blind solves agree) -> approved (a human signed off). */
export type Status = "needs_review" | "verified" | "approved";

/** main = JEE Main level (feeds Level A); advanced = JEE Advanced / Irodov-class (feeds B and C). */
export type Tier = "main" | "advanced";

export interface BankSource {
  exam: string;
  tier: Tier;
  year: number;
  paper: string;
  url: string;
  anchor: string;
}

export interface BankQuestion {
  /** Explicit reviewed diagnostic role; difficulty A/B/C is not a diagnostic role. */
  diagnosticRole?: ItemType;
  origin?: "authored" | "paper";
  tags?: (string | null)[];
  variant?: { surface: string; reference: string; target: string; representation: string; trap: string };
  check?: { formula: string; vars: Record<string, number>; key?: number; components?: string[] };
  id: string;
  kind: "single" | "multi" | "numeric";
  node: NodeId;
  level: Level;
  /** level the agent proposed; kept so disagreements are auditable */
  agentLevel: Level;
  stem: string;
  options: string[];
  /** single: index in options; multi: indices; numeric: null */
  answer: number | null;
  /** multi: the correct indices; numeric: the value to enter */
  answerIndices?: number[];
  answerValue?: number;
  tolerance?: number;
  unit?: string;
  conceptsUsed: string[];
  steps: number;
  derivation: string;
  source: BankSource;
  status: Status;
  approvedBy?: string;
  verification: { solves: number[]; agree: boolean };
  /** honest provenance flags shown to reviewers */
  flags: string[];
  addedAt: number;
}

export interface Bank {
  version: 1;
  questions: BankQuestion[];
  /** `${paperUrl}#${chunkIndex}` already processed, so each run brings new material */
  processed: string[];
}

export interface PaperRef {
  exam: string;
  tier: Tier;
  /** local file path instead of a URL (e.g. your own copy of a book); url then holds a file:// label */
  localPath?: string;
  year: number;
  paper: string;
  url: string;
}

/** Keep the first 100 characters: long enough to be unique, short enough to survive PDF line breaks. */
export const trimAnchor = (s: string): string => s.slice(0, 100);

/** Which field carries the answer for each kind. */
export function correctFor(k: "single" | "multi" | "numeric"): string {
  return k === "single" ? "answerIndex" : k === "multi" ? "answerIndices" : "answerValue";
}
