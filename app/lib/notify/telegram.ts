import "server-only";

/** Telegram Bot API sender. Templates only — the model never authors a message. */

const API = "https://api.telegram.org";

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

const KEYBOARD = [["Kal"], ["3 din baad"], ["Hafte baad"], ["Aaj ho gaya"]];

export async function sendTelegram(
  chatId: string,
  text: string,
  opts: { keyboard?: boolean } = {}
): Promise<{ sent: boolean; reason?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[notify] TELEGRAM_BOT_TOKEN unset: message not sent (app still works)");
    return { sent: false, reason: "not_configured" };
  }
  try {
    const body: Record<string, unknown> = { chat_id: chatId, text };
    if (opts.keyboard !== false) {
      body.reply_markup = { keyboard: KEYBOARD.map((r) => r.map((t) => ({ text: t }))), resize_keyboard: true };
    }
    const r = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      // 403/400 = blocked or deleted chat; the caller unbinds on these.
      return { sent: false, reason: `telegram_${r.status}` };
    }
    return { sent: true };
  } catch {
    return { sent: false, reason: "network" };
  }
}
