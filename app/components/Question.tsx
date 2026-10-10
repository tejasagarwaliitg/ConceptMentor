"use client";
import { useEffect, useState } from "react";
import { DONT_KNOW, WORDING_VOID, type Confidence, type GradedAnswer } from "@/lib/types";
import { fetchItem, gradeAnswer, type Issued } from "@/lib/api";
import type { ItemType, NodeId } from "@/lib/types";
import { t } from "@/lib/copy";
import { Rich } from "./Math";
import { GRAPH } from "@/content/graph";
import { ArrowLeft, Check, Flag } from "lucide-react";

interface Props {
  node: NodeId;
  type: ItemType;
  progress?: string;
  exclude?: string[];
  onGraded: (a: GradedAnswer, info: { correctText?: string; tag?: string | null }) => void;
  onUnavailable: () => void;
  onLater: () => void;
  onFlag: (itemId: string) => void;
  onPresented?: (itemId: string) => void;
}

/** One item per screen. Choose -> confidence -> server grades. Never shows the answer before grading. */
export function Question(props: Props) { return <QuestionInstance key={`${props.node}-${props.type}`} {...props}/>; }
function QuestionInstance({ node, type, progress, exclude = [], onGraded, onUnavailable, onLater, onFlag, onPresented }: Props) {
  const c = t();
  const [issued, setIssued] = useState<Issued | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);

  const [excludeKey] = useState(() => exclude.join("|"));
  useEffect(() => {
    let alive = true;
    fetchItem(node, type, excludeKey ? excludeKey.split("|") : []).then((r) => {
      if (!alive) return;
      if (!r) onUnavailable();
      else {
        setIssued(r);
        onPresented?.(r.item.id);
      }
    }).catch(() => { if (alive) setError("The question could not load. Check your connection and try again."); });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, type, excludeKey]);

  async function submit(choice: number, confidence: Confidence) {
    if (!issued || busy) return;
    setBusy(true);
    setError(null);
    const res = await gradeAnswer(issued.instanceToken, choice, confidence).catch(() => ({ ok: false, answer: undefined, correctText: undefined, tag: undefined }));
    setBusy(false);
    if (!res.ok || !res.answer) {
      setError("Connection issue. Please try submitting again; your current progress is saved locally.");
      return;
    }
    onGraded(res.answer, { correctText: res.correctText, tag: res.tag });
  }

  if (!issued) return <div className="learning-card loading-card" role="status">{error ? <><p className="error-note">{error}</p><button className="button secondary" onClick={onLater}>Back to topics</button></> : <><span className="loading-orbit"/>Preparing your question…</>}</div>;

  return <div className="learning-card question-card">
    <div className="question-top"><span>{progress}</span><button onClick={onLater}><ArrowLeft size={12}/>{c.later}</button></div>
    <p className="question-concept">{GRAPH[node].name}</p>
    <h1 className="question-stem"><Rich text={issued.item.stem}/></h1>
    <div className="answer-options" role="group" aria-label="Answer choices">{issued.item.options.map((o,i) => <button key={i} disabled={busy} aria-pressed={chosen === i} onClick={() => setChosen(i)} className={`answer-option ${chosen === i ? "chosen" : ""}`}><span className="answer-letter">{String.fromCharCode(65+i)}</span><Rich text={o}/>{chosen === i && <Check size={15} className="answer-check"/>}</button>)}</div>
    <div className="answer-alternatives"><button disabled={busy} aria-pressed={chosen === DONT_KNOW} onClick={() => setChosen(DONT_KNOW)} className={chosen === DONT_KNOW ? "chosen" : ""}>{c.pataNahi}</button><button disabled={busy} onClick={() => submit(WORDING_VOID,"guess")}>{c.wordingVoid}</button></div>
    {chosen !== null && <div className="confidence-panel"><h3>How sure do you feel?</h3><p>It’s okay to be unsure. Choose one to submit your answer.</p><div className="confidence-buttons">{(["pakka","shayad","guess"] as Confidence[]).map(k => <button key={k} disabled={busy} onClick={() => submit(chosen,k)}>{busy ? "Checking…" : c[k]}</button>)}</div></div>}
    {error && <p className="error-note" role="alert">{error}</p>}
    <button className="question-report" disabled={flagged} onClick={() => { setFlagged(true); onFlag(issued.item.id); }}><Flag size={12}/>{flagged ? "Report saved on this device" : c.reportWrong}</button>
  </div>;
}
