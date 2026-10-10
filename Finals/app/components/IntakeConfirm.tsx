"use client";
import { GRAPH, LIVE_NODES } from "@/content/graph";
import type { NodeId } from "@/lib/types";
import type { AiStatus, Analysis } from "@/lib/analyze-client";

const AI_NOTE: Record<AiStatus, string | null> = {
  used: null,
  not_requested: null,
  rate_limited: "The AI is busy right now, so this match uses keywords only.",
  failed: "The AI could not give a usable answer (check your API key and model in Settings), so this match uses keywords only.",
};

/** Second half of the intake flow: show what we read, where it belongs, and why. */
export function IntakeConfirm({ analysis: a, preview, text, onMapped, onSkip, onEdit }: {
  analysis: Analysis; preview: string | null; text: string;
  onMapped: (n: NodeId) => void; onSkip: () => void; onEdit: () => void;
}) {
  const agentNode = a.agent?.nodeId && a.agent.nodeId in GRAPH ? a.agent.nodeId : null;
  const chosen: NodeId | null = agentNode ?? a.match.node;
  const note = a.aiStatus ? AI_NOTE[a.aiStatus] : null;
  const options: NodeId[] = [...new Set<NodeId>([
    ...(agentNode ? [agentNode] : []),
    ...a.candidates.map((c) => c.node),
    ...LIVE_NODES,
  ])].slice(0, 6);
  return (
    <div>
      {preview && <img src={preview} alt="Your question" className="intake-photo" />}
      {text && (
        <details className="review-panel">
          <summary>What I read ({text.length} characters)</summary>
          <div className="review-body">
            <p style={{display:"block", whiteSpace:"pre-wrap"}}>{text}</p>
            <button onClick={onEdit} className="edit-link">Edit the text</button>
          </div>
        </details>
      )}

      <div className="match-panel">
        <p className="eyebrow">{agentNode ? "THE MENTOR (CLINE SDK) SUGGESTS" : "THIS QUESTION SEEMS TO BELONG TO"}</p>
        <h3>{chosen ? GRAPH[chosen].name : "Not sure yet"}</h3>
        <p className="match-reason">{agentNode ? a.agent?.reason : a.match.reason}</p>
        {a.agreed === false && (
          <p className="match-warn">
            The AI and the keyword match disagree. Please confirm the topic below.
          </p>
        )}
        {a.agent?.confidence === "low" && <p className="match-warn">The AI is not very sure. Please check the topic.</p>}
        {note && <p className="match-warn">{note}</p>}
        {a.match.evidence.length > 0 && <p className="match-evidence">Keyword match: {a.match.evidence.join(" · ")}</p>}
      </div>

      <div className="candidate-row">
        <h3>Not right? Choose another topic</h3>
        <div className="choice-group">
          {options.map((n) => (
            <button key={n} onClick={() => onMapped(n)} aria-pressed={chosen === n}
              className="pill-button">
              {GRAPH[n].name}
            </button>
          ))}
        </div>
      </div>

      <div className="learning-actions">
        <button onClick={() => chosen && onMapped(chosen)} disabled={!chosen} className="button primary">
          Find the starting point from here
        </button>
      </div>
      <button onClick={onSkip} className="text-action">Not now</button>
    </div>
  );
}
