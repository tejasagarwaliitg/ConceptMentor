import { NextResponse } from "next/server";
import { z } from "zod";
import { GRAPH, LIVE_NODES } from "@/content/graph";
import { explainMatch, matchQuestionToNodes } from "@/lib/matcher";
import { suggestEntryNode, type AgentConfig } from "@/lib/mentor/run";
import { MODEL_PATTERN, PROVIDERS, PROVIDER_IDS } from "@/lib/ai-providers";
import { clientKey, rateLimit } from "@/lib/guards";
import { LIMITS, checkText, scrubPII } from "@/lib/safety";
import type { NodeId } from "@/lib/types";


const Body = z
  .object({
    /**
     * The student's OWN key from Settings. The provider is an enum: the server looks the base URL up
     * in its allowlist and never accepts a URL from the client. The key is used for this request
     * only and is never logged or stored.
     */
    ai: z
      .object({
        provider: z.enum(PROVIDER_IDS),
        apiKey: z.string().min(8).max(300),
        model: z.string().regex(MODEL_PATTERN),
        vision: z.boolean(),
      })
      .optional(),
    /** recognised question text, from local OCR or typed by the student (may be empty when only a photo is sent) */
    text: z.string().max(4000).default(""),
    /** optional photo for a vision-capable model (data URL) */
    image: z.string().max(4_500_000).optional(),
  })
  .refine((b) => b.text.trim().length > 0 || Boolean(b.image), { message: "text or image required" });

export interface Candidate {
  node: NodeId;
  name: string;
  score: number;
  matched: string[];
}

/** Why the AI layer did or did not run. Shown to the student so a silent fallback is never mistaken for AI. */
export type AiStatus = "used" | "not_requested" | "rate_limited" | "failed";

/**
 * Photo -> question text -> graph node.
 * Three independent layers, so it works even with no model configured:
 *   1. local OCR (already done by the client via /api/ocr)
 *   2. deterministic keyword matcher (always runs, always shown)
 *   3. Cline SDK agent (only when the student has added their own API key in Settings)
 * The agent may only choose among nodes the matcher considers plausible (or, when the matcher
 * found nothing, among the live nodes). Its choice is CHECKED against the matcher; a
 * disagreement is reported and the student picks.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { text, image } = parsed.data;

  // Safety gate runs first, on any free text.
  const verdict = checkText(text);
  if (verdict.kind === "distress") return NextResponse.json({ safety: "distress", message: verdict.message });
  if (verdict.kind === "abuse") return NextResponse.json({ safety: "abuse", message: verdict.message });

  const match = matchQuestionToNodes(text);
  const candidates: Candidate[] = match.evidence.slice(0, 4).map((e) => ({
    node: e.node,
    name: GRAPH[e.node].name,
    score: e.score,
    matched: e.matched,
  }));

  let agent: { nodeId?: NodeId; confidence?: string; reason?: string } | null = null;
  let aiStatus: AiStatus = "not_requested";
  let trace: unknown[] = [];
  let usage: unknown;

  if (parsed.data.ai) {
    if (!rateLimit(clientKey(req.headers)).ok) {
      aiStatus = "rate_limited";
    } else {
      const user = parsed.data.ai;
      const cfg: AgentConfig = {
        apiKey: user.apiKey,
        baseUrl: PROVIDERS[user.provider].baseUrl,
        model: user.model,
        vision: user.vision,
      };
      const ctx = {
        summary: {
          entry: (match.node ?? "projectile") as NodeId,
          probedStates: {},
          tone: { mentor: "bhaiya", register: "tum", language: "english" },
        },
      };
      // With a photo the OCR text may be wrong, so the model may pick any live node; the
      // agreement check below still exposes a disagreement. Text-only: stay within the matcher's candidates.
      const allowed = !image && candidates.length ? candidates.map((c) => c.node) : (LIVE_NODES as string[]);
      const res = await suggestEntryNode(ctx, scrubPII(text).slice(0, LIMITS.paste), image, allowed, cfg);
      trace = res.trace ?? [];
      usage = res.usage;
      if (res.ok && res.value) {
        agent = res.value;
        aiStatus = "used";
      } else {
        aiStatus = "failed";
      }
    }
  }

  // Agreement is only meaningful when BOTH layers produced a node.
  const agreed = agent?.nodeId && match.node ? agent.nodeId === match.node : null;

  return NextResponse.json(
    {
      text,
      match: { node: match.node, confidence: match.confidence, reason: match.reason, evidence: explainMatch(match) },
      candidates,
      agent,
      agreed,
      aiStatus,
      trace,
      usage,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
