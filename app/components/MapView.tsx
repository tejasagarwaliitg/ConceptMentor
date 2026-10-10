"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ChevronRight, GitBranch, Maximize2, Minimize2, Search, X } from "lucide-react";
import { GRAPH, LIVE_NODES, MAP_NODES, MAP_EDGES, connectionSummary, type MapNodeId } from "@/content/graph";
import { CONCEPT_SCOPES, LIVE_EDGE_REVIEW } from "@/content/graph-review";
import { ROADMAP_EDGES } from "@/content/graph-roadmap";
import type { NodeId, NodeState, StudentState } from "@/lib/types";
import { GraphCanvas, CATEGORIES, categoryOf, type Category } from "./GraphCanvas";
import { DemoBadge } from "./DemoBadge";
export const STATE_LABEL: Record<NodeState, string> = {
  untested: "Not checked yet", gap: "A suggested starting point", context_difficulty: "Needs a closer look in context",
  no_difficulty_found: "No difficulty found in this check", checked_immediate: "Immediate check passed", retained: "Later check passed",
};
export function MapView({ state, highlight = [], isDemo = false, onBack }: { state: StudentState; highlight?: NodeId[]; isDemo?: boolean; onBack: () => void }) {
  const [selected, setSelected] = useState<MapNodeId | null>(null);
  const [future, setFuture] = useState(false);
  const [full, setFull] = useState(highlight.length === 0);
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inspectorRef = useRef<HTMLElement>(null);
  const ids = MAP_NODES.filter(n => (full || highlight.includes(n.id as NodeId)) && (future || n.coverage === "live_scope")).map(n => n.id);
  const node = MAP_NODES.find(n => n.id === selected);
  const live = selected && LIVE_NODES.includes(selected as NodeId) ? GRAPH[selected as NodeId] : null;
  const incoming = MAP_EDGES.filter(e => e.target === selected && (future || e.kind === "diagnostic_route"));
  const outgoing = MAP_EDGES.filter(e => e.source === selected && (future || e.kind === "diagnostic_route"));
  const results = MAP_NODES.filter(n => n.name.toLowerCase().includes(query.toLowerCase()));
  function pick(id: MapNodeId) { setSelected(id); setCategory("all"); setQuery(""); if (!LIVE_NODES.includes(id as NodeId)) setFuture(true); if (!ids.includes(id)) setFull(true); }
  function connection(id: MapNodeId, key: string) {
    const edge = LIVE_EDGE_REVIEW[key] ?? ROADMAP_EDGES.find(e => `${e.source}->${e.target}` === key);
    return <button key={key} className="connection-row" onClick={() => pick(id)}><span><i style={{ background: CATEGORIES[categoryOf(id)].color }}/>{MAP_NODES.find(n => n.id === id)?.name}<ChevronRight size={13}/></span><small>{edge?.rationale}</small></button>;
  }
  return <div className={`map-page page-width ${expanded ? "map-expanded" : ""}`}>
    <div className="map-heading"><div><button className="back-link" onClick={onBack}><ArrowLeft size={14}/> Overview</button><h1>Everything connects.</h1><p>Explore the ideas behind a chapter, and where they lead next.</p>{isDemo && <DemoBadge />}</div><span className="quiet-tag"><GitBranch size={14}/>{LIVE_NODES.length} current concepts · {MAP_NODES.length - LIVE_NODES.length} coming next</span></div>
    <div className="map-workspace">
      <div className="map-toolbar"><div className="map-search"><Search size={16}/><input aria-label="Search concepts" placeholder="Find a concept…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Escape") setQuery(""); if (e.key === "Enter" && results[0] && query) pick(results[0].id); }}/>{query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={14}/></button>}{query && <div className="search-results">{results.length ? results.map(n => <button key={n.id} onClick={() => pick(n.id)}>{n.name}<small>{n.coverage === "coming_next" ? "Coming next" : "Current map"}</small></button>) : <p>No matching concept.</p>}</div>}</div><div className="map-toolbar-right">{highlight.length > 0 && <button className="quiet-tag" onClick={() => { setFull(!full); setSelected(null); }}>{full ? "My checked path" : "Full map"}</button>}<label className="future-toggle"><input type="checkbox" checked={future} onChange={e => { setFuture(e.target.checked); setFull(true); if (!e.target.checked && selected && !LIVE_NODES.includes(selected as NodeId)) setSelected(null); }}/>Show coming next</label><button className="icon-button" aria-label={expanded ? "Exit expanded map" : "Expand map"} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button></div></div>
      <div className="map-body"><div className="map-visual"><div className="category-filters"><button className={category === "all" ? "selected" : ""} onClick={() => setCategory("all")}>All concepts</button>{Object.entries(CATEGORIES).map(([key,c]) => <button key={key} className={category === key ? "selected" : ""} onClick={() => setCategory(key as Category)}><i style={{background:c.color}}/>{c.label}</button>)}</div><div className="relationship-legend">{selected ? <><span><i style={{background:"#3776bb"}}/>Prerequisites below</span><span><i style={{background:"#a97219"}}/>Selected</span><span><i style={{background:"#15836c"}}/>Depends on this</span></> : <span>Foundations below · Later topics above</span>}</div><GraphCanvas ids={ids} state={state} selected={selected} onSelect={pick} category={category}/><div className="map-canvas-footer"><span><span className="edge-sample"/> Supporting concept <ArrowRight size={12}/> Later topic</span><span>{selected ? "Selection shows prerequisite relationships" : "Colours show subject areas"}</span></div>{selected && <button className="mobile-details-link" onClick={() => inspectorRef.current?.scrollIntoView({behavior:"smooth"})}>View {node?.name} details <ArrowRight size={14}/></button>}</div>
        <aside className="concept-inspector" ref={inspectorRef} aria-live="polite">
          <div className="inspector-heading"><span className="eyebrow">CONCEPT DETAILS</span>{selected && <button className="icon-button" aria-label="Clear selected concept" onClick={() => setSelected(null)}><X size={15}/></button>}</div>
          {!node ? <div className="inspector-empty"><span className="feature-icon"><GitBranch size={26}/></span><h2>Follow a connection.</h2><p>Select any concept to see what supports it, what it leads to, and what you’ve checked.</p><button className="button secondary small" onClick={() => pick("coordinates")}>Start at the foundations <ArrowRight size={14}/></button><div className="inspector-note">A connection suggests a learning route. It does not mean every problem needs every earlier concept.</div></div> : <>
            <p className="concept-category" style={{color:CATEGORIES[categoryOf(node.id)].color}}>{CATEGORIES[categoryOf(node.id)].label} / {live ? "CURRENT MAP" : "COMING NEXT"}</p><h2>{node.name}</h2>
            {live ? <><div className={`concept-state ${state.nodes[live.id]?.state && state.nodes[live.id]?.state !== "untested" ? "has-evidence" : ""}`}><span>◉</span>{STATE_LABEL[state.nodes[live.id]?.state ?? "untested"]}</div><p className="concept-skill">{CONCEPT_SCOPES[live.id].skill}</p><div className="connection-count"><b>{connectionSummary(live.id).live}</b><span>later concepts in the current map<br/><small>+ {connectionSummary(live.id).comingNext} planned connections</small></span></div></> : <div className="inspector-note">This is a planned topic. It is not used for questions or progress checks yet.</div>}
            <section className="connection-section"><h3><ArrowLeft size={13}/> BUILDS ON <span>{incoming.length}</span></h3>{incoming.length ? incoming.map(e => connection(e.source,e.id)) : <p className="empty-connections">{live ? "A starting foundation in this map." : "No earlier connections shown."}</p>}</section>
            <section className="connection-section"><h3><ArrowRight size={13}/> LEADS TO <span>{outgoing.length}</span></h3>{outgoing.length ? outgoing.map(e => connection(e.target,e.id)) : <p className="empty-connections">{future ? "No later topics mapped yet." : "Show coming next to explore planned topics."}</p>}</section>
            {live && <a className="ncert-link" href={live.ncertUrl} target="_blank" rel="noopener noreferrer"><BookOpen size={17}/><span>Read the NCERT reference<small>{live.ncert}</small></span><ArrowUpRight size={14}/></a>}
          </>}
        </aside>
      </div>
    </div>
    <div className="map-footnote"><p><span className="status-ring"/> Unchecked concepts stay unchecked. Connections alone never establish understanding.</p><p>Dashed connections belong to the planned map.</p></div>
  </div>;
}
