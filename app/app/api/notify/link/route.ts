import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/guards";
import { issueLinkCode } from "@/lib/notify/store";

const noStore = { "Cache-Control": "no-store" };

/** Issues a one-time Telegram link code (10-min expiry). Not AI mode; no access code needed. */
export async function POST(req: Request) {
  const rl = rateLimit(`notify-link:${clientKey(req.headers)}`, 10);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: noStore });
  const { code, expiresAt } = await issueLinkCode();
  return NextResponse.json({ code, expiresAt }, { headers: noStore });
}
