import { describe, expect, it } from "vitest";
import { containsBanned } from "@/lib/mentor/schemas";
import {
  ALLOWED_VIDEO_HOSTS,
  VideoResourceSchema,
  buildVideoUrl,
  defaultRepairOrder,
  hasCuratedVideos,
  rankVideos,
  videoTraceLine,
  type VideoResource,
} from "@/lib/videos";
import { CHANNELS, VIDEO_RESOURCES } from "@/content/resources";

function fixture(over: Partial<VideoResource> & { id: string }): VideoResource {
  return VideoResourceSchema.parse({
    title: "Sample resolution lesson",
    channelId: "physics-wallah",
    startAt: 0,
    lengthSec: 600,
    sizeMB: 5,
    tags: [],
    ...over,
  });
}

const vA = () =>
  fixture({ id: "AAAAAAAAAAA", title: "Alpha resolution lesson", tags: ["swapped_sin_cos"] });
const vB = () =>
  fixture({ id: "BBBBBBBBBBB", title: "Beta resolution lesson", channelId: "quantum-lab" });
const vC = () =>
  fixture({ id: "CCCCCCCCCCC", title: "Gamma resolution lesson", channelId: "allen" });

describe("video catalog", () => {
  it("has 15 channels with unique ids", () => {
    expect(CHANNELS).toHaveLength(15);
    expect(new Set(CHANNELS.map((c) => c.id)).size).toBe(15);
  });

  it("covers all 9 nodes with at most 2 entries each", () => {
    expect(Object.keys(VIDEO_RESOURCES)).toHaveLength(9);
    for (const list of Object.values(VIDEO_RESOURCES)) {
      expect(list.length).toBeLessThanOrEqual(2);
    }
    for (const node of ["projectile", "vec_comp", "trig", "vec_basics"] as const) {
      expect(VIDEO_RESOURCES[node]).toHaveLength(2);
    }
    for (const node of ["coordinates", "slope", "deriv_rate", "motion_graphs", "kin_1d"] as const) {
      expect(VIDEO_RESOURCES[node]).toHaveLength(0);
    }
  });

  it("every entry parses, starts before it ends, and links to an allowlisted host", () => {
    const channelIds = new Set(CHANNELS.map((c) => c.id));
    for (const [node, list] of Object.entries(VIDEO_RESOURCES)) {
      for (const v of list) {
        expect(VideoResourceSchema.safeParse(v).success, `${node}:${v.id}`).toBe(true);
        expect(v.startAt, `${node}:${v.id}`).toBeLessThan(v.lengthSec);
        expect(channelIds.has(v.channelId), `${node}:${v.id}`).toBe(true);
        const host = new URL(buildVideoUrl(v.id, v.startAt)).hostname;
        expect([...ALLOWED_VIDEO_HOSTS], `${node}:${v.id}`).toContain(host);
      }
    }
  });

  it("titles pass the wording bans", () => {
    for (const list of Object.values(VIDEO_RESOURCES)) {
      for (const v of list) {
        expect(containsBanned(v.title), v.title).toBe(false);
        expect(v.title.toLowerCase(), v.title).not.toMatch(
          /root cause|unblock|mastered|trick-user|rank|leaderboard|streak/,
        );
      }
    }
  });
});

describe("rankVideos", () => {
  it("attempt-tag match beats preferred teacher beats catalog default", () => {
    const first = rankVideos([vB(), vA()], {
      tag: "swapped_sin_cos",
      preferred: ["quantum-lab"],
      feedback: {},
    });
    expect(first.map((v) => v.id)).toEqual(["AAAAAAAAAAA", "BBBBBBBBBBB"]);

    const second = rankVideos([vC(), vB()], {
      tag: null,
      preferred: ["quantum-lab"],
      feedback: {},
    });
    expect(second.map((v) => v.id)).toEqual(["BBBBBBBBBBB", "CCCCCCCCCCC"]);
  });

  it("yes lifts an entry, nahi drops it, thoda leaves it", () => {
    const lifted = rankVideos([vA(), vB(), vC()], {
      tag: null,
      preferred: [],
      feedback: { CCCCCCCCCCC: 1 },
    });
    expect(lifted.map((v) => v.id)).toEqual(["CCCCCCCCCCC", "AAAAAAAAAAA"]);

    const dropped = rankVideos([vA(), vB(), vC()], {
      tag: null,
      preferred: [],
      feedback: { AAAAAAAAAAA: 3 },
    });
    expect(dropped.map((v) => v.id)).toEqual(["BBBBBBBBBBB", "CCCCCCCCCCC"]);

    const neutral = rankVideos([vA(), vB()], {
      tag: null,
      preferred: [],
      feedback: { AAAAAAAAAAA: 2 },
    });
    expect(neutral.map((v) => v.id)).toEqual(["AAAAAAAAAAA", "BBBBBBBBBBB"]);
  });

  it("ties keep catalog order and output never exceeds 2", () => {
    expect(
      rankVideos([vC(), vA()], { tag: null, preferred: [], feedback: {} }).map((v) => v.id),
    ).toEqual(["CCCCCCCCCCC", "AAAAAAAAAAA"]);
    expect(
      rankVideos([vA(), vB(), vC()], { tag: null, preferred: [], feedback: {} }),
    ).toHaveLength(2);
  });
});

describe("repair section defaults", () => {
  it("shows video last only when curated videos exist and data is standard", () => {
    expect(defaultRepairOrder(true, false)).toEqual(["contrast", "check", "read", "video"]);
    expect(defaultRepairOrder(true, true)).toEqual(["contrast", "check", "read"]);
    expect(defaultRepairOrder(false, false)).toEqual(["contrast", "check", "read"]);
    expect(defaultRepairOrder(false, true)).toEqual(["contrast", "check", "read"]);
  });

  it("hasCuratedVideos is false on empty lists", () => {
    expect(hasCuratedVideos([])).toBe(false);
    expect(hasCuratedVideos(VIDEO_RESOURCES.trig)).toBe(true);
    expect(hasCuratedVideos(VIDEO_RESOURCES.slope)).toBe(false);
  });
});

describe("videoTraceLine", () => {
  it("names counts and passes the wording bans", () => {
    const line = videoTraceLine(2, 3, true, true, true);
    expect(line).toContain("2");
    expect(line).toContain("3");
    expect(containsBanned(line), line).toBe(false);
    expect(line.toLowerCase(), line).not.toMatch(
      /root cause|unblock|mastered|trick-user|rank|leaderboard|streak/,
    );
  });
});
