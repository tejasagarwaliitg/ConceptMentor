import { describe, expect, it } from "vitest";
import { backend } from "@/lib/qbank/agent";
import { processChunk } from "@/lib/qbank/pipeline";
import { emptyBank } from "@/lib/qbank/store";
import { CHUNK, extractor, paper, raw } from "./qbank-fixtures";

describe("backend selection", () => {
  it("uses NVIDIA NIM when its key is set", () => {
    const b = backend({ NIM_API_KEY: "k" });
    expect(b.name).toBe("nim");
    expect(b.baseUrl).toBe("https://integrate.api.nvidia.com/v1");
    expect(b.models.length).toBeGreaterThan(1);
  });
  it("NIM wins over Gemini unless QBANK_PROVIDER says otherwise", () => {
    expect(backend({ NIM_API_KEY: "a", QBANK_API_KEY: "b" }).name).toBe("nim");
    const g = backend({ NIM_API_KEY: "a", QBANK_API_KEY: "b", QBANK_PROVIDER: "gemini", QBANK_MODEL: "m1,m2" });
    expect(g.name).toBe("gemini");
    expect(g.models).toEqual(["m1", "m2"]);
  });
  it("honours NIM_MODEL overrides", () => {
    expect(backend({ NIM_API_KEY: "k", NIM_MODEL: "x/y" }).models).toEqual(["x/y"]);
  });
  it("falls back to Cline when nothing else is configured", () => {
    expect(backend({}).name).toBe("cline");
  });
});

describe("the two blind solves are separate calls with different variants", () => {
  it("asks variant 0 and variant 1", async () => {
    const variants: (number | undefined)[] = [];
    await processChunk(emptyBank(), paper, 0, CHUNK, {
      extract: extractor([raw()]),
      solve: async (_s, _o, v) => { variants.push(v); return { value: { kind: "single", answerIndex: 2, derivation: "worked" } }; },
    });
    expect(variants.sort()).toEqual([0, 1]);
  });
});
