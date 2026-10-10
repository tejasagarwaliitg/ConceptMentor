import type { Level } from "./types";

/**
 * Deterministic level from reported features. The agent's own label is NOT trusted;
 * it is kept only to detect disagreement (see levelDisagrees).
 */
export function deriveLevel(conceptCount: number, steps: number): Level {
  if (conceptCount >= 2 && steps >= 4) return "C";
  if (conceptCount <= 1 && steps <= 2) return "A";
  return "B";
}

const RANK: Record<Level, number> = { A: 0, B: 1, C: 2 };

/** True when the agent's label is two levels away from the derived one (A vs C). */
export function levelDisagrees(derived: Level, agent: Level): boolean {
  return Math.abs(RANK[derived] - RANK[agent]) >= 2;
}
