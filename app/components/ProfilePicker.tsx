"use client";
import { useState } from "react";
import { ArrowRight, FlaskConical, GitFork, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import type { NewProfileInput, ProfileStore } from "@/lib/profiles";

interface ProfilePickerProps {
  store: ProfileStore;
  onSelect: (id: string) => void;
  onCreate: (input: NewProfileInput) => void;
  onUseDemo: () => void;
  onGuest: () => void;
}

export function ProfilePicker({ store, onSelect, onCreate, onUseDemo, onGuest }: ProfilePickerProps) {
  const [displayName, setDisplayName] = useState("");
  const [classLabel, setClassLabel] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const profiles = Object.values(store.profiles);
  const canCreate = displayName.trim().length > 0;

  function startFresh() {
    if (!canCreate) return;
    onCreate({
      displayName: displayName.trim(),
      classLabel: classLabel.trim(),
      targetExam: targetExam.trim(),
    });
  }

  return (
    <div className="app-shell profile-picker">
      <header className="picker-brand">
        <span className="wordmark"><span className="brand-symbol"><GitFork size={22} strokeWidth={1.7} aria-hidden="true" /></span><span>concept<span className="brand-light">mentor</span><sup>BETA</sup></span></span>
        <span className="picker-local"><ShieldCheck size={14} aria-hidden="true" /> Private by default</span>
      </header>

      <main className="picker-main" id="main-content">
        <div className="picker-intro">
          <p className="eyebrow">YOUR OWN SPACE TO UNDERSTAND</p>
          <h1>A fresh page for your learning.</h1>
          <p>Small steps, at your pace. Each profile keeps its own checks<br className="picker-desktop-break" /> and review schedule in this browser.</p>
        </div>

        <div className="picker-grid">
          <section className="picker-card picker-saved" aria-labelledby="saved-profiles-title">
            <div className="picker-card-heading"><span className="picker-icon"><UsersRound size={20} aria-hidden="true" /></span><div><p className="eyebrow">WHO IS USING THIS DEVICE</p><h2 id="saved-profiles-title">{profiles.length ? "Welcome back." : "Make yourself at home."}</h2></div></div>
            {profiles.length > 0 ? (
              <div className="picker-profiles" aria-label="Saved profiles">
                {profiles.map((p) => (
                  <button className="picker-profile" key={p.id} onClick={() => onSelect(p.id)}>
                    <span className="picker-avatar" aria-hidden="true">{p.displayName.trim().slice(0, 1).toUpperCase() || "?"}</span>
                    <span className="picker-profile-copy"><strong>{p.displayName}</strong>{(p.classLabel || p.targetExam) && <span>{[p.classLabel, p.targetExam].filter(Boolean).join(" · ")}</span>}{p.isDemo && <small>Simulated progress</small>}</span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="picker-empty"><UserRound size={28} strokeWidth={1.4} aria-hidden="true" /><h3>A fresh start awaits.</h3><p>Create a profile for your own progress, or explore the demo to see how it works.</p></div>
            )}
            <div className="picker-demo"><div><FlaskConical size={17} aria-hidden="true" /><span>Want a quick look around?</span></div><p>The demo uses simulated progress, not a real student’s results.</p><button className="button secondary" onClick={onUseDemo}>Use demo account <ArrowRight size={16} aria-hidden="true" /></button></div>
          </section>

          <section className="picker-card" aria-labelledby="new-profile-title">
            <p className="eyebrow">START FRESH</p>
            <h2 id="new-profile-title">Let’s get you started.</h2>
            <p className="picker-card-description">A name is all you need. The rest is optional.</p>
            <form className="picker-form" onSubmit={(event) => { event.preventDefault(); startFresh(); }}>
              <div className="picker-field"><label htmlFor="profile-name">Name <span>Required</span></label><input id="profile-name" name="displayName" aria-label="Profile name" autoComplete="nickname" required value={displayName} maxLength={80} placeholder="Your name" onChange={(e) => setDisplayName(e.target.value)} /></div>
              <div className="picker-field-row">
                <div className="picker-field"><label htmlFor="profile-class">Class <span>Optional</span></label><input id="profile-class" name="classLabel" aria-label="Class" value={classLabel} maxLength={40} placeholder="Class 11" onChange={(e) => setClassLabel(e.target.value)} /></div>
                <div className="picker-field"><label htmlFor="profile-exam">Target exam <span>Optional</span></label><input id="profile-exam" name="targetExam" aria-label="Target exam" value={targetExam} maxLength={80} placeholder="JEE Main 2027" onChange={(e) => setTargetExam(e.target.value)} /></div>
              </div>
              <button className="button primary picker-submit" type="submit" disabled={!canCreate}>Create my profile <ArrowRight size={17} aria-hidden="true" /></button>
              <p className="picker-form-note"><ShieldCheck size={13} aria-hidden="true" /> Saved on this device. No account or password needed.</p>
            </form>
          </section>
        </div>

        <div className="picker-guest"><span>Just exploring?</span><button className="text-button" onClick={onGuest}>Continue as guest <ArrowRight size={15} aria-hidden="true" /></button><p>Guest progress stays separate from saved profiles.</p></div>
      </main>

      <footer className="picker-footer">Small steps. Connected understanding.</footer>
    </div>
  );
}
