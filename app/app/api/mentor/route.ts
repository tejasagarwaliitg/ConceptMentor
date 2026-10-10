import { NextResponse } from "next/server";
import { z } from "zod";
import { LIVE_NODES } from "@/content/graph";
import { accessAllowed, clientKey, dailyCap, rateLimit } from "@/lib/guards";
import { isAgentConfigured, suggestProbeOrder, suggestRepairOrder, suggestStuckCard } from "@/lib/mentor/run";
import { LIMITS, checkText, scrubPII } from "@/lib/safety";
import type { NodeId } from "@/lib/types";


const NodeEnum = z.enum(LIVE_NODES as [NodeId, ...NodeId[]]);

const Body = z.object({
  accessCode: z.string().max(80),
  adultConfirmed: z.literal(true),
  job: z.enum(["probe_order", "stuck_card", "repair_order"]),
  node: NodeEnum,
  attempt: z.string().max(LIMITS.attempt).nullable().optional(),
  lowData: z.boolean().optional(),
  tone: z.object({ mentor: z.string().max(10), register: z.string().max(10), language: z.string().max(10) }),
  probedStates: z.record(z.string(), z.string().max(30)).optional(),
});

/**
 * AI mode only. Adults, behind an access code. Returns a *validated suggestion* plus the full trace.
 * The student never talks to the model: input is structured data (+ an optional short note, scrubbed).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const b = parsed.data;

  if (!accessAllowed(b.accessCode)) return NextResponse.json({ error: "ai_mode_closed" }, { status: 403 });
  if (!isAgentConfigured()) return NextResponse.json({ ok: false, consequence: "fallback", trace: [], reason: "not_configured" });

  const rl = rateLimit(clientKey(req.headers));
  if (!rl.ok) return NextResponse.json({ error: "rate_limited", retryAfterMs: rl.retryAfterMs }, { status: 429 });
  if (!dailyCap().ok) return NextResponse.json({ error: "daily_cap" }, { status: 429 });

  // Safety gate runs before any model call, on any free text.
  let attempt: string | null = null;
  if (b.attempt) {
    const verdict = checkText(b.attempt);
    if (verdict.kind === "distress") return NextResponse.json({ safety: "distress", message: verdict.message });
    if (verdict.kind === "abuse") return NextResponse.json({ safety: "abuse", message: verdict.message });
    attempt = scrubPII(b.attempt);
  }

  const ctx = {
    summary: {
      entry: b.node,
      probedStates: (b.probedStates ?? {}) as Partial<Record<NodeId, string>>,
      tone: b.tone,
    },
  };

  const result =
    b.job === "probe_order"
      ? await suggestProbeOrder(ctx, b.node, attempt)
      : b.job === "stuck_card"
        ? await suggestStuckCard(ctx, b.node, attempt)
        : await suggestRepairOrder(ctx, b.node, Boolean(b.lowData));

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
