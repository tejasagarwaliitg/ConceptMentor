"use client";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Camera, ChevronRight, Clock3, Compass, GitBranch, MoveUpRight, Orbit, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { GRAPH, ENTRY_NODES, LIVE_NODES, type MapNodeId } from "@/content/graph";
import { dueNodes, thisWeek, levelQueueOf, isClearedState } from "@/lib/engine";
import type { NodeId, StudentState } from "@/lib/types";
import { GraphCanvas, CATEGORIES } from "./GraphCanvas";
import { DemoBadge } from "./DemoBadge";
import { evidenceLines, nodeChips, revisionLine } from "@/lib/observations";
interface Props {
  draftPreview: boolean; state: StudentState; guest: boolean; notice?: string | null; onGuest: (g: boolean) => void;
  onStart: (node: NodeId) => void; onRecheck: (node: NodeId) => void;
  onSimulate: (days: number) => void; onMap: () => void; onPractice: () => void; onSettings: () => void;
  profile: { displayName: string; classLabel?: string; targetExam?: string } | null; isDemo?: boolean;
  onSwitchProfile: () => void; onCommit: (node: NodeId, days: 1 | 3 | 7) => void; onIntake: () => void;
}
const TOPICS = {
  projectile: { icon: Orbit, title: "Projectile motion", text: "Connect launch angles, components and motion.", area: "MECHANICS", className: "mint" },
  kin_1d: { icon: MoveUpRight, title: "1D kinematics", text: "Make sense of motion along a straight line.", area: "MECHANICS", className: "blue" },
  motion_graphs: { icon: TrendingUp, title: "Motion graphs", text: "Read the story behind a position or velocity graph.", area: "GRAPHS & MOTION", className: "gold" },
  vec_comp: { icon: GitBranch, title: "Vector components", text: "Break a vector into parts that work together.", area: "VECTORS", className: "purple" },
};
export function Today({ state, draftPreview, guest, notice, onGuest, onStart, onRecheck, onSimulate, onMap, onSettings, profile, isDemo = false, onSwitchProfile, onCommit, onIntake }: Props) {
  const due = dueNodes(state), week = thisWeek(state);
  // "Check your level" cards = first 4 of the queue. A cleared (fixed/solved) node
  // leaves the queue; the topics it connects to / advances to join the back.
  const queue = levelQueueOf(state).filter((n) => !isClearedState(state.nodes[n]?.state));
  const cards = (queue.length ? queue : ENTRY_NODES).slice(0, 4);
  const chips = nodeChips(state), lines = evidenceLines(state);
  const detail = profile ? [profile.classLabel, profile.targetExam].filter(Boolean).join(" · ") : "";
  const [selected, setSelected] = useState<MapNodeId | null>(null);
  return <div className="overview page-width">
    <section className="student-welcome"><div><h2>{profile ? `Hi, ${profile.displayName}.` : "Welcome. Make yourself at home."}</h2><p>{detail ? `${detail} · ` : ""}A little understanding, one step at a time.</p>{isDemo && <DemoBadge />}</div><button className="text-button" onClick={onSwitchProfile}>Switch profile <ArrowRight size={15}/></button></section>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow hero-eyebrow"><span className="tiny-line"/> LET’S MAKE IT CLICK</div>
        <h1>A little clarity.<br/><em>A confident next step.</em></h1>
        <p className="hero-description">Sometimes a difficult chapter starts with an earlier concept. Let’s find a useful place to begin, one question at a time.</p>
        <div className="hero-actions"><button className="button primary" onClick={() => document.getElementById("choose-topic")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>Choose a chapter <ArrowRight size={17}/></button><button className="text-button" onClick={onMap}>Explore the map <ArrowUpRight size={16}/></button></div>
        <div className="mentor-note"><span className="mentor-avatar"><Compass size={19}/></span><p>A guide, at your pace.<br/><span>This is a digital mentor, not a person. It can be wrong.</span></p></div>
      </div>
      <div className="hero-map-card">
        <div className="panel-heading"><span><span className="status-dot"/> THE BIGGER PICTURE</span><button onClick={onMap} aria-label="Open full knowledge map"><ArrowUpRight size={17}/></button></div>
        <GraphCanvas ids={LIVE_NODES} state={state} selected={selected} onSelect={setSelected} preview/>
        <div className="preview-caption"><span><GitBranch size={15}/>{selected && selected in GRAPH ? GRAPH[selected as NodeId].name : "Explore the connections"}</span><button onClick={onMap}>View details <ChevronRight size={14}/></button></div>
        <div className="graph-legend">{selected ? <><span><i style={{background:"#3776bb"}}/>Prerequisites</span><span><i style={{background:"#a97219"}}/>Selected</span><span><i style={{background:"#15836c"}}/>Depends on this</span></> : Object.entries(CATEGORIES).map(([key, c]) => <span key={key}><i style={{ background: c.color }}/>{c.label}</span>)}</div>
      </div>
    </section>

    <div className="principles-strip"><span><ShieldCheck size={17}/> Private by default</span><span><GitBranch size={17}/> Connected concepts</span><span><BookOpen size={17}/> NCERT references</span><span><Clock3 size={17}/> Revisit, don’t just repeat</span></div>



    {notice && <section className="review-banner"><div><p>{notice}</p></div></section>}

    {due.length > 0 && <section className="review-banner"><div><span className="eyebrow">READY TO REVISIT</span><h2>A small check. A little more evidence.</h2><p>{revisionLine(state)}</p></div><div className="due-list">{due.slice(0, 3).map(n => <div key={n} className="due-row"><button onClick={() => onRecheck(n)}><Clock3 size={16}/>{GRAPH[n].name}<ArrowRight size={16}/></button><span className="commit-row"><span>Review in:</span>{([1, 3, 7] as const).map(d => <button key={d} onClick={() => onCommit(n, d)}>{d === 1 ? "1 day" : `${d} days`}</button>)}</span></div>)}</div></section>}

    <section id="choose-topic" className="topic-section">
      <div className="section-heading"><div><p className="eyebrow">TWO WAYS TO BEGIN</p><h2>What are you working on?</h2><p>Know your chapter, or have a question that went wrong? Either way we look at the ideas underneath.</p></div><span className="quiet-tag">Choose your starting point</span></div>
      <div className="door-grid">
        <div className="door-card" id="door-chapter">
          <p className="eyebrow">START WITH A CHAPTER</p>
          <h3>Pick a chapter</h3>
          <p className="topic-description">Choose what you are studying. We check the concepts that support it.</p>
          <div className="topic-grid">{cards.map((n, i) => {
            const topic = TOPICS[n as keyof typeof TOPICS] ?? {
              icon: Compass, title: GRAPH[n].name, text: GRAPH[n].blurb, area: "CONCEPT",
              className: ["mint", "blue", "gold", "purple"][i % 4],
            };
            const Icon = topic.icon;
            return <button className={`topic-card ${topic.className}`} key={n} onClick={() => onStart(n)}><div className="topic-card-top"><span className="topic-icon"><Icon size={27} strokeWidth={1.4}/></span><span className="topic-number">0{i + 1}</span></div><p className="eyebrow">{topic.area}</p><h3>{topic.title}</h3><p className="topic-description">{topic.text}</p><span className="topic-action">Start a check <ArrowUpRight size={17}/></span></button>;
          })}</div>
        </div>
        <div className="door-card door-stuck" id="door-stuck">
          <p className="eyebrow">BRING YOUR QUESTION</p>
          <h3>Upload the question</h3>
          <p className="topic-description">Bring a question you are stuck on. We’ll help you explore the concepts behind it.</p>
          <button className="button primary" onClick={onIntake}><Camera size={17}/> Upload a question <ArrowRight size={16}/></button>
          <p className="topic-footnote"><span>Photos are read on this machine. Sending a photo to an AI is optional and adults only.</span></p>
        </div>
      </div>
      <p className="topic-footnote"><span>{draftPreview ? "Draft content · Local preview" : "Only reviewed questions are shown."}</span></p>
    </section>

    <section className="bottom-grid">
      <div className="how-card"><div className="section-heading"><div><p className="eyebrow">A SMALLER, CLEARER NEXT STEP</p><h2>Understanding has a path.</h2></div><Sparkles size={20}/></div><div className="steps">{[{title:"Find a starting point",text:"A short check follows the concepts behind your topic."},{title:"Work on one concept",text:"See a different explanation, then try applying it."},{title:"Come back to it",text:"A later check helps distinguish recall from a one-off result."}].map((step,i)=><div className="step" key={step.title}><span>{String(i+1).padStart(2,"0")}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div></div>
      <div className="week-card"><div className="section-heading"><p className="eyebrow">YOUR WEEK, AT YOUR PACE</p><Clock3 size={17}/></div><div className="week-number">{String(week.done).padStart(2,"0")}<span>checks completed</span></div><p>{week.done ? `${week.passed} passed checks this week. Each result is evidence for that check, not a mastery score.` : "Your progress starts with a single check. No streaks to protect. No leaderboard to chase."}</p><button className="text-button" onClick={onMap}>See your concept map <ArrowRight size={15}/></button></div>
    </section>
    <section className="learning-card strengths-card">
      <p className="eyebrow">WHAT THE CHECKS SHOW SO FAR</p>
      <ul>{chips.map(c => <li key={c.node}>{c.label}</li>)}</ul>
      <ul>{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </section>
    <section className="privacy-row"><ShieldCheck size={19}/><p>Progress stays in this browser. <button onClick={onSettings}>Export or delete it anytime.</button><span>{draftPreview ? "Draft questions are enabled for this local preview." : "Checks use reviewed content. AI is off by default."}</span></p><label className="guest-toggle"><input type="checkbox" checked={guest} onChange={e => onGuest(e.target.checked)}/><span className="toggle-track"/>Guest mode</label></section>
    <details className="demo-controls"><summary>Demo controls <span>For previewing scheduled reviews</span></summary><div><p>Advance the review clock on this device. This is simulated time.</p><button className="button secondary small" onClick={() => onSimulate(1)}>Advance 1 day</button><button className="button secondary small" onClick={() => onSimulate(7)}>Advance 7 days</button><span>Current offset: +{state.simulatedDays} days</span></div></details>
  </div>;
}
