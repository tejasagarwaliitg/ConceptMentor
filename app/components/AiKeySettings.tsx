"use client";
import { useState } from "react";
import { Check, ExternalLink, KeyRound, Trash2 } from "lucide-react";
import { MODEL_PATTERN, PROVIDERS, PROVIDER_IDS, defaultSettings, type AiSettings, type ProviderId } from "@/lib/ai-providers";
import { clearAiSettings, loadAiSettings, maskKey, saveAiSettings } from "@/lib/ai-settings";
import { testAiKey } from "@/lib/api";

type Test = { state: "idle" } | { state: "running" } | { state: "ok"; ms: number } | { state: "fail"; error: string };

/**
 * Settings -> AI mentor. The student adds their OWN API key; it is kept in this browser only
 * (per profile; guest mode uses sessionStorage) and is never part of exported progress.
 * The Cline SDK agent then uses it when they upload a photo of a question.
 */
export function AiKeySettings({ owner, guest }: { owner: string | null; guest: boolean }) {
  const [saved, setSaved] = useState<AiSettings | null>(() => (typeof window === "undefined" ? null : loadAiSettings(owner)));
  const [draft, setDraft] = useState<AiSettings>(() => saved ?? defaultSettings());
  const [editing, setEditing] = useState(!saved);
  const [test, setTest] = useState<Test>({ state: "idle" });
  const [error, setError] = useState<string | null>(null);

  const preset = PROVIDERS[draft.provider];

  function pickProvider(id: ProviderId) {
    const p = PROVIDERS[id];
    setDraft((d) => ({ ...d, provider: id, model: p.defaultModel, vision: p.defaultVision }));
    setTest({ state: "idle" });
  }

  function problem(): string | null {
    if (draft.apiKey.trim().length < 8) return "Paste your API key.";
    if (!MODEL_PATTERN.test(draft.model.trim())) return "The model name has characters that are not allowed.";
    return null;
  }

  function save() {
    const p = problem();
    if (p) return setError(p);
    const next: AiSettings = { ...draft, apiKey: draft.apiKey.trim(), model: draft.model.trim() };
    if (!saveAiSettings(owner, next)) return setError("This browser blocked saving. Check your privacy settings.");
    setSaved(next);
    setDraft(next);
    setEditing(false);
    setError(null);
  }

  function remove() {
    clearAiSettings(owner);
    setSaved(null);
    setDraft(defaultSettings());
    setEditing(true);
    setTest({ state: "idle" });
  }

  async function runTest() {
    const p = problem();
    if (p) return setError(p);
    setError(null);
    setTest({ state: "running" });
    const r = await testAiKey({ provider: draft.provider, apiKey: draft.apiKey.trim(), model: draft.model.trim() });
    setTest(r.ok ? { state: "ok", ms: r.ms ?? 0 } : { state: "fail", error: r.error ?? "The test failed." });
  }

  return (
    <section className="settings-section ai-key-section">
      <h3><KeyRound size={14}/> AI mentor (your own API key)</h3>
      <p>
        Add a key so the AI mentor can read a photo of a question and suggest where to start.
        Your key stays in this browser {guest ? "for this guest session only" : "for this profile"} and is never included in exported progress.
        When you use it, your photo and key are sent to the provider you choose.
      </p>

      {!editing && saved ? (
        <div className="ai-key-saved">
          <p><Check size={14}/> <b>{PROVIDERS[saved.provider].label}</b> · {saved.model} · {maskKey(saved.apiKey)}{saved.vision ? " · reads photos" : " · text only"}</p>
          <div className="settings-actions">
            <button onClick={() => { setEditing(true); setDraft(saved); }} className="button secondary small">Change</button>
            <button onClick={remove} className="button danger small"><Trash2 size={14}/> Remove key</button>
          </div>
        </div>
      ) : (
        <div className="ai-key-form">
          <div className="choice-group">
            {PROVIDER_IDS.map((id) => (
              <button key={id} aria-pressed={draft.provider === id} onClick={() => pickProvider(id)} className="choice-button">{PROVIDERS[id].label}</button>
            ))}
          </div>
          <label className="ai-field">API key
            <input type="password" autoComplete="off" spellCheck={false} placeholder={preset.keyPrefixHint} value={draft.apiKey}
              onChange={(e) => { setDraft({ ...draft, apiKey: e.target.value }); setTest({ state: "idle" }); }} className="intake-textarea" />
          </label>
          <a className="ncert-link" href={preset.getKeyUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={13}/><span>Get a key from {preset.label}</span></a>
          <label className="ai-field">Model
            <input type="text" spellCheck={false} value={draft.model} onChange={(e) => { setDraft({ ...draft, model: e.target.value }); setTest({ state: "idle" }); }} className="intake-textarea" />
          </label>
          <label className="guest-toggle"><input type="checkbox" checked={draft.vision} onChange={(e) => setDraft({ ...draft, vision: e.target.checked })}/><span className="toggle-track"/>This model can read images</label>

          {error && <p className="match-warn">{error}</p>}
          {test.state === "running" && <p className="notify-steps" role="status">Testing…</p>}
          {test.state === "ok" && <p className="notify-steps" role="status">Connected. The model answered in {(test.ms / 1000).toFixed(1)}s.</p>}
          {test.state === "fail" && <p className="match-warn" role="alert">Could not connect: {test.error}</p>}

          <div className="settings-actions">
            <button onClick={runTest} disabled={test.state === "running"} className="button secondary small">Test connection</button>
            <button onClick={save} className="button primary small">Save key</button>
            {saved && <button onClick={() => { setEditing(false); setDraft(saved); setError(null); }} className="text-button">Cancel</button>}
          </div>
        </div>
      )}
    </section>
  );
}
