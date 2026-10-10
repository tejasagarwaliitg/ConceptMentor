import "server-only";
import { randomInt } from "node:crypto";
import type { NodeId } from "@/lib/types";

/**
 * Minimal reminder store (WP-A). Holds ONLY chat bindings + due timestamps:
 * no grades, no history, no free text. Inbound text is processed and dropped.
 *
 * Backend: Upstash/Vercel KV REST (no new dependency, plain fetch) when
 * KV_REST_API_URL + KV_REST_API_TOKEN are set; otherwise an in-memory Map
 * (local dev only — a single server instance; stated in the reply when used).
 */

export interface DueRow {
  node: NodeId;
  dueAt: number;
  sentAt?: number;
}
export interface RemIntent {
  days: 1 | 3 | 7;
  at: number;
}
export interface Binding {
  code: string;
  createdAt: number;
  chatId?: string;
  schedule: DueRow[];
  intents: RemIntent[];
  /** study rhythm snapshot from the last app sync (for the inactivity nudge) */
  rhythm?: { usualHour: number; tzOffsetMin: number; lastActiveAt: number | null };
  /** ms of the last nudge of any kind (due or inactivity); one nudge per day max */
  lastNudgeAt?: number;
}

export const LINK_TTL_MS = 10 * 60 * 1000;
const codeKey = (c: string) => `notify:code:${c}`;
const chatKey = (c: string) => `notify:chat:${c}`;
const CHATS = "notify:chats";

// --- backend ---------------------------------------------------------------

const REST_URL = process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN;
let warned = false;

const mem = new Map<string, string>();
const memSets = new Map<string, Set<string>>();

function hasKvEnv(): boolean {
  return Boolean(REST_URL && REST_TOKEN);
}

async function cmd(...args: (string | number)[]): Promise<unknown> {
  const r = await fetch(REST_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`kv ${r.status}`);
  return (await r.json()).result;
}

async function kvGet(k: string): Promise<string | null> {
  if (!hasKvEnv()) {
    if (!warned) {
      warned = true;
      console.warn("[notify] KV env missing: using in-memory reminder store (single instance only)");
    }
    return mem.get(k) ?? null;
  }
  const v = await cmd("GET", k);
  return typeof v === "string" ? v : null;
}

async function kvSet(k: string, v: string): Promise<void> {
  if (!hasKvEnv()) {
    mem.set(k, v);
    return;
  }
  await cmd("SET", k, v);
}

async function kvDel(k: string): Promise<void> {
  if (!hasKvEnv()) {
    mem.delete(k);
    return;
  }
  await cmd("DEL", k);
}

async function sAdd(m: string): Promise<void> {
  if (!hasKvEnv()) {
    const s = memSets.get(CHATS) ?? new Set<string>();
    s.add(m);
    memSets.set(CHATS, s);
    return;
  }
  await cmd("SADD", CHATS, m);
}

async function sRem(m: string): Promise<void> {
  if (!hasKvEnv()) {
    memSets.get(CHATS)?.delete(m);
    return;
  }
  await cmd("SREM", CHATS, m);
}

async function sMembers(): Promise<string[]> {
  if (!hasKvEnv()) return [...(memSets.get(CHATS) ?? [])];
  const v = await cmd("SMEMBERS", CHATS);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

// --- bindings --------------------------------------------------------------

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeCode(): string {
  return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export function isCode(s: string): boolean {
  return /^[A-Z2-9]{6}$/.test(s);
}

async function readBinding(code: string): Promise<Binding | null> {
  const raw = await kvGet(codeKey(code));
  if (!raw) return null;
  try {
    const b = JSON.parse(raw) as Binding;
    if (b.code !== code || !Array.isArray(b.schedule) || !Array.isArray(b.intents)) return null;
    return b;
  } catch {
    return null;
  }
}

export async function issueLinkCode(): Promise<{ code: string; expiresAt: number }> {
  const code = makeCode();
  const createdAt = Date.now();
  const b: Binding = { code, createdAt, schedule: [], intents: [] };
  await kvSet(codeKey(code), JSON.stringify(b));
  return { code, expiresAt: createdAt + LINK_TTL_MS };
}

export async function getBinding(code: string): Promise<Binding | null> {
  return readBinding(code);
}

export async function saveBinding(b: Binding): Promise<void> {
  await kvSet(codeKey(b.code), JSON.stringify(b));
}

/** Pending codes expire lazily on use; bound codes live until unlinked. */
export function linkExpired(b: Binding, now = Date.now()): boolean {
  return !b.chatId && now - b.createdAt > LINK_TTL_MS;
}

export async function bindChat(code: string, chatId: string): Promise<Binding | null> {
  const b = await readBinding(code);
  if (!b || linkExpired(b)) return null;
  const next: Binding = { ...b, chatId };
  await kvSet(codeKey(code), JSON.stringify(next));
  await kvSet(chatKey(chatId), code);
  await sAdd(code);
  return next;
}

export async function getCodeByChat(chatId: string): Promise<string | null> {
  return kvGet(chatKey(chatId));
}

export async function deleteBinding(code: string): Promise<void> {
  const b = await readBinding(code);
  await kvDel(codeKey(code));
  await sRem(code);
  if (b?.chatId) await kvDel(chatKey(b.chatId));
}

export async function listLinkedCodes(): Promise<string[]> {
  return sMembers();
}
