import { describe, expect, it, vi } from "vitest";

// `server-only` throws outside a server bundle; stub it for unit tests.
vi.mock("server-only", () => ({}));

import {
  bindChat,
  deleteBinding,
  getBinding,
  getCodeByChat,
  isCode,
  issueLinkCode,
  linkExpired,
} from "@/lib/notify/store";

describe("link codes", () => {
  it("issues a well-formed code that starts unlinked", async () => {
    const { code } = await issueLinkCode();
    expect(isCode(code)).toBe(true);
    const b = await getBinding(code);
    expect(b?.chatId).toBeUndefined();
    expect(linkExpired(b!)).toBe(false);
    await deleteBinding(code);
  });

  it("binds a chat, resolves it back, and unbinds cleanly", async () => {
    const { code } = await issueLinkCode();
    const bound = await bindChat(code, "chat-7");
    expect(bound?.chatId).toBe("chat-7");
    expect(await getCodeByChat("chat-7")).toBe(code);
    await deleteBinding(code);
    expect(await getBinding(code)).toBeNull();
    expect(await getCodeByChat("chat-7")).toBeNull();
  });

  it("rejects binding with an unknown or expired code", async () => {
    expect(await bindChat("ZZZZZZ", "chat-1")).toBeNull();
    const { code } = await issueLinkCode();
    const b = (await getBinding(code))!;
    expect(linkExpired({ ...b, createdAt: Date.now() - 11 * 60 * 1000 })).toBe(true);
    // bound codes never expire
    expect(linkExpired({ ...b, chatId: "c", createdAt: Date.now() - 99 * 60 * 1000 })).toBe(false);
    await deleteBinding(code);
  });

  it("unlink is idempotent", async () => {
    await deleteBinding("QQQQQQ");
  });
});
