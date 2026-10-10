/**
 * Study rhythm (accountability). Pure functions; the only evidence used is
 * real activity timestamps already in the engine state. No nagging without
 * evidence: with fewer than MIN_SAMPLES across MIN_DAYS, there is no
 * "usual time" and no inactivity nudge is ever sent.
 */

export const RHYTHM_CAP = 120; // timestamps kept (enough for a stable median, small on disk)
export const RHYTHM_RETENTION_DAYS = 60;
export const MIN_SAMPLES = 5;
export const MIN_DAYS = 2;
export const NUDGE_GRACE_MIN = 90; // nudge only after usualHour + grace

const MIN = 60 * 1000;

/** Student-local clock: utc ms shifted by their timezone offset. */
export function localMs(utcMs: number, tzOffsetMin: number): number {
  return utcMs + tzOffsetMin * MIN;
}

export function localHour(utcMs: number, tzOffsetMin: number): number {
  return new Date(localMs(utcMs, tzOffsetMin)).getUTCHours();
}

export function localDayKey(utcMs: number, tzOffsetMin: number): string {
  const d = new Date(localMs(utcMs, tzOffsetMin));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Append an activity timestamp; caps count and drops entries older than retention. */
export function recordActivity(log: number[], at: number): number[] {
  const cutoff = at - RHYTHM_RETENTION_DAYS * 24 * 60 * MIN;
  return [...log.filter((t) => Number.isFinite(t) && t >= cutoff), at].slice(-RHYTHM_CAP);
}

/**
 * The student's usual active hour (0-23, their local time), or null when
 * there is not enough evidence. Median of local hours; robust to outliers.
 */
export function usualActiveHour(log: number[], tzOffsetMin: number): number | null {
  const recent = log.slice(-RHYTHM_CAP);
  if (recent.length < MIN_SAMPLES) return null;
  const days = new Set(recent.map((t) => localDayKey(t, tzOffsetMin)));
  if (days.size < MIN_DAYS) return null;
  const hours = recent.map((t) => localHour(t, tzOffsetMin)).sort((a, b) => a - b);
  return hours[Math.floor(hours.length / 2)];
}

export interface NudgeGate {
  nowUtc: number;
  tzOffsetMin: number;
  usualHour: number;
  /** ms of last real activity, or null if never */
  lastActiveAt: number | null;
  /** ms of last inactivity nudge sent, or undefined */
  lastNudgeAt?: number;
}

/**
 * True only when: past usualHour + grace in the student's local time, no
 * activity at all today (local), and no inactivity nudge already sent today.
 * One nudge per day max; a due-check nudge counts too (caller passes the
 * later of the two as lastNudgeAt).
 */
export function shouldNudgeInactivity(g: NudgeGate): boolean {
  const today = localDayKey(g.nowUtc, g.tzOffsetMin);
  if (g.lastNudgeAt !== undefined && localDayKey(g.lastNudgeAt, g.tzOffsetMin) === today) return false;
  if (g.lastActiveAt !== null && localDayKey(g.lastActiveAt, g.tzOffsetMin) === today) return false;
  const hourNow = localHour(g.nowUtc, g.tzOffsetMin) + (new Date(localMs(g.nowUtc, g.tzOffsetMin)).getUTCMinutes() / 60);
  return hourNow >= g.usualHour + NUDGE_GRACE_MIN / 60;
}
