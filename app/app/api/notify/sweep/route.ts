import { NextResponse } from "next/server";
import { GRAPH } from "@/content/graph";
import { t } from "@/lib/copy";
import { listLinkedCodes, getBinding, saveBinding, deleteBinding } from "@/lib/notify/store";
import { sendTelegram } from "@/lib/notify/telegram";

const noStore = { "Cache-Control": "no-store" };
const MAX_SENDS_PER_RUN = 25;

/**
 * Cron sweep (Vercel cron -> GET). Accountability is revision-only per the
 * revision plans (idea.md §9; PROF-05 / D-06): the bot nudges nothing but a
 * due re-check from the student's own commitment and the +1/+7/+30 schedule.
 * Each due, unsent row is sent exactly once (idempotent by sentAt). A
 * blocked/deleted chat (Telegram 4xx) unbinds itself.
 */
export async function GET(req: Request) {
  const cron = process.env.NOTIFY_CRON_SECRET;
  if (cron && req.headers.get("authorization") !== `Bearer ${cron}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });
  }

  const now = Date.now();
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  let checked = 0;
  let sent = 0;
  let unbound = 0;

  for (const code of await listLinkedCodes()) {
    const b = await getBinding(code);
    if (!b?.chatId) {
      await deleteBinding(code); // stale index entry
      continue;
    }
    checked += 1;
    if (sent >= MAX_SENDS_PER_RUN) continue;

    // Due re-check nudges only: one per sweep, from the revision schedule.
    const due = b.schedule.filter((r) => r.dueAt <= now && !r.sentAt);
    if (due.length > 0) {
      const row = due[0];
      const text =
        t().remind.nudge(GRAPH[row.node].name) + (appUrl ? `\n${appUrl}?recheck=${row.node}` : "");
      const res = await sendTelegram(b.chatId, text);
      if (res.sent) {
        sent += 1;
        await saveBinding({
          ...b,
          lastNudgeAt: now,
          schedule: b.schedule.map((r) => (r === row ? { ...r, sentAt: now } : r)),
        });
      } else if (res.reason === "telegram_403" || res.reason === "telegram_400") {
        await deleteBinding(code);
        unbound += 1;
      }
    }
  }
  return NextResponse.json({ ok: true, checked, sent, unbound }, { headers: noStore });
}
