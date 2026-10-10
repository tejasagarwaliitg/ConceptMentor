import { createHash } from "node:crypto";
import { anchorInSource, normalise } from "./extract";
import { deriveLevel, levelDisagrees } from "./level";
import type { AgentRun } from "./agent";
import { trimAnchor, type Bank, type BankQuestion, type Extraction, type Level, type PaperRef, type RawQuestion, type Solution, type Tier } from "./types";

export interface Agents {
  extract: (chunk: string, label: string) => Promise<AgentRun<Extraction>>;
  /** `variant` 0 and 1 are the two independent blind solves; real agents route them to different models. */
  solve: (stem: string, options: string[], variant?: number) => Promise<AgentRun<Solution>>;
}

export interface ChunkReport {
  chunkKey: string;
  found: number;
  added: number;
  rejected: { reason: string; anchor: string }[];
}

function questionId(paper: PaperRef, anchor: string): string {
  return `${paper.year}-${paper.paper.replace(/\W/g, "")}-${createHash("sha1").update(normalise(anchor)).digest("hex").slice(0, 8)}`;
}

/** Cheap structural checks that need no model. Returns a rejection reason or null. */
export function structuralProblem(q: RawQuestion, chunk: string): string | null {
  if (!anchorInSource(q.anchor, chunk)) return "anchor not found in source text (possible invention)";
  const kind = q.kind ?? "single";
  if (kind === "numeric") {
    if (q.options.length) return "numeric question must not have options";
    if (q.answerValue === undefined) return "numeric question has no answerValue";
    return null;
  }
  const min = kind === "multi" ? 4 : 4;
  if (q.options.length < min) return `needs ${min}+ options`;
  const opts = q.options.map(normalise);
  if (new Set(opts).size !== opts.length) return "duplicate options";
  if (opts.some((o) => !o)) return "empty option";
  if (kind === "multi" ? !q.answerIndices?.length : q.answerIndex === undefined) return "no correct option marked";
  return null;
}

/** The index set the extractor claims is correct, for each kind. */
export function correctIndices(q: RawQuestion): number[] | null {
  const kind = q.kind ?? "single";
  if (kind === "numeric") return null;
  return kind === "multi" ? [...(q.answerIndices ?? [])].sort() : q.answerIndex !== undefined ? [q.answerIndex] : null;
}

/** Do the extractor's answers match what a blind solve produced? */
function agrees(kind: "single" | "multi" | "numeric", theirs: Solution, mine: RawQuestion): boolean {
  if (kind === "numeric") {
    const v = mine.answerValue, w = theirs.answerValue;
    return v !== undefined && w !== undefined && Math.abs(v - w) <= Math.max(1e-9, mine.tolerance ?? Math.abs(v) * 0.02 + 1e-6);
  }
  const mineSet = correctIndices(mine) ?? [];
  const theirsSet = kind === "multi" ? [...(theirs.answerIndices ?? [])].sort() : theirs.answerIndex !== undefined ? [theirs.answerIndex] : [];
  return theirsSet.length === mineSet.length && theirsSet.every((x, i) => x === mineSet[i]);
}

/**
 * Turns one agent extraction into bank entries. Trust ladder:
 *  1. anchor must literally exist in the official text
 *  2. level is derived by code from concepts + steps (agent label only audited)
 *  3. TWO independent blind solves must both match the extractor's answer -> `verified`
 *     anything else is stored as `needs_review` with a reason, never served
 * Nothing here can mark a question `approved`; only a human edit can.
 */
export async function processChunk(
  bank: Bank,
  paper: PaperRef,
  chunkIndex: number,
  chunk: string,
  agents: Agents,
  now = Date.now(),
  ocr = false
): Promise<ChunkReport> {
  const chunkKey = `${paper.url}#${chunkIndex}`;
  const report: ChunkReport = { chunkKey, found: 0, added: 0, rejected: [] };
  const ex = await agents.extract(chunk, `${paper.exam} ${paper.year} ${paper.paper}`);
  if (!ex.value) {
    // Not marked processed: a transient agent failure must be retried next run.
    report.rejected.push({ reason: `extraction failed: ${ex.error ?? "unknown"}`, anchor: "" });
    return report;
  }
  report.found = ex.value.questions.length;
  const known = new Set(bank.questions.map((q) => normalise(q.stem)));

  for (const original of ex.value.questions) {
    const raw: RawQuestion = { ...original, anchor: trimAnchor(original.anchor) };
    const bad = structuralProblem(raw, chunk);
    if (bad) {
      report.rejected.push({ reason: bad, anchor: raw.anchor });
      continue;
    }
    if (known.has(normalise(raw.stem))) {
      report.rejected.push({ reason: "duplicate of an existing question", anchor: raw.anchor });
      continue;
    }
    const entry = await buildEntry(raw, paper, agents, now, ocr);
    if (bank.questions.some((q) => q.id === entry.id)) continue;
    bank.questions.push(entry);
    known.add(normalise(raw.stem));
    report.added += 1;
  }
  bank.processed.push(chunkKey);
  return report;
}

/**
 * Source policy: Level A comes only from main-tier (JEE Main) sources; B and C only from
 * advanced-tier ones. An easy advanced question is promoted to B; a hard main question is
 * capped at A so the level of a question always matches where it came from.
 */
export function applyTierPolicy(level: Level, tier: Tier): Level {
  if (tier === "main") return "A";
  return level === "A" ? "B" : level;
}

async function buildEntry(raw: RawQuestion, paper: PaperRef, agents: Agents, now: number, ocr = false): Promise<BankQuestion> {
  const [s1, s2] = await Promise.all([agents.solve(raw.stem, raw.options, 0), agents.solve(raw.stem, raw.options, 1)]);
  const kind = raw.kind ?? "single";
  const solved = [s1.value, s2.value].filter((x): x is Solution => x != null);
  const solves = solved.map((s) => (kind === "multi" ? -1 : kind === "numeric" ? -2 : s.answerIndex ?? -1));
  const agree = solves.length === 2 && solved.every((s) => agrees(kind, s, raw));
  const derived = deriveLevel(new Set(raw.conceptsUsed.map((c) => c.toLowerCase())).size, raw.steps);
  const level = applyTierPolicy(derived, paper.tier);
  const flags: string[] = [];
  if (level !== derived) flags.push(`tier policy: rubric says ${derived}, ${paper.tier} source -> ${level}`);
  if (!agree) flags.push(solves.length < 2 ? "blind solve unavailable" : "blind solves disagree with extractor answer");
  if (levelDisagrees(derived, raw.agentLevel)) flags.push(`level audit: agent said ${raw.agentLevel}, rubric says ${derived}`);
  flags.push("answer self-derived by AI; official key not cross-checked");
  if (ocr) flags.push("transcribed from a scanned page by vision model; anchor matched the transcription, not a verified text layer");
  return {
    id: questionId(paper, raw.anchor),
    kind,
    node: raw.node,
    level,
    agentLevel: raw.agentLevel,
    stem: raw.stem,
    options: raw.options,
    answer: kind === "single" ? (raw.answerIndex ?? null) : null,
    answerIndices: kind === "multi" ? correctIndices(raw) ?? [] : undefined,
    answerValue: kind === "numeric" ? raw.answerValue : undefined,
    tolerance: kind === "numeric" ? raw.tolerance : undefined,
    unit: raw.unit,
    conceptsUsed: raw.conceptsUsed,
    steps: raw.steps,
    derivation: raw.derivation,
    source: { exam: paper.exam, tier: paper.tier, year: paper.year, paper: paper.paper, url: paper.url, anchor: raw.anchor },
    status: agree ? "verified" : "needs_review",
    verification: { solves, agree },
    flags,
    addedAt: now,
  };
}
