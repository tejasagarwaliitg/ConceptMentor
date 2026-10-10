import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { LIVE_NODES } from "@/content/graph";
import { LEVELS } from "@/lib/qbank/types";
import { coverage, pickFresh, servable } from "@/lib/qbank/select";
import { loadBank } from "@/lib/qbank/store";
import { issueToken, shuffleOrder } from "@/lib/qbank/token";
import type { NodeId } from "@/lib/types";

const Body = z.object({
  node: z.enum(LIVE_NODES as [NodeId, ...NodeId[]]),
  level: z.enum(LEVELS as ["A", "B", "C"]),
  /** ids this student has already been shown (client keeps this list) */
  seen: z.array(z.string().max(80)).max(10000).default([]),
});

/** GET: how many servable questions exist per node and level (no content). */
export async function GET() {
  const bank = loadBank();
  return NextResponse.json({ coverage: coverage(bank), total: servable(bank).length }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST: a never-before-seen question for a node + level. Options are shuffled per
 * instance; the signed token carries the permutation. No answer, derivation or flags are sent.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { node, level, seen } = parsed.data;
  const pick = pickFresh(loadBank(), node, level, seen);
  if (!pick.question) {
    return NextResponse.json(
      { error: pick.exhausted ? "pool_exhausted" : "no_question" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }
  const q = pick.question;
  const order = q.kind === "numeric" ? [] : shuffleOrder(q.options.length);
  return NextResponse.json(
    {
      id: q.id,
      node: q.node,
      level: q.level,
      stem: q.stem,
      options: order.map((o) => q.options[o]),
      kind: q.kind,
      unit: q.unit,
      source: `${q.source.exam} ${q.source.year}, ${q.source.paper}`,
      tier: q.source.tier,
      unseenLeft: pick.unseenLeft,
      token: issueToken(q.id, order),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
