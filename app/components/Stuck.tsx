"use client";
import { useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react";
import { GRAPH } from "@/content/graph";
import { STUCK_CARDS } from "@/content/repair";
import { t } from "@/lib/copy";
import type { NodeId, StudentSettings } from "@/lib/types";
import { VideoList } from "./VideoList";

interface Props {
  settings?: StudentSettings;
  node: NodeId;
  /** card suggested by the agent (validated in code) or null for the default order */
  suggested: "setup" | "calculation" | "interpretation" | null;
  onDone: () => void;
}

/** Guided review cards for no-difficulty-found and disputed outcomes (idea.md 6.3). */
export function Stuck({ node, suggested, onDone, settings }: Props) {
  const c = t();
  const cards = STUCK_CARDS[node] ?? [];
  const [pick, setPick] = useState<"setup" | "calculation" | "interpretation" | "dontknow" | null>(suggested);
  const [copied, setCopied] = useState(false);

  const card = cards.find((x) => x.id === pick);
  const summary = c.askTeacher(GRAPH[node].name);

  return (
    <div className="learning-card stuck-screen">
      <div className="question-top"><span>LET’S LOOK A LITTLE CLOSER</span><button onClick={onDone}><ArrowLeft size={12}/>{c.later}</button></div>
      <h2 className="outcome-headline">{c.stuckTitle}</h2>
      <div className="stuck-grid">
        {(["setup", "calculation", "interpretation"] as const).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={`stuck-choice ${pick === k ? "selected" : ""}`} aria-pressed={pick === k}>
            {c.stuckOptions[k]}
            {suggested === k && <small>suggested first</small>}
          </button>
        ))}
        <button onClick={() => setPick("dontknow")} className={`stuck-choice ${pick === "dontknow" ? "selected" : ""}`} aria-pressed={pick === "dontknow"}>
          {c.stuckOptions.dontKnow}
        </button>
      </div>

      {card && (
        <div className="stuck-card">
          <h3>{card.title}</h3>
          <ul>
            {card.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
      {pick && !card && pick !== "dontknow" && <p className="note-panel">This review card is not available for this concept yet.</p>}

      {pick === "dontknow" && (
        <div className="teacher-note">
          <p>Review a worked example in NCERT, or use this note to ask a teacher for help:</p>
          <p>
            <a className="ncert-link" href={GRAPH[node].ncertUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15}/><span>{GRAPH[node].ncert}</span>
            </a>
          </p>
          <blockquote>{summary}</blockquote>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(summary).then(() => setCopied(true)).catch(() => undefined);
            }}
            className="button secondary small"
          >
            {copied ? <><Check size={14}/> Copied</> : <><Copy size={14}/> Copy note</>}
          </button>
        </div>
      )}

      {settings && <VideoList node={node} tag={null} settings={settings} />}

      <div className="learning-actions">
        <button onClick={onDone} className="button primary">Done</button>
      </div>
    </div>
  );
}
