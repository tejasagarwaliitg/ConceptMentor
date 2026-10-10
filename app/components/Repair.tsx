"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Info, Lightbulb, RefreshCw } from "lucide-react";
import { GRAPH } from "@/content/graph";
import { CONTRASTS, READ_INSTEAD } from "@/content/repair";
import { t } from "@/lib/copy";
import { repairExhausted } from "@/lib/engine";
import type { GradedAnswer, NodeId, Session, StudentSettings } from "@/lib/types";
import { VIDEO_RESOURCES } from "@/content/resources";
import { VideoList } from "./VideoList";
import { Question } from "./Question";

type Part = "options" | "reasoning" | "apply" | "result";

interface Props {
  exclude?: string[];
  node: NodeId;
  session: Session;
  settings: StudentSettings;
  /** candidate tag from the probe, if any (a hint, not proof) */
  tag: string | null;
  /** options order suggested by the agent (validated); null = default */
  order: ("contrast" | "check" | "read" | "video")[] | null;
  onGraded: (a: GradedAnswer) => void;
  onFlag: (id: string) => void;
  onPresented?: (id: string) => void;
  onFeedback?: (videoId: string, v: 1 | 2 | 3) => void;
  onDone: () => void;
}

/**
 * Repair (idea.md 6.2 step 5): contrast first, then the immediate check as the primary action.
 * Reading is always available; optional videos never play automatically.
 */
export function Repair({ node, session, settings, tag, order, exclude = [], onGraded, onFlag, onPresented, onFeedback, onDone }: Props) {
  const c = t();
  const [part, setPart] = useState<Part>("options");
  const [verdict, setVerdict] = useState<{ correct: boolean | null; text?: string } | null>(null);
  const exhausted = repairExhausted(session, node);
  const contrast = tag ? CONTRASTS[tag] : undefined;
  const read = READ_INSTEAD[node];
  const sections = order ?? ["contrast", "check", "read", "video"];
  const videos = <VideoList node={node} tag={tag} settings={settings} onFeedback={onFeedback} />;
  const hasVideos = !settings.lowData && (VIDEO_RESOURCES[node] ?? []).length > 0;

  if (part === "reasoning" || part === "apply") {
    return (
      <Question
        node={node}
        type={part === "reasoning" ? "R" : "B2"}
        exclude={exclude}
        onPresented={onPresented}
        progress={part === "reasoning" ? "Reasoning check" : "Apply the idea"}
        onGraded={(a, info) => {
          onGraded(a);
          if (a.correct === null) return;
          if (part === "reasoning") {
            // reasoning item is evidence-bearing for the check only together with the apply item
            setPart("apply");
          } else {
            setVerdict({ correct: a.correct, text: info.correctText });
            setPart("result");
          }
        }}
        onUnavailable={() => {
          // no reasoning item for this node: skip straight to apply; no apply item: honest exit
          if (part === "reasoning") setPart("apply");
          else {
            setVerdict({ correct: null });
            setPart("result");
          }
        }}
        onLater={onDone}
        onFlag={onFlag}
      />
    );
  }

  if (part === "result" && verdict) {
    return (
      <div className="learning-card result-card">
        <div className="question-top"><span>ONE CONCEPT AT A TIME</span><button onClick={onDone}><ArrowLeft size={12}/>{c.later}</button></div>
        {verdict.correct === true && (
          <>
            <span className="result-icon pass"><Check size={22}/></span>
            <h2>{c.immediatePassed}</h2>
            <p className="note-panel">A review is scheduled for tomorrow. It will use a fresh question when one is available in the bank.</p>
          </>
        )}
        {verdict.correct === false && (
          <>
            <span className="result-icon retry"><RefreshCw size={22}/></span>
            <h2>This attempt was not correct. That is useful information.</h2>
            {verdict.text && <p className="note-panel">Correct answer: {verdict.text}</p>}
            <p className="note-panel">
              {exhausted ? "We will return to this later." : "Review another explanation. A different question will be used if one is available."}
            </p>
          </>
        )}
        {verdict.correct === null && (
          <>
            <span className="result-icon info"><Info size={22}/></span>
            <h2>A new question for this check is not available yet. You can review the explanation below.</h2>
          </>
        )}
        {videos}
        <div className="learning-actions">
          {verdict.correct === false && !exhausted && (
            <button onClick={() => setPart("options")} className="button primary">
              Review and try again <ArrowRight size={16}/>
            </button>
          )}
          <button onClick={onDone} className="button secondary">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-card repair-card">
      <div className="question-top"><span>ONE CONCEPT AT A TIME</span><button onClick={onDone}><ArrowLeft size={12}/>{c.later}</button></div>
      <h2 className="outcome-headline">{GRAPH[node].name}</h2>
      {sections.map((s) => {
        if (s === "contrast" && contrast)
          return (
            <p key={s} className="contrast-note">
              <Lightbulb size={16}/>
              <span>{contrast}</span>
            </p>
          );
        if (s === "check" && !exhausted)
          return (
            <button key={s} onClick={() => setPart("reasoning")} className="button primary repair-cta">
              {c.checkNow} <ArrowRight size={16}/>
            </button>
          );
        return null;
      })}

      {sections.includes("video") && videos}

      <details className="review-panel">
        <summary>{c.moreOptions}</summary>
        <div className="review-body">
          {read && (
            <div>
              <b>{c.readInstead}</b>
              <ul>
                {read.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}
          <a className="ncert-link" href={GRAPH[node].ncertUrl} target="_blank" rel="noopener noreferrer">
            <BookOpen size={17}/><span>Read the NCERT reference<small>{GRAPH[node].ncert}</small></span><ArrowRight size={14}/>
          </a>
          {!settings.lowData && !hasVideos && <p>No reviewed videos for this concept yet. Read the NCERT section above.</p>}
        </div>
      </details>
    </div>
  );
}
