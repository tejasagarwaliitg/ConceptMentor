import { describe, expect, it } from "vitest";
import { withImage } from "@/lib/mentor/run";

describe("withImage (Cline SDK multimodal input)", () => {
  const img = "data:image/jpeg;base64,QUJD";

  it("returns the plain prompt when vision is off for the chosen model", () => {
    expect(withImage("p", img, false)).toBe("p");
  });

  it("returns the plain prompt when there is no image", () => {
    expect(withImage("p", undefined, true)).toBe("p");
  });

  it("returns the plain prompt for a non-image or malformed data URL", () => {
    expect(withImage("p", "data:text/html;base64,QUJD", true)).toBe("p");
    expect(withImage("p", "not a data url", true)).toBe("p");
  });

  it("builds an SDK AgentMessage with text + image parts (not OpenAI image_url)", () => {
    const out = withImage("p", img, true) as Array<{ role: string; id: unknown; createdAt: unknown; content: unknown }>;
    expect(Array.isArray(out)).toBe(true);
    expect(out[0].role).toBe("user");
    expect(typeof out[0].id).toBe("string");
    expect(typeof out[0].createdAt).toBe("number");
    expect(out[0].content).toEqual([
      { type: "text", text: "p" },
      { type: "image", image: "QUJD", mediaType: "image/jpeg" },
    ]);
    expect(JSON.stringify(out)).not.toContain("image_url");
  });
});
