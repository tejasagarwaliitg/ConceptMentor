import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, expiring token that carries the question id and the option order that was shown.
 * Grading needs this token, so the client can never claim "I was correct" and the answer
 * key never leaves the server before grading (same pattern as lib/items.ts).
 */
const SECRET = () => process.env.ITEM_SECRET ?? "dev-only-secret-change-me";
const TTL_MS = 60 * 60 * 1000;

const sign = (p: string) => createHmac("sha256", SECRET()).update(p).digest("hex");

export function issueToken(id: string, order: number[], now = Date.now()): string {
  const payload = `${id}|${order.join(",")}|${now}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function readToken(token: string, now = Date.now()): { id: string; order: number[] } | null {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString();
  } catch {
    return null;
  }
  const want = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const [id, order, at] = payload.split("|");
  if (!id || !Number.isFinite(Number(at)) || now - Number(at) > TTL_MS) return null;
  // numeric questions have no options, so an empty order is valid
  if (order !== "" && !/^\d+(,\d+)*$/.test(order)) return null;
  return { id, order: order === "" ? [] : order.split(",").map(Number) };
}

export function shuffleOrder(n: number, rand: () => number = Math.random): number[] {
  const o = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}
