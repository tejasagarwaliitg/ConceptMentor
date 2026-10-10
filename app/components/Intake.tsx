"use client";
import { useRef, useState } from "react";
import { Camera, ImageUp, KeyRound } from "lucide-react";
import type { NodeId } from "@/lib/types";
import { analyseQuestion, downscale, MAX_BYTES, type Analysis, type SafetyReply } from "@/lib/analyze-client";
import { loadAiSettings } from "@/lib/ai-settings";
import { PROVIDERS } from "@/lib/ai-providers";
import { IntakeConfirm } from "./IntakeConfirm";

type Stage = "pick" | "reading" | "confirm" | "manual" | "safety";

/**
 * Door 2, "I'm stuck on a question": photograph or upload the question you got wrong.
 * Local OCR -> keyword matcher -> (adults only, access code) Cline SDK agent -> graph node,
 * with the reason shown and the student confirming. The downward search then starts from that node.
 * With no AI configured the rule-based matcher still explains its choice, and no image
 * leaves the device (the photo is sent to a model only in AI mode).
 */
export function Intake({ owner, onMapped, onChapter, onSkip, onSettings }: {
  /** active profile id, or null in guest mode: decides whose saved API key is used */
  owner: string | null;
  onMapped: (node: NodeId) => void;
  onChapter: () => void;
  onSkip: () => void;
  onSettings: () => void;
}) {
  const [stage, setStage] = useState<Stage>("pick");
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [safety, setSafety] = useState<SafetyReply | null>(null);
  // Intake only mounts after a click, on the client, so reading browser storage here cannot cause a hydration mismatch.
  const [ai] = useState(() => (typeof window === "undefined" ? null : loadAiSettings(owner)));
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setError(null);
    if (f.size > MAX_BYTES * 4) { setError("Photo is too large. Try a smaller or cropped photo."); return; }
    setStage("reading");
    try {
      const dataUrl = await downscale(f);
      setPreview(dataUrl);
      // Local OCR first: this never leaves the machine.
      const ocr = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      }).then((r) => r.json()).catch(() => ({ error: "ocr-failed" }));
      const readText: string = !ocr.error && typeof ocr.text === "string" ? ocr.text : "";
      setText(readText);
      if (!readText && !ai) {
        setStage("manual");
        setError("I could not read the text in that photo. Type the question instead, or add an API key in Settings so the AI mentor can read the photo.");
        return;
      }
      await analyse(readText, dataUrl);
    } catch {
      setStage("manual");
      setError("That photo did not work. Try another, or type the question.");
    }
  }

  async function analyse(questionText: string, image?: string) {
    setStage("reading");
    // The photo goes to a model only when the student has added their own API key. Otherwise only text is analysed.
    const res = await analyseQuestion(questionText, ai ? image : undefined, ai);
    if (res.kind === "safety") { setSafety(res.reply); setStage("safety"); return; }
    if (res.kind === "ok") {
      setAnalysis(res.analysis);
      setStage("confirm");
      return;
    }
    setStage("manual");
    setError("I could not analyse that right now. Pick the chapter yourself.");
  }

  if (stage === "safety" && safety) {
    return (
      <div>
        <p className="match-panel" role="status">{safety.message}</p>
        <button onClick={onChapter} className="text-action">Choose a chapter instead</button>
      </div>
    );
  }

  if (stage === "pick") {
    return (
      <div>
        <p className="intake-lede">
          Upload or photograph the question you are stuck on. I will read it and find which concept it sits on, then we look at the ideas underneath it.
        </p>
        <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="Upload a picture of the question"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void handleFile(f); }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Take a photo of the question"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void handleFile(f); }} />
        {error && <p className="match-warn">{error}</p>}
        <div className="learning-actions">
          <button onClick={() => uploadRef.current?.click()} className="button primary"><ImageUp size={17}/> Upload a picture</button>
          <button onClick={() => cameraRef.current?.click()} className="button secondary"><Camera size={17}/> Take a photo</button>
          <button onClick={() => setStage("manual")} className="button secondary">Type it instead</button>
        </div>

        <div className="ai-access" role="status">
          <KeyRound size={14}/>
          {ai ? (
            <p>AI mentor is on ({PROVIDERS[ai.provider].label}). Your photo is sent to that provider using your own key. <button onClick={onSettings} className="edit-link">Change in Settings</button></p>
          ) : (
            <p>No API key added, so the photo is read on this machine and matched by keywords. <button onClick={onSettings} className="edit-link">Add an API key in Settings</button> to let the AI mentor read it.</p>
          )}
        </div>

        <button onClick={onChapter} className="text-action">Skip: choose a chapter</button>
      </div>
    );
  }

  if (stage === "reading") {
    return (
      <div>
        {preview && <img src={preview} alt="Your question" className="intake-photo" />}
        <p className="loading-card" role="status"><span className="loading-orbit"/>Reading your question…</p>
      </div>
    );
  }

  if (stage === "manual") {
    return (
      <div>
        {error && <p className="match-warn">{error}</p>}
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
          placeholder="Type the question here" className="intake-textarea" />
        <div className="learning-actions">
          <button onClick={() => text.trim().length > 8 && void analyse(text, preview ?? undefined)} className="button primary">
            Find where it belongs
          </button>
        </div>
        <button onClick={onChapter} className="text-action">Skip: choose a chapter</button>
      </div>
    );
  }

  return <IntakeConfirm analysis={analysis!} preview={preview} text={text}
    onMapped={onMapped} onSkip={onSkip} onEdit={() => setStage("manual")} />;
}
