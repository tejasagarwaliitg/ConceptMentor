"use client";
import { ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";
import { GRAPH, connectionSummary } from "@/content/graph";
import { t } from "@/lib/copy";
import type { NodeId, Session, StudentSettings } from "@/lib/types";
import { VideoList } from "./VideoList";

interface Props {
  session: Session;
  onRepair: (node: NodeId) => void;
  onStuck: () => void;
  onDispute: () => void;
  onDone: () => void;
  settings: StudentSettings;
  tag: string | null;
}

/** One honest outcome per session (idea.md 5.5). Every outcome can be disputed. */
export function Outcome({ session, onRepair, onStuck, onDispute, onDone, settings, tag }: Props) {
  const c = t();
  const outcome = session.outcome!;
  const suspected = session.suspected;
  const notChecked = session.notChecked.filter((n) => session.probed[n] === undefined);

  const headline = (() => {
    const o = c.outcomes[outcome];
    if (outcome === "suspected_gap" && suspected && typeof o === "function") {
      const counts = connectionSummary(suspected);
      return o(GRAPH[suspected].name, counts.live, counts.comingNext);
    }
    return typeof o === "string" ? o : "";
  })();

  const seen = Object.entries(session.probed)
    .filter(([, r]) => r && r !== "untested")
    .map(([n, r]) => ({
      name: GRAPH[n as NodeId].name,
      tone: r === "no_difficulty_found" ? "mint" : r === "context_difficulty" ? "blue" : "gold",
      text:
        r === "no_difficulty_found"
          ? "No difficulty found in this check"
          : r === "context_difficulty"
            ? "The direct question was correct; the changed-context question was harder"
            : "This may be a useful place to start",
    }));

  return (
    <div className="learning-card outcome-card">
      <div className="question-top"><span>YOUR CHECK · WHAT WE FOUND</span><button onClick={onDone}><ArrowLeft size={12}/>{c.later}</button></div>
      <h2 className="outcome-headline">{headline}</h2>

      {seen.length > 0 && (
        <ul className="evidence-list">
          {seen.map((s) => (
            <li key={s.name}>
              <span className={`evidence-dot ${s.tone}`}/>
              <p className="evidence-text"><b>{s.name}</b>{s.text}</p>
            </li>
          ))}
        </ul>
      )}

      {notChecked.length > 0 && outcome === "suspected_gap" && (
        <p className="note-panel">
          Not checked in this session: {notChecked.map((n) => GRAPH[n].name).join(", ")}. These concepts remain unresolved.
        </p>
      )}

      {outcome !== "out_of_scope" && <VideoList node={suspected ?? session.entry} tag={tag} settings={settings} heading={suspected ? "A SHORT LESSON ON THIS CONCEPT" : "A SHORT LESSON ON THIS TOPIC"} />}

      <div className="learning-actions">
        {(outcome === "suspected_gap" || outcome === "below_coverage") && suspected && (
          <button onClick={() => onRepair(suspected)} className="button primary">
            Review this concept <ArrowRight size={16}/>
          </button>
        )}
        {(outcome === "no_prereq_weakness" || outcome === "student_disputed" || outcome === "inconclusive") && (
          <button onClick={onStuck} className="button primary">
            {c.stuckTitle} <ArrowRight size={16}/>
          </button>
        )}
        {outcome === "out_of_scope" && (
          <button onClick={onDone} className="button primary">
            Choose a chapter <ArrowRight size={16}/>
          </button>
        )}
        {outcome !== "student_disputed" && (
          <button onClick={onDispute} className="button secondary">
            <HelpCircle size={15}/> {c.dispute}
          </button>
        )}
      </div>
      <button onClick={onDone} className="text-action">{c.later}</button>
    </div>
  );
}
