"use client";
import { ArrowUpRight, GitFork, SlidersHorizontal, House, BookOpen, Network } from "lucide-react";
import type { ReactNode } from "react";
export function Shell({ children, active, guest, onHome, onMap, onPractice, onSettings }: { children: ReactNode; active: string; guest: boolean; onHome: () => void; onMap: () => void; onPractice: () => void; onSettings: () => void }) {
  return <div className="app-shell">
    <header className="site-header"><div className="header-inner">
      <button className="wordmark" onClick={onHome} aria-label="Concept mentor home"><span className="brand-symbol"><GitFork size={22} strokeWidth={1.7}/></span><span>concept<span className="brand-light">mentor</span><sup>BETA</sup></span></button>
      <nav aria-label="Main navigation"><button className={active === "today" ? "active" : ""} onClick={onHome} aria-current={active === "today" ? "page" : undefined}><House size={17}/>Home</button><button className={active === "map" ? "active" : ""} onClick={onMap} aria-current={active === "map" ? "page" : undefined}><Network size={17}/>Concept map</button><button className={active === "practice" ? "active" : ""} onClick={onPractice} aria-current={active === "practice" ? "page" : undefined}><BookOpen size={17}/>Practice</button></nav>
      <div className="header-actions"><span className="storage-badge"><i/>{guest ? "Guest session" : "Saved on this device"}</span><button className={`icon-button ${active === "settings" ? "active" : ""}`} onClick={onSettings} aria-label="Preferences"><SlidersHorizontal size={18}/></button></div>
    </div></header>
    <main id="main-content" className={active === "today" || active === "map" ? "" : "learning-main"}>{children}</main>
    <footer className="site-footer"><span>Small steps. Connected understanding.</span><button onClick={onMap}>See how it connects <ArrowUpRight size={13}/></button><span>Physics & mathematics · JEE foundations</span></footer>
  </div>;
}
