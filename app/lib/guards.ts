/** In-memory guards (idea.md 11.5). Demo-grade: per server instance only; stated in the README. */

const buckets = new Map<string, { n: number; reset: number }>();
let dailyCalls = 0;
let dailyReset = Date.now() + 24 * 60 * 60 * 1000;

export const MENTOR_LIMIT_PER_10MIN = 20;
export const MENTOR_DAILY_CAP = 300;

export function rateLimit(key: string, limit = MENTOR_LIMIT_PER_10MIN, windowMs = 10 * 60 * 1000, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return { ok: true as const };
  }
  if (b.n >= limit) return { ok: false as const, retryAfterMs: b.reset - now };
  b.n += 1;
  return { ok: true as const };
}

export function dailyCap(now = Date.now()): { ok: boolean } {
  if (now > dailyReset) {
    dailyCalls = 0;
    dailyReset = now + 24 * 60 * 60 * 1000;
  }
  if (dailyCalls >= MENTOR_DAILY_CAP) return { ok: false };
  dailyCalls += 1;
  return { ok: true };
}

export function resetGuardsForTests() {
  buckets.clear();
  dailyCalls = 0;
}

/** AI mode needs the access code (adults only for the controlled demonstration). */
export function accessAllowed(provided: string | null | undefined): boolean {
  const code = process.env.ACCESS_CODE;
  if (!code) return false; // no code configured = AI mode closed
  return typeof provided === "string" && provided.length > 0 && provided === code;
}

export function clientKey(headers: Headers): string {
  return (headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
}
