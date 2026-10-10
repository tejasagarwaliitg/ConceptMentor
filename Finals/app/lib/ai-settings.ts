"use client";
import { MODEL_PATTERN, PROVIDERS, type AiSettings, type ProviderId } from "./ai-providers";

/**
 * Per-profile storage for the student's own API key.
 * - Signed-in profile: localStorage, keyed by profile id, so each profile has its own key.
 * - Guest mode: sessionStorage, cleared when the tab closes.
 * It is deliberately NOT part of the profile's StudentState, so progress exports never contain it.
 */
const PREFIX = "kadi.ai.v1:";
const keyFor = (owner: string | null) => `${PREFIX}${owner ?? "guest"}`;
const area = (owner: string | null): Storage => (owner ? window.localStorage : window.sessionStorage);

function valid(x: unknown): x is AiSettings {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return (
    typeof s.provider === "string" && s.provider in PROVIDERS &&
    typeof s.apiKey === "string" && s.apiKey.length >= 8 && s.apiKey.length <= 300 &&
    typeof s.model === "string" && MODEL_PATTERN.test(s.model) &&
    typeof s.vision === "boolean"
  );
}

export function loadAiSettings(owner: string | null): AiSettings | null {
  try {
    const raw = area(owner).getItem(keyFor(owner));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return valid(parsed) ? { provider: parsed.provider as ProviderId, apiKey: parsed.apiKey, model: parsed.model, vision: parsed.vision } : null;
  } catch {
    return null;
  }
}

export function saveAiSettings(owner: string | null, s: AiSettings): boolean {
  if (!valid(s)) return false;
  try {
    area(owner).setItem(keyFor(owner), JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function clearAiSettings(owner: string | null) {
  try {
    area(owner).removeItem(keyFor(owner));
  } catch {
    /* storage blocked */
  }
}

/** Shows enough to recognise the key without exposing it. */
export function maskKey(key: string): string {
  if (key.length <= 10) return "••••••••";
  return `${key.slice(0, 5)}••••••••${key.slice(-4)}`;
}
