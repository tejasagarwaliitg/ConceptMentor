import { NextResponse } from "next/server";
import { z } from "zod";
import { LIVE_NODES } from "@/content/graph";
import type { NodeId } from "@/lib/types";
import { getBinding, linkExpired, saveBinding, type DueRow } from "@/lib/notify/store";

const noStore = { "Cache-Control": "no-store" };
const NodeEnum = z.enum(LIVE_NODES as [NodeId, ...NodeId[]]);

const Body = z.object({
  code: z.string().regex(/^[A-Z2-9]{6}$/),
  due: z.array(z.object({ node: NodeEnum, dueAt: z.number().int().positive() })).max(20),
  rhythm: z
    .object({
      usualHour: z.number().int().min(0).max(23),
      tzOffsetMin: z.number().int().min(-720).max(840),
      lastActiveAt: z.number().int().positive().nullable(),
    })
    .optional(),
});

/**
 * Reconciliation point. The browser engine stays authoritative: the app pushes
 * its due rows, the server returns pending bot intents (and clears them).
 * The app applies each intent through the reducer (setRecheckChoice), which
 * ignores anything invalid for the node's current state.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400, headers: noStore });
  const b = await getBinding(parsed.data.code);
  if (!b) return NextResponse.json({ error: "unknown_code" }, { status: 404, headers: noStore });
  if (linkExpired(b)) return NextResponse.json({ error: "code_expired" }, { status: 410, headers: noStore });

  const old = new Map(b.schedule.map((r) => [`${r.node}:${r.dueAt}`, r.sentAt]));
  const schedule: DueRow[] = parsed.data.due.map((d) => ({
    node: d.node,
    dueAt: d.dueAt,
    sentAt: old.get(`${d.node}:${d.dueAt}`),
  }));
  const intents = b.intents;
  await saveBinding({ ...b, schedule, intents: [], rhythm: parsed.data.rhythm ?? b.rhythm });
  return NextResponse.json({ linked: Boolean(b.chatId), intents }, { headers: noStore });
}
