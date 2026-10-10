"use client";
import type { Figure } from "@/content/schema";

/**
 * Minimal, honest diagrams. No images, no external calls: everything is SVG we draw
 * ourselves, so a figure can never be missing at demo time.
 */
export function FigureView({ figure }: { figure: Figure }) {
  return (
    <figure>
      <svg viewBox="0 0 320 190" className="figure-frame" role="img">
        {figure.kind === "axes" && <Axes data={figure.data} />}
        {figure.kind === "incline" && <Incline data={figure.data} />}
        {figure.kind === "triangle" && <Triangle data={figure.data} />}
        {figure.kind === "vector" && <VectorFig data={figure.data} />}
        {figure.kind === "graph-vt" && <Graph data={figure.data} yLabel="v (m/s)" />}
        {figure.kind === "graph-xt" && <Graph data={figure.data} yLabel="x (m)" />}
      </svg>
      {figure.caption && <figcaption className="figure-caption">{figure.caption}</figcaption>}
    </figure>
  );
}

const INK = "#141821";
const MUTED = "#5B6472";

function Axes({ data }: { data: Record<string, unknown> }) {
  const pts = (data.points as [number, number][]) ?? [];
  return (
    <>
      <line x1="30" y1="160" x2="300" y2="160" stroke={INK} strokeWidth="1.5" />
      <line x1="30" y1="20" x2="30" y2="160" stroke={INK} strokeWidth="1.5" />
      <text x="300" y="175" fill={MUTED} fontSize="11">x</text>
      <text x="12" y="24" fill={MUTED} fontSize="11">y</text>
      {pts.map(([px, py], i) => (
        <g key={i}>
          <circle cx={30 + px * 30} cy={160 - py * 30} r="4" fill={INK} />
          <text x={36 + px * 30} y={154 - py * 30} fill={MUTED} fontSize="11">{`(${px}, ${py})`}</text>
        </g>
      ))}
      {typeof data.angle === "number" && (
        <text x="60" y="150" fill={MUTED} fontSize="11">{`${data.angle}°`}</text>
      )}
    </>
  );
}

function Incline({ data }: { data: Record<string, unknown> }) {
  const angle = (data.angle as number) ?? 30;
  return (
    <>
      <line x1="30" y1="160" x2="290" y2="160" stroke={MUTED} strokeWidth="1.5" />
      <line x1="30" y1="160" x2="250" y2="40" stroke={INK} strokeWidth="2.5" />
      <rect x="120" y="72" width="34" height="26" fill="none" stroke={INK} strokeWidth="2" transform={`rotate(${-angle + 90 - 90} 137 85)`} />
      <text x="60" y="152" fill={MUTED} fontSize="12">{`${angle}°`}</text>
      <text x="150" y="30" fill={MUTED} fontSize="11">{(data.label as string) ?? "m"}</text>
    </>
  );
}

function Triangle({ data }: { data: Record<string, unknown> }) {
  return (
    <>
      <polygon points="50,150 270,150 50,40" fill="none" stroke={INK} strokeWidth="2" />
      <text x="120" y="168" fill={MUTED} fontSize="12">{(data.base as string) ?? "adjacent"}</text>
      <text x="18" y="100" fill={MUTED} fontSize="12">{(data.height as string) ?? "opposite"}</text>
      <text x="160" y="95" fill={MUTED} fontSize="12">{(data.hyp as string) ?? "hypotenuse"}</text>
      <text x="62" y="142" fill={MUTED} fontSize="12">{(data.angle as string) ?? "θ"}</text>
    </>
  );
}

function VectorFig({ data }: { data: Record<string, unknown> }) {
  const angle = ((data.angle as number) ?? 30) * Math.PI / 180;
  const len = (data.length as number) ?? 110;
  const x2 = 40 + len * Math.cos(angle);
  const y2 = 150 - len * Math.sin(angle);
  return (
    <>
      <line x1="30" y1="150" x2="290" y2="150" stroke={MUTED} strokeWidth="1.2" strokeDasharray="4 4" />
      <line x1="40" y1="150" x2={x2} y2={y2} stroke={INK} strokeWidth="2.5" />
      <polygon points={`${x2},${y2} ${x2 - 9},${y2 - 3} ${x2 - 4},${y2 + 7}`} fill={INK} />
      <line x1="40" y1="150" x2={x2} y2="150" stroke="#0F766E" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1={x2} y1="150" x2={x2} y2={y2} stroke="#B45309" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x={(40 + x2) / 2} y="145" fill="#0F766E" fontSize="11">{(data.xlabel as string) ?? "x-component"}</text>
      <text x={x2 + 6} y={(150 + y2) / 2} fill="#B45309" fontSize="11">{(data.ylabel as string) ?? "y-component"}</text>
      <text x="55" y="142" fill={MUTED} fontSize="12">{`${(data.angle as number) ?? 30}°`}</text>
    </>
  );
}

function Graph({ data, yLabel }: { data: Record<string, unknown>; yLabel: string }) {
  const pts = (data.points as [number, number][]) ?? [];
  const maxX = (data.maxX as number) ?? 6;
  const maxY = (data.maxY as number) ?? 10;
  const sx = (v: number) => 30 + (v / maxX) * 260;
  const sy = (v: number) => 160 - (v / maxY) * 130;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0])},${sy(p[1])}`).join(" ");
  return (
    <>
      <line x1="30" y1="160" x2="300" y2="160" stroke={INK} strokeWidth="1.5" />
      <line x1="30" y1="20" x2="30" y2="160" stroke={INK} strokeWidth="1.5" />
      <text x="296" y="176" fill={MUTED} fontSize="11">t (s)</text>
      <text x="6" y="24" fill={MUTED} fontSize="11">{yLabel}</text>
      <path d={path} fill="none" stroke="#0F766E" strokeWidth="2.5" />
      {pts.map((p, i) => <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="3" fill="#0F766E" />)}
    </>
  );
}
