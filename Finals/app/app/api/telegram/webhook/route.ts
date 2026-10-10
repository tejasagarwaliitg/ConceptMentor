import { NextResponse } from "next/server";
import { z } from "zod";
import { t } from "@/lib/copy";
import { LIMITS } from "@/lib/safety";
import {
  applyReschedule,
  classifyInbound,
  replyFor,
} from "@/lib/notify/webhook";
import {
  bindChat,
  deleteBinding,
  getBinding,
  getCodeByChat,
  linkExpired,
  saveBinding,
} from "@/lib/notify/store";
import { sendTelegram } from "@/lib/notify/telegram";

const Update = z.object({
  message: z
    .object({
      chat: z.object({ id: z.union([z.number(), z.string()]) }),
      text: z.string().max(2000).optional(),
    })
    .optional(),
});

/**
 * Telegram webhook. Always answers 200 (except a bad secret) so Telegram
 * does not retry-storm us. Inbound text is processed and dropped; only
 * chat bindings + due timestamps are stored.
 */
export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token") ?? new URL(req.url).searchParams.get("secret");
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected && secret !== expected) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!expected) console.warn("[notify] TELEGRAM_WEBHOOK_SECRET unset: webhook accepts any caller (dev-grade)");

  const parsed = Update.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true });
  const msg = parsed.data.message;
  if (!msg?.text) return NextResponse.json({ ok: true }); // stickers, joins, etc: ignore

  const chatId = String(msg.chat.id);
  const text = msg.text.slice(0, LIMITS.attempt);
  const code = await getCodeByChat(chatId);
  const binding = code ? await getBinding(code) : null;
  const linked = Boolean(binding?.chatId);
  const action = classifyInbound(text, linked);

  if (action.kind === "link") {
    const b = await getBinding(action.code);
    if (!b || linkExpired(b)) {
      await sendTelegram(chatId, t().remind.needLink);
    } else {
      await bindChat(action.code, chatId);
      await sendTelegram(chatId, t().remind.linked);
    }
    return NextResponse.json({ ok: true });
  }

  if (!binding) {
    await sendTelegram(chatId, replyFor(action)); // need_link
    return NextResponse.json({ ok: true });
  }

  switch (action.kind) {
    case "stop":
      await deleteBinding(binding.code);
      await sendTelegram(chatId, replyFor(action), { keyboard: false });
      break;
    case "reschedule":
      await saveBinding(applyReschedule(binding, action.days, Date.now()));
      await sendTelegram(chatId, replyFor(action));
      break;
    default:
      // safety / done / help / none / need_link: template reply, no state change
      await sendTelegram(chatId, replyFor(action));
      break;
  }
  return NextResponse.json({ ok: true });
}
