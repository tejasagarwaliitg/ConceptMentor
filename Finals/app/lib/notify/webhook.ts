import { checkText } from "@/lib/safety";
import { t } from "@/lib/copy";
import { DAY_MS } from "@/lib/types";
import { parseReminderIntent } from "./intent";
import { isCode, type Binding } from "./store";

/**
 * Pure inbound pipeline (WP-C). The route does KV + network; everything
 * decided here is unit-tested without either.
 *
 * Order is load-bearing: link -> safety gate -> intent. Safety runs before
 * any intent handling, in both modes (same rule as idea.md 11.5).
 */

export type InboundAction =
  | { kind: "link"; code: string }
  | { kind: "safety"; message: string }
  | { kind: "reschedule"; days: 1 | 3 | 7 }
  | { kind: "done" }
  | { kind: "stop" }
  | { kind: "help" }
  | { kind: "none" }
  | { kind: "need_link" };

export function classifyInbound(raw: string, linked: boolean): InboundAction {
  const text = raw.trim();
  const start = text.match(/^\/start(?:@\w+)?\s+([A-Za-z0-9]+)\s*$/i);
  if (start) return { kind: "link", code: start[1].toUpperCase() };
  if (!linked) return { kind: "need_link" };

  const verdict = checkText(text);
  if (verdict.kind !== "ok") return { kind: "safety", message: verdict.message };

  const intent = parseReminderIntent(text);
  switch (intent.kind) {
    case "postpone":
      return { kind: "reschedule", days: intent.days };
    case "done":
    case "help":
    case "stop":
    case "none":
      return { kind: intent.kind };
  }
}

/** Shift every scheduled row by N days and record the intent for app reconciliation. */
export function applyReschedule(b: Binding, days: 1 | 3 | 7, at: number): Binding {
  const shift = days * DAY_MS;
  return {
    ...b,
    schedule: b.schedule.map((r) => ({ ...r, dueAt: r.dueAt + shift, sentAt: undefined })),
    intents: [...b.intents, { days, at }],
  };
}

export function replyFor(action: InboundAction): string {
  const c = t().remind;
  switch (action.kind) {
    case "link":
      return c.codeReady(action.code); // replaced by the route with the real outcome
    case "safety":
      return action.message;
    case "reschedule":
      return c.postponed(action.days);
    case "done":
      return c.doneReply;
    case "stop":
      return c.stopped;
    case "help":
    case "none":
      return c.fallback;
    case "need_link":
      return c.needLink;
  }
}

export { isCode };
