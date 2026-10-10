export type NodeId =
  | "coordinates"
  | "trig"
  | "vec_basics"
  | "slope"
  | "vec_comp"
  | "deriv_rate"
  | "motion_graphs"
  | "kin_1d"
  | "projectile";

export type ItemType = "A" | "B1" | "B2" | "R";

/** Public part of an item (what the browser may see). No answer, no tags. */
export interface PublicItem {
  id: string;
  node: NodeId;
  type: ItemType;
  stem: string;
  options: string[];
}

export type Confidence = "pakka" | "shayad" | "guess";

/** What the student chose. -1 means they did not know; -2 means the wording was unclear (void). */
export const DONT_KNOW = -1;
export const WORDING_VOID = -2;

export type NodeState =
  | "untested"
  | "gap"
  | "context_difficulty"
  | "no_difficulty_found"
  | "checked_immediate"
  | "retained";

export type SessionOutcome =
  | "suspected_gap"
  | "no_prereq_weakness"
  | "inconclusive"
  | "out_of_scope"
  | "below_coverage"
  | "student_disputed";

export interface GradedAnswer {
  instanceId: string;
  itemId: string;
  node: NodeId;
  type: ItemType;
  /** true = correct, false = wrong or unsure, null = void because the wording was unclear */
  correct: boolean | null;
  dontKnow: boolean;
  confidence: Confidence;
  /** Candidate misconception tag; a hint, never proof. Omitted for an unsure response. */
  tag?: string;
  at: number;
}

/** Revision bucket: 0 = not scheduled, 1..7 = the ladder in lib/revision.ts (1d, 3d, 7d, 14d, 30d, 60d, 120d). */
export type RecheckStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** How securely the last correct check was answered: 3 sure, 2 somewhat sure, 1 guessing. */
export type Proficiency = 1 | 2 | 3;

export interface NodeRecord {
  state: NodeState;
  lastChange: number;
  nextRecheck?: number;
  recheckStep: RecheckStep;
  /** proficiency shown on the last correct check; absent on records saved before buckets existed */
  proficiency?: Proficiency;
  history: { at: number; event: string }[];
  selfReported?: boolean;
}

export interface Session {
  id: string;
  entry: NodeId;
  startedAt: number;
  answers: GradedAnswer[];
  probeCount: number;
  /** nodes in the order they are to be probed (entry first) */
  queue: NodeId[];
  probed: Partial<Record<NodeId, ProbeResult>>;
  outcome?: SessionOutcome;
  suspected?: NodeId;
  repairAttempts: Partial<Record<NodeId, number>>;
  notChecked: NodeId[];
  disputed: boolean;
}

export type ProbeResult =
  | "no_difficulty_found"
  | "context_difficulty"
  | "gap"
  | "untested";

export interface StudentSettings {
  lowData: boolean;
  preferredChannels?: string[];
  videoFeedback?: Record<string, 1 | 2 | 3>;
}

export interface StudentState {
  /** All presented diagnostic questions; never evicted to recycle old questions. */
  seenQuestionIds?: string[];
  version: 1;
  settings: StudentSettings;
  nodes: Partial<Record<NodeId, NodeRecord>>;
  seenInstances: string[];
  /** Recently answered item ids by node and item type, used to rotate available variants. */
  recentItems: Partial<Record<string, string[]>>;
  session?: Session;
  /** checks done per ISO week "YYYY-Www" -> {done, passed} */
  weekly: Record<string, { done: number; passed: number }>;
  /** activity timestamps (ms) for the study rhythm; optional so old states stay valid */
  activity?: number[];
  /** simulated clock offset in days (demo only) */
  simulatedDays: number;
  flaggedItems: string[];
  /**
   * "Check your level" card queue: nodes awaiting a check, in order. The landing
   * page shows the first 4. When a node is cleared (fixed/solved) it leaves the
   * queue and every topic it advances to (its dependents) joins the back.
   * Absent on old saved states; rebuilt from ENTRY_NODES on demand.
   */
  levelQueue?: NodeId[];
}

export const MAX_PROBES = 6;
export const MAX_REPAIR_ATTEMPTS = 2;
export const DAY_MS = 24 * 60 * 60 * 1000;
