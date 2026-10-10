import { z } from "zod";

/** 11-char YouTube video ID: letters, digits, underscore, hyphen. */
export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Hosts a built video link may point at. Exact match only. */
export const ALLOWED_VIDEO_HOSTS = ["www.youtube.com", "youtube.com", "youtu.be"] as const;
export type AllowedVideoHost = (typeof ALLOWED_VIDEO_HOSTS)[number];

export const VideoResourceSchema = z.object({
  id: z.string().regex(VIDEO_ID_RE),
  title: z.string().min(4).max(120),
  channelId: z.string().min(1),
  startAt: z.number().int().min(0),
  lengthSec: z.number().int().positive(),
  sizeMB: z.number().positive(),
  tags: z.array(z.string()).default([]),
});
export type VideoResource = z.infer<typeof VideoResourceSchema>;

export const ChannelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80),
});
export type Channel = z.infer<typeof ChannelSchema>;

/** Student picks 1 to 7 preferred teacher channels. */
export const PreferredChannelsSchema = z.array(z.string().min(1)).min(1).max(7);

/** Per-video Samajh-aaya reply: 1 yes, 2 thoda, 3 nahi. Reorder-only. */
export const VideoFeedbackSchema = z.record(
  z.string(),
  z.union([z.literal(1), z.literal(2), z.literal(3)]),
);
export type VideoFeedback = z.infer<typeof VideoFeedbackSchema>;

export interface RankInput {
  tag: string | null;
  preferred: string[];
  feedback: Record<string, 1 | 2 | 3>;
}

/**
 * Deterministic order for curated videos: attempt-tag match (4),
 * preferred teacher (2), yes-reply lift (1), nahi-reply drop (-1).
 * Ties keep catalog order. At most 2 out. Scores stay internal.
 */
export function rankVideos(all: VideoResource[], input: RankInput): VideoResource[] {
  const score = (v: VideoResource): number =>
    (input.tag !== null && v.tags.includes(input.tag) ? 4 : 0) +
    (input.preferred.includes(v.channelId) ? 2 : 0) +
    (input.feedback[v.id] === 1 ? 1 : input.feedback[v.id] === 3 ? -1 : 0);
  return [...all]
    .map((v, i) => ({ v, i, s: score(v) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((e) => e.v)
    .slice(0, 2);
}

/** Build the single watch URL form from an allowlisted ID. Throws otherwise. */
export function buildVideoUrl(id: string, startAt: number): string {
  if (!VIDEO_ID_RE.test(id)) throw new Error("unallowlisted video id");
  const t = Math.max(0, Math.floor(startAt));
  return `https://www.youtube.com/watch?v=${id}&t=${t}s`;
}

/** Whether the given curated entry list has anything to show. */
export function hasCuratedVideos(list: VideoResource[]): boolean {
  return list.length > 0;
}

export type RepairSection = "contrast" | "check" | "read" | "video";

/** Section default: video last when curated videos exist and data is standard. */
export function defaultRepairOrder(hasVideo: boolean, lowData: boolean): RepairSection[] {
  return hasVideo && !lowData
    ? ["contrast", "check", "read", "video"]
    : ["contrast", "check", "read"];
}

/**
 * One honest deterministic caption: shown-of-curated counts plus
 * which inputs applied. Fixed phrases only, no outcome claims.
 */
export function videoTraceLine(
  rankedCount: number,
  curatedCount: number,
  matchedAttempt: boolean,
  matchedTeacher: boolean,
  matchedChoice: boolean,
): string {
  const reasons: string[] = [];
  if (matchedAttempt) reasons.push("matched to your attempt");
  if (matchedTeacher) reasons.push("preferred teacher");
  if (matchedChoice) reasons.push("your earlier choice");
  const base = `Showing ${rankedCount} of ${curatedCount} reviewed videos`;
  return reasons.length > 0 ? `${base}, ${reasons.join(", ")}.` : `${base}.`;
}
