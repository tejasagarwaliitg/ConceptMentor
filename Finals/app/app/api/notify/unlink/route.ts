import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteBinding } from "@/lib/notify/store";

const noStore = { "Cache-Control": "no-store" };

/** Deletes the chat binding. Idempotent; also called when the user deletes app progress. */
export async function POST(req: Request) {
  const parsed = z.object({ code: z.string().max(10) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400, headers: noStore });
  await deleteBinding(parsed.data.code.toUpperCase());
  return NextResponse.json({ ok: true }, { headers: noStore });
}
