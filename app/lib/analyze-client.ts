"use client";
import type { MentorTrace } from "@/lib/api";
import type { NodeId } from "@/lib/types";
import type { AiSettings } from "@/lib/ai-providers";

export const MAX_BYTES = 4_000_000;

export type AiStatus = "used" | "not_requested" | "rate_limited" | "failed";

export interface Analysis {
  text: string;
  match: { node: NodeId | null; confidence: string; reason: string; evidence: string[] };
  candidates: { node: NodeId; name: string; score: number; matched: string[] }[];
  agent?: { nodeId?: NodeId; confidence?: string; reason?: string } | null;
  agreed?: boolean | null;
  trace?: MentorTrace[];
  aiStatus?: AiStatus;
  usage?: { inputTokens: number; outputTokens: number; totalCost?: number };
}

/** The server answered with the safety gate instead of an analysis. */
export interface SafetyReply { safety: "distress" | "abuse"; message: string }
export type AnalyseResult = { kind: "ok"; analysis: Analysis } | { kind: "safety"; reply: SafetyReply } | { kind: "error" };

/** Downscale on the device so a phone photo fits the upload cap. */
export function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

export async function analyseQuestion(text: string, image?: string, ai?: AiSettings | null): Promise<AnalyseResult> {
  try {
    const r = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, image, ai: ai ?? undefined }),
    });
    if (!r.ok) return { kind: "error" };
    const j = await r.json();
    if (j && (j.safety === "distress" || j.safety === "abuse")) return { kind: "safety", reply: j as SafetyReply };
    return { kind: "ok", analysis: j as Analysis };
  } catch {
    return { kind: "error" };
  }
}
