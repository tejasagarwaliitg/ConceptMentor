"use client";
import { useEffect, useId, useRef, useState } from "react";
import { select } from "d3-selection";
import { forceSimulation, forceManyBody, forceCollide, forceLink, forceX, type SimulationNodeDatum, type SimulationLinkDatum } from "d3-force";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { drag } from "d3-drag";
import { Minus, Plus, Scan } from "lucide-react";
import { MAP_NODES, MAP_EDGES, type MapNodeId } from "@/content/graph";
import { graphRanks, graphRelations } from "@/lib/graph-layout";
import type { NodeId, StudentState } from "@/lib/types";

export const CATEGORIES = {
  foundations: { label: "Foundations", color: "#427abb" },
  vectors: { label: "Vectors", color: "#8660b6" },
  calculus: { label: "Calculus", color: "#a47727" },
  mechanics: { label: "Mechanics", color: "#16856d" },
  electromagnetism: { label: "Electricity and magnetism", color: "#b85d6d" },
  optics_modern: { label: "Optics and modern physics", color: "#b77631" },
};
export type Category = keyof typeof CATEGORIES;
export function categoryOf(id: MapNodeId): Category {
  if (["vec_basics", "vec_comp", "dot_product", "cross_product", "vectors_3d"].includes(id)) return "vectors";
  if (["deriv_rate", "integration", "functions_limits", "differentiation_rules", "definite_integrals", "differential_equations", "exp_log"].includes(id)) return "calculus";
  if (["coulomb_field", "electric_potential", "gauss_law", "capacitors", "current_electricity", "circuits_kirchhoff", "magnetic_sources", "magnetic_force", "em_induction", "ac_lcr", "em_waves"].includes(id)) return "electromagnetism";
  if (["reflection_refraction", "lenses_prisms", "wave_optics", "dual_nature", "atomic_models", "nuclear_physics"].includes(id)) return "optics_modern";
  if (["coordinates", "trig", "trig_identities", "slope", "ratios", "linear_equations", "quadratic_equations", "units_dimensions", "measurement_errors", "signed_numbers", "pythagoras_triangles", "angles_basics", "shape_area"].includes(id)) return "foundations";
  return "mechanics";
}
const LABELS: Partial<Record<MapNodeId, string>> = {
  coordinates: "Coordinates & axes", trig: "Trigonometric ratios", slope: "Slope of a graph",
  deriv_rate: "Rate of change", motion_graphs: "Motion graphs",
};
const POSITIONS: Partial<Record<MapNodeId, [number, number]>> = {
  coordinates: [210, 0], slope: [210, 0], deriv_rate: [285, 0], motion_graphs: [330, 0],
  kin_1d: [430, 0], projectile: [520, 0], vec_comp: [640, 0], trig: [540, 0], vec_basics: [760, 0],
};
interface Point extends SimulationNodeDatum { id: MapNodeId; name: string; future: boolean; tx: number; ty: number }
interface Link extends SimulationLinkDatum<Point> { future: boolean }
interface Props {
  ids: MapNodeId[]; selected: MapNodeId | null; onSelect: (id: MapNodeId) => void;
  state: StudentState; preview?: boolean; category?: Category | "all";
}
export function GraphCanvas({ ids, selected, onSelect, state, preview = false, category = "all" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const parent = svgRef.current?.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < 500));
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const fitRef = useRef(() => {});
  const onSelectRef = useRef(onSelect);
  const uid = useId().replace(/:/g, "");
  const signature = ids.join(",");
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const svg = select(element);
    const idsHere = new Set(signature.split(","));
    const data = MAP_NODES.filter(n => idsHere.has(n.id));
    const visibleEdges = MAP_EDGES.filter(e => idsHere.has(e.source) && idsHere.has(e.target));
    const ranks = graphRanks(data.map(n => n.id), visibleEdges);
    const maxRank = Math.max(0, ...ranks.values());
    const nodes: Point[] = data.map((n, i) => {
      const baseX = POSITIONS[n.id]?.[0] ?? 110 + ((i * 173) % 700);
      const x = narrow ? baseX / 2 : baseX;
      const y = 65 + (maxRank - ranks.get(n.id)!) * 88;
      return { id: n.id, name: LABELS[n.id] ?? n.name, future: n.coverage === "coming_next", x, y, fx: null, fy: y, tx: x, ty: y };
    });

    const links: Link[] = MAP_EDGES.filter(e => idsHere.has(e.source) && idsHere.has(e.target)).map(e => ({ source: e.source, target: e.target, future: e.kind === "coming_next_connection" }));
    const layer = svg.select<SVGGElement>(".graph-layer");
    layer.selectAll("*").remove();
    layer.append("g").attr("class", "level-guides").attr("aria-hidden", "true").selectAll("line").data(Array.from({length: maxRank + 1}, (_, i) => i)).join("line")
      .attr("x1", narrow ? 30 : 55).attr("x2", narrow ? 430 : 850).attr("y1", i => 65 + i * 88).attr("y2", i => 65 + i * 88)
      .attr("stroke", "#c8dbd5").attr("stroke-opacity", .4).attr("stroke-dasharray", "2 7");
    const paths = layer.append("g").attr("fill", "none").selectAll("path").data(links).join("path")
      .attr("class", "graph-edge").attr("stroke", "#92b6aa").attr("stroke-width", 1.4)
      .attr("stroke-dasharray", d => d.future ? "4 6" : null).attr("marker-end", `url(#${uid}-arrow)`);
    const groups = layer.append("g").selectAll<SVGGElement, Point>("g").data(nodes).join("g")
      .attr("class", "graph-node").attr("data-node", d => d.id).attr("role", "button")
      .attr("tabindex", 0).attr("aria-label", d => `${d.name}${d.future ? ", coming next" : ""}. View concept details`)
      .on("click", (event, d) => { if (!event.defaultPrevented) onSelectRef.current(d.id); })
      .on("keydown", (event: KeyboardEvent, d) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectRef.current(d.id); } });
    groups.append("circle").attr("class", "node-halo").attr("r", 28).attr("fill", d => CATEGORIES[categoryOf(d.id)].color).attr("opacity", .05);
    groups.append("circle").attr("class", "node-ring").attr("r", 19).attr("fill", "none").attr("stroke", d => CATEGORIES[categoryOf(d.id)].color).attr("opacity", .25).attr("stroke-dasharray", d => d.future ? "3 4" : null);
    groups.append("circle").attr("class", "node-core").attr("r", d => d.future ? 7 : 10).attr("fill", d => d.future ? "#f1f7f4" : CATEGORIES[categoryOf(d.id)].color).attr("stroke", d => CATEGORIES[categoryOf(d.id)].color).attr("stroke-width", 1.5);
    groups.append("circle").attr("class", "node-evidence").attr("cx", 13).attr("cy", -13).attr("r", 4).attr("stroke", "#ffffff").attr("stroke-width", 2);
    groups.append("text").attr("text-anchor", "middle").attr("y", 30).attr("fill", d => d.future ? "#677b80" : "#304f56").attr("font-size", narrow ? 14 : preview ? 15 : 12).attr("font-weight", 500).each(function(d) {
      const words = d.name.split(" ");
      if (narrow && words.length > 1) {
        const split = Math.ceil(words.length / 2);
        select(this).append("tspan").attr("x", 0).text(words.slice(0, split).join(" "));
        select(this).append("tspan").attr("x", 0).attr("dy", 16).text(words.slice(split).join(" "));
      } else select(this).text(d.name);
    });
    groups.append("title").text(d => `${d.name} · ${CATEGORIES[categoryOf(d.id)].label}${d.future ? " · Coming next" : ""}`);
    const simulation = forceSimulation(nodes)
      .force("link", forceLink<Point, Link>(links).id(d => d.id).distance(160).strength(.12))
      .force("charge", forceManyBody().strength(narrow ? -180 : -650))
      .force("collision", forceCollide<Point>(narrow ? 40 : 72))
      .force("x", forceX<Point>(d => d.tx).strength(.45)).stop();
    simulation.tick(160);
    const render = () => {
      paths.attr("d", d => {
        const a = d.source as Point, b = d.target as Point;
        const dx = b.x! - a.x!, dy = b.y! - a.y!;
        const length = Math.hypot(dx, dy) || 1;
        const sx = a.x! + dx / length * 22, sy = a.y! + dy / length * 22;
        const ex = b.x! - dx / length * 25, ey = b.y! - dy / length * 25;
        return `M${sx},${sy} Q${(sx + ex) / 2 - dy * .09},${(sy + ey) / 2 + dx * .09} ${ex},${ey}`;
      });
      groups.attr("transform", d => `translate(${d.x},${d.y})`);
    };
    render(); simulation.on("tick", render);
    groups.call(drag<SVGGElement, Point>()
      .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(.15).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (event, d) => { d.fx = Math.max(narrow ? 35 : 70, Math.min(narrow ? 420 : 830, event.x)); d.fy = d.ty; })
      .on("end", (event) => { if (!event.active) simulation.alphaTarget(0); }));
    const zoomer = zoom<SVGSVGElement, unknown>().scaleExtent([.35, 3]).on("zoom", e => layer.attr("transform", e.transform.toString()));
    svg.call(zoomer).on("dblclick.zoom", null);
    zoomRef.current = zoomer;
    const fit = () => {
      const box = layer.node()?.getBBox();
      if (!box || !box.width) return;
      const k = Math.min(1.3, (narrow ? 405 : 790) / box.width, (narrow ? 545 : 465) / box.height);
      svg.call(zoomer.transform, zoomIdentity.translate((narrow ? 230 : 450) - (box.x + box.width / 2) * k, (narrow ? 305 : 275) - (box.y + box.height / 2) * k).scale(k));
    };
    fitRef.current = fit; fit();
    return () => { simulation.stop(); svg.on(".zoom", null); };
  }, [signature, uid, narrow, preview]);

  useEffect(() => {
    const svg = select(svgRef.current);
    const visible = new Set(signature.split(","));
    const edges = MAP_EDGES.filter(e => visible.has(e.source) && visible.has(e.target));
    const relations = selected ? graphRelations(selected, edges) : null;
    const tone = (id: MapNodeId) => !selected ? CATEGORIES[categoryOf(id)].color : id === selected ? "#a97219" : relations?.prerequisites.has(id) ? "#3776bb" : relations?.dependants.has(id) ? "#15836c" : "#829b9f";
    const connected = (id: MapNodeId) => !selected || selected === id || relations?.prerequisites.has(id) || relations?.dependants.has(id);
    svg.selectAll<SVGGElement, Point>(".graph-node")
      .attr("aria-pressed", d => d.id === selected ? "true" : "false")
      .attr("data-relation", d => !selected ? "none" : d.id === selected ? "selected" : relations?.prerequisites.has(d.id) ? "prerequisite" : relations?.dependants.has(d.id) ? "dependant" : "unrelated")
      .attr("opacity", d => category !== "all" && categoryOf(d.id) !== category ? .2 : connected(d.id) ? 1 : .55);
    svg.selectAll<SVGCircleElement, Point>(".node-core").attr("fill", d => d.future ? "#f1f7f4" : tone(d.id)).attr("stroke", d => tone(d.id));
    svg.selectAll<SVGCircleElement, Point>(".node-ring").attr("stroke", d => tone(d.id)).attr("stroke-width", d => d.id === selected ? 2 : 1).attr("opacity", d => d.id === selected ? 1 : connected(d.id) && selected ? .65 : .25);
    svg.selectAll<SVGCircleElement, Point>(".node-halo").attr("fill", d => tone(d.id)).attr("opacity", d => d.id === selected ? .14 : .05);
    svg.selectAll<SVGTextElement, Point>(".graph-node text").attr("fill", d => selected && connected(d.id) ? tone(d.id) : "#3c5860");
    svg.selectAll<SVGCircleElement, Point>(".node-evidence").attr("fill", d => {
      const status = state.nodes[d.id as NodeId]?.state;
      return status === "gap" || status === "context_difficulty" ? "#b77f25" : "#16856d";
    }).attr("display", d => !state.nodes[d.id as NodeId] || state.nodes[d.id as NodeId]?.state === "untested" ? "none" : null);
    svg.selectAll<SVGPathElement, Link>(".graph-edge").attr("stroke", d => {
      const a = (d.source as Point).id, b = (d.target as Point).id;
      if (!selected) return "#92b6aa";
      if (relations?.prerequisites.has(a) && (b === selected || relations.prerequisites.has(b))) return "#3776bb";
      if ((a === selected || relations?.dependants.has(a)) && relations?.dependants.has(b)) return "#15836c";
      return "#bfcecd";
    }).attr("opacity", d => !selected || (connected((d.source as Point).id) && connected((d.target as Point).id)) ? .85 : .2);
  }, [selected, category, signature, state.nodes, narrow, preview]);
  return <div className={`graph-canvas ${preview ? "graph-preview" : ""}`}>
    <svg ref={svgRef} viewBox={narrow ? "0 0 460 650" : "0 0 900 570"} aria-label="Interactive concept graph. Arrows point from supporting concepts to later topics." role="group">
      <defs><marker id={`${uid}-arrow`} viewBox="0 -4 8 8" refX="7" refY="0" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,-3L7,0L0,3" fill="none" stroke="#718f86" strokeWidth="1.2" /></marker></defs>
      <g className="graph-layer" />
    </svg>
    <div className="graph-controls" aria-label="Graph controls">
      <button aria-label="Zoom in" title="Zoom in" onClick={() => { if (svgRef.current && zoomRef.current) select(svgRef.current).call(zoomRef.current.scaleBy, 1.25); }}><Plus size={16}/></button>
      <button aria-label="Zoom out" title="Zoom out" onClick={() => { if (svgRef.current && zoomRef.current) select(svgRef.current).call(zoomRef.current.scaleBy, .8); }}><Minus size={16}/></button>
      <button aria-label="Fit graph to view" title="Fit graph to view" onClick={() => fitRef.current()}><Scan size={16}/></button>
    </div>
    <span className="graph-hint">Drag sideways · Levels stay fixed</span>
  </div>;
}
