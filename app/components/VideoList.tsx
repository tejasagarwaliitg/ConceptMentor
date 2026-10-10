"use client";
import { ArrowRight, PlayCircle } from "lucide-react";
import { CHANNELS, VIDEO_RESOURCES } from "@/content/resources";
import { buildVideoUrl, rankVideos, videoTraceLine } from "@/lib/videos";
import type { NodeId, StudentSettings } from "@/lib/types";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Up to 2 reviewed videos for a concept, ranked in code (tag -> teacher -> your earlier reply).
 * Links come only from the reviewed catalog. Nothing plays automatically. Renders nothing in low-data
 * mode or when the concept has no reviewed videos.
 */
export function VideoList({ node, tag, settings, heading = "WATCH A SHORT LESSON", onFeedback }: {
  node: NodeId; tag: string | null; settings: StudentSettings; heading?: string;
  onFeedback?: (videoId: string, v: 1 | 2 | 3) => void;
}) {
  const curated = VIDEO_RESOURCES[node] ?? [];
  const preferred = settings.preferredChannels ?? [];
  const feedback = settings.videoFeedback ?? {};
  const ranked = settings.lowData ? [] : rankVideos(curated, { tag, preferred, feedback });
  if (ranked.length === 0) return null;
  return (
    <div className="video-section">
      <p className="eyebrow"><PlayCircle size={13}/> {heading}</p>
      {ranked.map((v) => (
        <div key={v.id} className="video-card">
          <a className="ncert-link" href={buildVideoUrl(v.id, v.startAt)} target="_blank" rel="noopener noreferrer">
            <PlayCircle size={17}/>
            <span>{v.title}<small>{CHANNELS.find((c) => c.id === v.channelId)?.name ?? v.channelId} · {Math.round(v.lengthSec / 60)} min · {v.startAt > 0 ? `starts at ${clock(v.startAt)}` : "opens at the start"} · about {v.sizeMB} MB · nothing plays automatically</small></span>
            <ArrowRight size={14}/>
          </a>
          {onFeedback && (
            <span className="video-feedback">Did it make sense?
              {([[1, "Yes"], [2, "A little"], [3, "No"]] as const).map(([n, label]) => (
                <button key={n} aria-pressed={feedback[v.id] === n} onClick={() => onFeedback(v.id, n)} className="pill-button">{label}</button>
              ))}
            </span>
          )}
        </div>
      ))}
      <p className="match-evidence">{videoTraceLine(ranked.length, curated.length, tag !== null && ranked.some((v) => v.tags.includes(tag)), ranked.some((v) => preferred.includes(v.channelId)), ranked.some((v) => feedback[v.id] === 1))}</p>
    </div>
  );
}
