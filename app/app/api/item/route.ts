import { NextResponse } from "next/server";
import { z } from "zod";
import { issueItem } from "@/lib/items";
import { LIVE_NODES } from "@/content/graph";
import type { NodeId } from "@/lib/types";


const Body = z.object({
  node: z.enum(LIVE_NODES as [NodeId, ...NodeId[]]),
  type: z.enum(["A", "B1", "B2", "R"]),
  exclude: z.array(z.string().max(80)).max(10000).optional(),
});

/** Issues an item instance. The response never contains the answer, tags or notes. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const issued = issueItem(parsed.data.node, parsed.data.type, parsed.data.exclude ?? []);
  if (!issued) {
    // Not approved / not authored: the node is "coming next" from the student's point of view.
    return NextResponse.json({ error: "no_item", reason: "not_available" }, { status: 404 });
  }
  return NextResponse.json(issued, { headers: { "Cache-Control": "no-store" } });
}
