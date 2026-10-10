import { NextResponse } from "next/server";
import { z } from "zod";
import { gradeItem } from "@/lib/items";


const Body = z.object({
  instanceToken: z.string().max(600),
  chosen: z.number().int().min(-2).max(10),
  confidence: z.enum(["pakka", "shayad", "guess"]),
});

/** Grades on the server. The client never sends "I was correct". */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const result = gradeItem(parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
