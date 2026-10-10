"use client";
import type { Confidence, GradedAnswer, ItemType, NodeId, PublicItem } from "./types";

export interface Issued {
  item: PublicItem;
  instanceId: string;
  instanceToken: string;
}

export async function fetchItem(node: NodeId, type: ItemType, exclude: string[] = []): Promise<Issued | null> {
  const r = await fetch("/api/item", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ node, type, exclude }),
  });
  if (!r.ok) return null;
  return (await r.json()) as Issued;
}

export interface GradeResponse {
  ok: boolean;
  answer?: GradedAnswer;
  correctText?: string;
  tag?: string | null;
  error?: string;
}

export async function gradeAnswer(instanceToken: string, chosen: number, confidence: Confidence): Promise<GradeResponse> {
  const r = await fetch("/api/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instanceToken, chosen, confidence }),
  });
  if (!r.ok) return { ok: false, error: "network" };
  return (await r.json()) as GradeResponse;
}

export interface MentorTrace {
  at: number;
  kind: string;
  tool?: string;
  detail: string;
}
export interface MentorResponse {
  ok?: boolean;
  value?: unknown;
  consequence?: "accepted" | "rejected_by_validation" | "fallback";
  trace?: MentorTrace[];
  usage?: { inputTokens: number; outputTokens: number; totalCost?: number };
  error?: string;
  safety?: "distress" | "abuse";
  message?: string;
}

export async function askMentor(body: Record<string, unknown>): Promise<MentorResponse> {
  try {
    const r = await fetch("/api/mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await r.json()) as MentorResponse;
  } catch {
    return { ok: false, consequence: "fallback", trace: [], error: "network" };
  }
}

// --- Telegram reminders (WP-A). The link code lives in this browser only. ---

const NOTIFY_KEY = "kadi.notify.v1";

function readNotifyMap(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(NOTIFY_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as unknown;
    if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, string>;
    return null;
  } catch {
    return null;
  }
}

/** Link codes are per profile. Called without a pid, returns the device-global code (if any). */
export function getNotifyCode(pid?: string): string | null {
  const m = readNotifyMap();
  if (m) return pid && typeof m[pid] === "string" ? m[pid] : null;
  try {
    const raw = localStorage.getItem(NOTIFY_KEY);
    return raw && !raw.startsWith("{") ? raw : null;
  } catch {
    return null;
  }
}

export function claimLegacyCode(pid: string): void {
  if (readNotifyMap()) return;
  try {
    const raw = localStorage.getItem(NOTIFY_KEY);
    if (raw && !raw.startsWith("{")) localStorage.setItem(NOTIFY_KEY, JSON.stringify({ [pid]: raw }));
  } catch {
    /* storage blocked */
  }
}

export function setNotifyCode(pid: string, code: string): void {
  try {
    localStorage.setItem(NOTIFY_KEY, JSON.stringify({ ...(readNotifyMap() ?? {}), [pid]: code }));
  } catch {
    /* storage blocked */
  }
}

export function clearNotifyCode(pid: string): void {
  try {
    const m = readNotifyMap() ?? {};
    delete m[pid];
    localStorage.setItem(NOTIFY_KEY, JSON.stringify(m));
  } catch {
    /* storage blocked */
  }
}

export interface DueSync {
  node: NodeId;
  dueAt: number;
}

export interface SyncResult {
  linked: boolean;
  intents: { days: 1 | 3 | 7; at: number }[];
}

async function postJson(path: string, body: unknown): Promise<unknown | null> {
  try {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    return (await r.json()) as unknown;
  } catch {
    return null;
  }
}

export async function requestLinkCode(): Promise<{ code: string; expiresAt: number } | null> {
  const r = await postJson("/api/notify/link", {});
  if (!r || typeof r !== "object" || typeof (r as { code?: unknown }).code !== "string") return null;
  return r as { code: string; expiresAt: number };
}

export interface RhythmSync {
  usualHour: number;
  tzOffsetMin: number;
  lastActiveAt: number | null;
}

export async function syncNotify(code: string, due: DueSync[], rhythm?: RhythmSync): Promise<SyncResult | null> {
  const r = await postJson("/api/notify/sync", rhythm ? { code, due, rhythm } : { code, due });
  if (!r || typeof r !== "object") return null;
  return r as SyncResult;
}

export async function unlinkNotify(code: string): Promise<void> {
  await postJson("/api/notify/unlink", { code });
}

export interface AiTestResult { ok: boolean; ms?: number; sample?: string; error?: string }

/** Settings -> Test connection. Sends the student's own key to our server once; nothing is stored. */
export async function testAiKey(body: { provider: string; apiKey: string; model: string }): Promise<AiTestResult> {
  try {
    const r = await fetch("/api/ai-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return (await r.json()) as AiTestResult;
  } catch {
    return { ok: false, error: "Could not reach the server." };
  }
}
