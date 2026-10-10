import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The mentor module imports the Cline SDK; stub it so these tests never touch the network.
const suggest = vi.fn();
vi.mock("@/lib/mentor/run", () => ({ suggestEntryNode: (...a: unknown[]) => suggest(...a) }));

import { POST } from "@/app/api/analyze/route";
import { resetGuardsForTests } from "@/lib/guards";

const post = (body: unknown) =>
  POST(new Request("http://x/api/analyze", { method: "POST", body: JSON.stringify(body) }));

const PROJECTILE = "A ball is thrown at an angle of 30 degrees. Find the maximum height and time of flight of the projectile.";

const AI = { provider: "nvidia", apiKey: "nvapi-test-key-123", model: "nvidia/some-model", vision: true };

beforeEach(() => {
  resetGuardsForTests();
  suggest.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("/api/analyze (photo -> node)", () => {
  it("rejects a body with neither text nor image", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ text: "   " })).status).toBe(400);
  });

  it("works with no key at all: keyword match, aiStatus not_requested, agent never called", async () => {
    const j = await (await post({ text: PROJECTILE })).json();
    expect(j.match.node).toBe("projectile");
    expect(j.aiStatus).toBe("not_requested");
    expect(j.agent).toBeNull();
    expect(j.agreed).toBeNull();
    expect(suggest).not.toHaveBeenCalled();
  });

  it("does NOT need an 18+ confirmation or an access code", async () => {
    suggest.mockResolvedValue({ ok: true, value: { nodeId: "projectile", reason: "It is a projectile question.", confidence: "high" }, trace: [] });
    const j = await (await post({ text: PROJECTILE, ai: AI })).json();
    expect(j.aiStatus).toBe("used");
  });

  it("safety gate answers before anything else", async () => {
    const j = await (await post({ text: "i want to die, this projectile question", ai: AI })).json();
    expect(j.safety).toBe("distress");
    expect(suggest).not.toHaveBeenCalled();
  });

  it("uses the student's own key with the provider's allowlisted base URL, never one from the client", async () => {
    suggest.mockResolvedValue({ ok: false, value: null, consequence: "fallback", trace: [] });
    await post({ text: PROJECTILE, ai: { ...AI, baseUrl: "http://169.254.169.254/" } });
    const cfg = suggest.mock.calls[0][4];
    expect(cfg.apiKey).toBe(AI.apiKey);
    expect(cfg.model).toBe(AI.model);
    expect(cfg.baseUrl).toBe("https://integrate.api.nvidia.com/v1");
  });

  it("rejects an unknown provider, a too-short key and a model name with unsafe characters", async () => {
    expect((await post({ text: PROJECTILE, ai: { ...AI, provider: "evil" } })).status).toBe(400);
    expect((await post({ text: PROJECTILE, ai: { ...AI, apiKey: "x" } })).status).toBe(400);
    expect((await post({ text: PROJECTILE, ai: { ...AI, model: "a b;rm -rf" } })).status).toBe(400);
    expect(suggest).not.toHaveBeenCalled();
  });

  it("never returns the key in the response", async () => {
    suggest.mockResolvedValue({ ok: true, value: { nodeId: "projectile", reason: "A projectile question.", confidence: "high" }, trace: [] });
    const raw = await (await post({ text: PROJECTILE, ai: AI })).text();
    expect(raw).not.toContain(AI.apiKey);
  });

  it("agent runs with the photo, result returned, and a disagreement with the matcher is reported", async () => {
    suggest.mockResolvedValue({
      ok: true,
      value: { nodeId: "vec_comp", reason: "It asks to resolve the velocity into components.", confidence: "high" },
      trace: [{ at: 1, kind: "tool_call", tool: "propose_entry_node", detail: "{}" }],
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    const img = "data:image/jpeg;base64,AAAA";
    const j = await (await post({ text: PROJECTILE, image: img, ai: AI })).json();
    expect(suggest).toHaveBeenCalledTimes(1);
    expect(suggest.mock.calls[0][2]).toBe(img);
    expect(j.aiStatus).toBe("used");
    expect(j.agent.nodeId).toBe("vec_comp");
    expect(j.agreed).toBe(false);
    expect(j.trace).toHaveLength(1);
  });

  it("text-only AI call is limited to the matcher's candidates; failure falls back honestly", async () => {
    suggest.mockResolvedValue({ ok: false, value: null, consequence: "fallback", trace: [] });
    const j = await (await post({ text: PROJECTILE, ai: AI })).json();
    const allowed = suggest.mock.calls[0][3] as string[];
    expect(allowed).toContain("projectile");
    expect(allowed.length).toBeLessThan(9);
    expect(j.aiStatus).toBe("failed");
    expect(j.agent).toBeNull();
    expect(j.match.node).toBe("projectile");
  });

  it("photo with unreadable OCR (empty text) still reaches the agent, with every live node allowed", async () => {
    suggest.mockResolvedValue({
      ok: true,
      value: { nodeId: "slope", reason: "The photo shows a line graph asking for gradient.", confidence: "low" },
      trace: [],
    });
    const j = await (await post({ text: "", image: "data:image/jpeg;base64,AAAA", ai: AI })).json();
    expect((suggest.mock.calls[0][3] as string[]).length).toBe(9);
    expect(j.agent.nodeId).toBe("slope");
    expect(j.match.node).toBeNull();
    expect(j.agreed).toBeNull();
  });
});
