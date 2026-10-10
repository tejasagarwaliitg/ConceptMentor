import { describe, expect, it, vi } from "vitest";

// `server-only` throws outside a server bundle; stub it for unit tests.
vi.mock("server-only", () => ({}));

import { t } from "@/lib/copy";
import { applyReschedule, classifyInbound, replyFor } from "@/lib/notify/webhook";
import type { Binding } from "@/lib/notify/store";

describe("inbound pipeline", () => {
  it("routes /start CODE to linking even when unlinked", () => {
    expect(classifyInbound("/start ABC123", false)).toEqual({ kind: "link", code: "ABC123" });
  });

  it("asks for linking when unknown chat writes anything else", () => {
    expect(classifyInbound("kal karunga", false)).toEqual({ kind: "need_link" });
  });

  it("postpones when linked", () => {
    expect(classifyInbound("function hai, kal karunga", true)).toEqual({ kind: "reschedule", days: 1 });
  });

  it("safety gate runs before intent (distress + postpone words -> safety, no reschedule)", () => {
    const a = classifyInbound("i want to die, kal karunga", true);
    expect(a.kind).toBe("safety");
    if (a.kind === "safety") expect(a.message).toMatch(/14416/);
  });

  it("abuse gets the deflect template", () => {
    expect(classifyInbound("fuck off", true).kind).toBe("safety");
  });

  it("done / stop / gibberish classify correctly", () => {
    expect(classifyInbound("ho gaya", true)).toEqual({ kind: "done" });
    expect(classifyInbound("/stop", true)).toEqual({ kind: "stop" });
    expect(classifyInbound("aur batao", true)).toEqual({ kind: "none" });
  });

  it("replies are templates only", () => {
    const c = t().remind;
    expect(replyFor({ kind: "reschedule", days: 3 })).toBe(c.postponed(3));
    expect(replyFor({ kind: "done" })).toBe(c.doneReply);
    expect(replyFor({ kind: "none" })).toBe(c.fallback);
    expect(replyFor({ kind: "need_link" })).toBe(c.needLink);
  });
});

describe("applyReschedule", () => {
  const binding = (at: number): Binding => ({
    code: "ABC123",
    createdAt: at,
    chatId: "9",
    schedule: [
      { node: "vec_comp", dueAt: at, sentAt: at },
      { node: "trig", dueAt: at + 1000 },
    ],
    intents: [],
  });

  it("shifts every row, re-arms sent rows, records the intent", () => {
    const at = 1_000_000;
    const next = applyReschedule(binding(at), 3, at + 500);
    expect(next.schedule[0].dueAt).toBe(at + 3 * 24 * 60 * 60 * 1000);
    expect(next.schedule[0].sentAt).toBeUndefined();
    expect(next.schedule[1].dueAt).toBe(at + 1000 + 3 * 24 * 60 * 60 * 1000);
    expect(next.intents).toEqual([{ days: 3, at: at + 500 }]);
  });
});
