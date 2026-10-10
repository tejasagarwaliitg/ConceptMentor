"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { GRAPH, LIVE_NODES } from "@/content/graph";
import { LEVELS, type Level } from "@/lib/qbank/types";
import {
  fetchCoverage, fetchPractice, gradePractice, loadSeen, markSeen,
  type PracticeGrade, type PracticeQuestion,
} from "@/lib/qbank/client";
import type { NodeId } from "@/lib/types";
import { Rich } from "./Math";

const LEVEL_INFO: Record<Level, { title: string; text: string; source: string }> = {
  A: { title: "Level A", text: "One idea, a couple of steps. JEE Main style.", source: "JEE Main papers" },
  B: { title: "Level B", text: "Changed context or two ideas together.", source: "JEE Advanced and harder sources" },
  C: { title: "Level C", text: "Several ideas, many steps. Advanced and Irodov-class.", source: "JEE Advanced and harder sources" },
};

export function Practice({ onBack, initialNode, historyScope = "device" }: { onBack: () => void; initialNode?: NodeId; historyScope?: string }) {
  const [node, setNode] = useState<NodeId>(initialNode ?? "projectile");
  const [level, setLevel] = useState<Level>("A");
  const [cov, setCov] = useState<Record<string, Record<Level, number>> | null>(null);
  const [q, setQ] = useState<PracticeQuestion | null>(null);
  const [chosen, setChosen] = useState<number[]>([]);
  const [value, setValue] = useState("");
  const [grade, setGrade] = useState<PracticeGrade | null>(null);
  const [state, setState] = useState<"pick" | "loading" | "question" | "empty" | "exhausted" | "error">("pick");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState({ right: 0, total: 0 });

  useEffect(() => { fetchCoverage().then((coverage) => {
    setCov(coverage);
    if (!initialNode && coverage) {
      for (const topic of LIVE_NODES) {
        const available = LEVELS.find((l) => (coverage[topic]?.[l] ?? 0) > 0);
        if (available) { setNode(topic); setLevel(available); break; }
      }
    }
  }); }, [initialNode]);

  async function next(n = node, l = level) {
    setState("loading"); setChosen([]); setValue(""); setGrade(null);
    const r = await fetchPractice(n, l, loadSeen(historyScope));
    if (r.ok) { markSeen(r.q.id, historyScope); setQ(r.q); setState("question"); }
    else setState(r.reason === "pool_exhausted" ? "exhausted" : r.reason === "network" ? "error" : "empty");
  }

  function toggle(i: number) {
    if (grade) return;
    setChosen((c) => (q?.kind === "multi" ? c.includes(i) ? c.filter((x) => x !== i) : [...c, i] : [i]));
  }

  async function submit(picked: number[], numeric?: number) {
    if (!q || busy) return;
    setBusy(true);
    const g = await gradePractice(q.token, picked, numeric);
    setBusy(false);
    if (!g) return setState("error");
    setGrade(g);
    setDone((d) => ({ right: d.right + (g.correct ? 1 : 0), total: d.total + 1 }));
  }

  const count = (n: NodeId, l: Level) => cov?.[n]?.[l] ?? 0;
  const kindLabel = q && q.kind !== "single" ? (q.kind === "multi" ? "one or more correct" : "enter the value") : null;

  if (state === "pick") return <div className="learning-card practice-card">
    <div className="question-top"><span>PRACTICE · FRESH QUESTIONS</span><button onClick={onBack}><ArrowLeft size={12}/>Back</button></div>
    <h1 className="practice-title">Pick a topic and a level.</h1>
    <p className="practice-intro">Questions come from the bank. Your profile remembers the questions you have already seen.</p>
    <label className="practice-label" htmlFor="pr-node">Topic</label>
    <select id="pr-node" className="practice-select" value={node} onChange={(e) => setNode(e.target.value as NodeId)}>
      {LIVE_NODES.map((n) => <option key={n} value={n}>{GRAPH[n].name}</option>)}
    </select>
    <div className="level-grid" role="radiogroup" aria-label="Level">
      {LEVELS.map((l) => <button key={l} role="radio" aria-checked={level === l} className={`level-card ${level === l ? "chosen" : ""}`} onClick={() => setLevel(l)}>
        <span className="level-letter">{l}</span>
        <b>{LEVEL_INFO[l].title}</b>
        <span>{LEVEL_INFO[l].text}</span>
        <em>{LEVEL_INFO[l].source}</em>
        <i className={count(node, l) ? "has" : "none"}>{cov ? `${count(node, l)} available` : "…"}</i>
      </button>)}
    </div>
    <button className="button primary repair-cta" onClick={() => next()}>Start practice <ArrowRight size={16}/></button>
  </div>;

  if (state === "loading") return <div className="learning-card loading-card" role="status"><span className="loading-orbit"/>Finding a fresh question…</div>;

  if (state !== "question" || !q) {
    const msg = state === "exhausted" ? "You have seen every question we have for this topic and level."
      : state === "error" ? "The question could not load. Check your connection and try again."
      : "No reviewed questions for this topic and level yet.";
    return <div className="learning-card unavailable-card">
      <p className="eyebrow">{state === "exhausted" ? "ALL DONE HERE" : "NOTHING TO SHOW"}</p>
      <h1>{msg}</h1>
      <p>{state === "exhausted" ? "Try another level or topic. Fresh questions become available when reviewed entries are added to the bank." : "Questions only appear after they have been checked. Try another level or topic."}</p>
      <button className="button primary" onClick={() => setState("pick")}><ArrowLeft size={16}/> Choose again</button>
    </div>;
  }

  return <div className="learning-card question-card">
    <div className="question-top"><span>{done.total ? `${done.right} of ${done.total} correct` : "First question"}</span><button onClick={() => setState("pick")}><ArrowLeft size={12}/>Change topic</button></div>
    <p className="question-concept">{GRAPH[q.node].name} <span className={`level-pill l${q.level}`}>Level {q.level}</span>{kindLabel && <span className="level-pill">{kindLabel}</span>}</p>
    <h1 className="question-stem"><Rich text={q.stem}/></h1>

    {q.kind !== "numeric" && <div className="answer-options" role="group" aria-label="Answer choices">
      {q.options.map((o, i) => {
        const picked = chosen.includes(i);
        const right = grade ? grade.correctIndexes.includes(i) : false;
        const cls = grade ? (right ? "right" : picked ? "wrong" : "") : picked ? "chosen" : "";
        return <button key={i} disabled={busy || !!grade} aria-pressed={picked} onClick={() => toggle(i)} className={`answer-option ${cls}`}>
          <span className="answer-letter">{String.fromCharCode(65 + i)}</span><Rich text={o}/>
          {grade && right && <Check size={15} className="answer-check"/>}
          {grade && picked && !right && <X size={15} className="answer-check"/>}
        </button>;
      })}
    </div>}

    {q.kind === "numeric" && <div className="numeric-row">
      <input className="numeric-input" type="number" step="any" inputMode="decimal" disabled={busy || !!grade}
        value={value} placeholder="Your answer" onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && value !== "" && !grade) submit([], Number(value)); }} />
      {q.unit && <span className="numeric-unit">{q.unit}</span>}
    </div>}

    {!grade && <div className="practice-actions">
      <button className="button primary" disabled={busy || (q.kind === "numeric" ? value === "" : chosen.length === 0)}
        onClick={() => submit(chosen, q.kind === "numeric" ? Number(value) : undefined)}>{busy ? "Checking…" : "Check answer"}</button>
      <button className="text-action" disabled={busy} onClick={() => submit([-1])}>I do not know</button>
    </div>}

    {grade && <div className={`note-panel practice-result ${grade.correct ? "pass" : "retry"}`}>
      <b>{grade.correct ? "Correct." : grade.dontKnow ? "That is fine. Here is the answer." : "Not this time."}</b>
      <p>Answer: {grade.correctText}</p>
      <p><Rich text={grade.derivation}/></p>
      <p className="practice-trust">{grade.verified === "approved" ? "Answer checked by a reviewer." : "Answer worked out and cross-checked by AI. It has not been reviewed by a teacher yet."}</p>
      <button className="button primary" onClick={() => next()}>Next fresh question <ArrowRight size={16}/></button>
    </div>}
    <p className="practice-source">Source: {q.source} · {q.unseenLeft} more unseen at this level</p>
  </div>;
}
