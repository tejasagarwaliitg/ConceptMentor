import { beforeEach, describe, expect, it } from "vitest";
import { MODEL_PATTERN, PROVIDERS, defaultSettings } from "@/lib/ai-providers";
import { clearAiSettings, loadAiSettings, maskKey, saveAiSettings } from "@/lib/ai-settings";

// Minimal in-memory Storage so the browser-only module can run under vitest's node environment.
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  keys() { return [...this.m.keys()]; }
}
let local: MemStorage;
let session: MemStorage;
beforeEach(() => {
  local = new MemStorage();
  session = new MemStorage();
  (globalThis as unknown as { window: unknown }).window = { localStorage: local, sessionStorage: session };
});

const good = { ...defaultSettings("nvidia"), apiKey: "nvapi-abcdefghij123456" };

describe("AI key storage (Settings -> AI mentor)", () => {
  it("saves and loads per profile, independently", () => {
    expect(saveAiSettings("p-1", good)).toBe(true);
    expect(loadAiSettings("p-1")).toEqual(good);
    expect(loadAiSettings("p-2")).toBeNull();
  });

  it("guest mode uses sessionStorage, signed-in profiles use localStorage", () => {
    saveAiSettings(null, good);
    saveAiSettings("p-1", good);
    expect(session.keys()).toEqual(["kadi.ai.v1:guest"]);
    expect(local.keys()).toEqual(["kadi.ai.v1:p-1"]);
  });

  it("clear removes only that owner's key", () => {
    saveAiSettings("p-1", good);
    saveAiSettings("p-2", good);
    clearAiSettings("p-1");
    expect(loadAiSettings("p-1")).toBeNull();
    expect(loadAiSettings("p-2")).not.toBeNull();
  });

  it("refuses to save an invalid key or model, and ignores tampered stored data", () => {
    expect(saveAiSettings("p-1", { ...good, apiKey: "short" })).toBe(false);
    expect(saveAiSettings("p-1", { ...good, model: "bad model!" })).toBe(false);
    local.setItem("kadi.ai.v1:p-1", JSON.stringify({ provider: "evil", apiKey: "x".repeat(20), model: "m", vision: true }));
    expect(loadAiSettings("p-1")).toBeNull();
    local.setItem("kadi.ai.v1:p-1", "{not json");
    expect(loadAiSettings("p-1")).toBeNull();
  });

  it("the key is never part of the profile store or progress export key", () => {
    saveAiSettings("p-1", good);
    expect(local.keys().every((k) => k.startsWith("kadi.ai.v1:"))).toBe(true);
  });

  it("masks the key for display", () => {
    const m = maskKey(good.apiKey);
    expect(m).not.toContain("abcdefghij");
    expect(m.startsWith("nvapi")).toBe(true);
    expect(maskKey("short")).toBe("••••••••");
  });

  it("provider presets use https and the default models are valid", () => {
    for (const p of Object.values(PROVIDERS)) {
      expect(p.baseUrl.startsWith("https://")).toBe(true);
      expect(MODEL_PATTERN.test(p.defaultModel)).toBe(true);
    }
  });
});
