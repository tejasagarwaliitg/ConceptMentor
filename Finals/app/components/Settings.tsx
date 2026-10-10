"use client";
import { ArrowLeft, Download, SlidersHorizontal, Trash2, Upload } from "lucide-react";
import { t } from "@/lib/copy";
import type { StudentSettings } from "@/lib/types";
import { AiKeySettings } from "./AiKeySettings";

interface Props {
  settings: StudentSettings;
  flagged: string[];
  guest: boolean;
  /** active profile id (null in guest mode); reminders are keyed by it */
  pid: string | null;
  isDemo: boolean;
  notifyCode: string | null;
  notifyMsg: string | null;
  onGetCode: () => void;
  onUnlink: () => void;
  onChange: (s: Partial<StudentSettings>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onDelete: () => void;
  onBack: () => void;
}

function Choice<T extends string>({ label, value, options, onPick }: { label: string; value: T; options: [T, string][]; onPick: (v: T) => void }) {
  return (
    <section className="settings-section">
      <h3>{label}</h3>
      <div className="choice-group">
        {options.map(([v, text]) => (
          <button key={v} aria-pressed={value === v} onClick={() => onPick(v)} className="choice-button">
            {text}
          </button>
        ))}
      </div>
    </section>
  );
}

export function Settings({ settings, flagged, guest, pid, isDemo, notifyCode, notifyMsg, onGetCode, onUnlink, onChange, onExport, onImport, onDelete, onBack }: Props) {
  return (
    <div className="learning-card settings-card">
      <div className="question-top"><span>PREFERENCES</span><button onClick={onBack}><ArrowLeft size={12}/>Back to overview</button></div>
      <div className="settings-title"><SlidersHorizontal size={22}/><h2>Make it yours.</h2></div>

      <p className="settings-intro">Keep control of your learning data and preferences.</p>
      <Choice label="Data use" value={settings.lowData ? "on" : "off"} options={[["off", "Standard"], ["on", "Low data: text only"]]} onPick={(v) => onChange({ lowData: v === "on" })} />

      <AiKeySettings owner={guest ? null : pid} guest={guest} />

      {!guest && pid && (
        <section className="settings-section">
          <h3>Telegram reminders</h3>
          {isDemo ? (
            <p>Demo account par reminders nahi — ye simulated data hai. Apne profile par jao.</p>
          ) : (
            <>
              <p>{t().remind.linkDisclosure}</p>
              {notifyCode ? (
                <>
                  <p className="notify-steps">Bot ko Telegram par ye bhejo:</p>
                  <p className="notify-code">/start {notifyCode}</p>
                  <div className="settings-actions">
                    <button onClick={onUnlink} className="button secondary small">
                      Stop reminders
                    </button>
                  </div>
                </>
              ) : (
                <div className="settings-actions">
                  <button onClick={onGetCode} className="button secondary small">
                    Get link code
                  </button>
                </div>
              )}
              {notifyMsg && <p className="notify-steps">{notifyMsg}</p>}
            </>
          )}
        </section>
      )}

      <section className="settings-section">
        <h3>Your progress</h3>
        <p>Progress is stored in this browser. Imported progress is treated as self-reported, not independently verified.</p>
        <div className="settings-actions">
          <button onClick={onExport} className="button secondary small"><Download size={14}/> Export</button>
          <label className="button secondary small">
            <Upload size={14}/> Import progress
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          </label>
          <button onClick={() => confirm("Delete all progress saved in this browser?") && onDelete()} className="button danger small">
            <Trash2 size={14}/> Delete my progress
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>Reported questions</h3>
        <div className="flagged-list">
          {flagged.length === 0 ? <p>None</p> : <p><b>{flagged.join(", ")}</b></p>}
          <p>Reports are stored in this browser and included in exports.</p>
        </div>
      </section>
    </div>
  );
}
