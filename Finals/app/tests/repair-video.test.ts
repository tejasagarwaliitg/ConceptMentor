import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Repair } from "@/components/Repair";
import { initialState } from "@/lib/state";
import type { NodeId, Session } from "@/lib/types";

const session = { entry: "vec_comp", probed: {}, answers: [], repairAttempts: {} } as unknown as Session;
const html = (node: NodeId, lowData = false, tag: string | null = null) =>
  renderToStaticMarkup(createElement(Repair, {
    node, session, tag, order: null, exclude: [],
    settings: { ...initialState().settings, lowData },
    onGraded: () => {}, onFlag: () => {}, onFeedback: () => {}, onDone: () => {},
  }));

describe("Repair shows curated videos", () => {
  it("shows at most 2 reviewed videos with safe YouTube links and metadata", () => {
    const h = html("vec_comp");
    expect((h.match(/class="video-card"/g) ?? []).length).toBe(2);
    expect(h).toContain("https://www.youtube.com/watch?v=");
    expect(h).toContain('target="_blank"');
    expect(h).toContain("noopener noreferrer");
    expect(h).toContain("nothing plays automatically");
    expect(h).not.toMatch(/autoplay|<iframe/i);
  });
  it("ranks the video matching the attempt tag first", () => {
    const h = html("vec_comp", false, "cos_always_for_x");
    expect(h.indexOf("Kt3Xeno6Jks")).toBeLessThan(h.indexOf("aeMhFD4No3M"));
  });
  it("low data hides videos", () => {
    expect(html("vec_comp", true)).not.toContain("youtube.com");
  });
  it("low-data mode retains the NCERT fallback for foundation topics", () => {
    const h = html("slope", true);
    expect(h).not.toContain("youtube.com");
    expect(h).toContain("ncert");
  });
});
