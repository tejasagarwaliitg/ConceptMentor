import { DAY_MS, type Confidence, type NodeRecord, type Proficiency, type RecheckStep } from "./types";

/**
 * Revision buckets. A checked topic sits in one bucket; the bucket decides how long
 * until its next re-check. Settled topics drift to far buckets and stop coming back
 * every day or week; slipping topics move to a nearer bucket.
 *
 * Bucket 1 is the day-after check that follows a repair.
 */
export type Bucket = Exclude<RecheckStep, 0>;

export const REVISION_BUCKET_DAYS: Record<Bucket, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30, 6: 60, 7: 120 };
export const TOP_BUCKET: Bucket = 7;

/** Saved states from before the ladder used steps 1/2/3 = 1d/7d/30d (and stored no proficiency). */
const LEGACY_BUCKET: Partial<Record<RecheckStep, Bucket>> = { 2: 3, 3: 5 };

/** Strength of a CORRECT answer: sure 3, somewhat sure 2, guessing 1. Wrong answers are not scored here. */
export function proficiencyOf(confidence: Confidence): Proficiency {
  return confidence === "pakka" ? 3 : confidence === "shayad" ? 2 : 1;
}

/** The bucket a record is in, translating records saved before proficiency was tracked. */
export function bucketOf(rec: Pick<NodeRecord, "recheckStep" | "proficiency">): RecheckStep {
  if (rec.proficiency === undefined) return LEGACY_BUCKET[rec.recheckStep] ?? rec.recheckStep;
  return rec.recheckStep;
}

export function scheduleAfter(at: number, bucket: Bucket): number {
  return at + REVISION_BUCKET_DAYS[bucket] * DAY_MS;
}

/**
 * Where a node goes after a DUE re-check answered correctly.
 * - same or better proficiency than last time -> further out: two buckets when the answer was
 *   "sure", one when "somewhat sure" (capped at the top bucket)
 * - lower proficiency than last time          -> one bucket nearer (never below 1)
 * - correct only by guessing                   -> stays put: luck is not evidence of proficiency
 * A wrong answer is handled by the caller: the topic leaves the ladder and is repaired again.
 */
export function revisionStep(
  rec: Pick<NodeRecord, "recheckStep" | "proficiency">,
  confidence: Confidence
): { bucket: Bucket; proficiency: Proficiency } {
  const current = Math.max(1, bucketOf(rec)) as Bucket;
  const before = rec.proficiency ?? 2; // legacy records: assume "somewhat sure"
  const proficiency = proficiencyOf(confidence);
  if (proficiency < before) return { bucket: Math.max(1, current - 1) as Bucket, proficiency };
  if (proficiency === 1) return { bucket: current, proficiency };
  const jump = proficiency === 3 ? 2 : 1;
  return { bucket: Math.min(TOP_BUCKET, current + jump) as Bucket, proficiency };
}
