"use client";
import { useState } from "react";
import type { Event } from "@/lib/state";
import { parseImport } from "@/lib/importer";
import { loadStore } from "@/lib/profiles";
import { t } from "@/lib/copy";
import {
  clearNotifyCode,
  getNotifyCode,
  requestLinkCode,
  setNotifyCode,
  unlinkNotify,
} from "@/lib/api";
import type { StudentState } from "@/lib/types";
import { Settings } from "./Settings";

/** Thin wrapper: wires export / import / delete / per-profile Telegram link. */
export function SettingsScreen({ state, send, guest, onBack }: { state: StudentState; send: (e: Event) => void; guest: boolean; onBack: () => void }) {
  // The active profile is resolved from the store (owned by App); the link
  // code is keyed by profile id, so reminders always belong to one person.
  const active = !guest ? loadStore(window.localStorage) : null;
  const pid = active?.activeId ?? null;
  const profile = pid ? active!.profiles[pid] : undefined;
  const [notifyCode, setCode] = useState<string | null>(() => (pid ? getNotifyCode(pid) : null));
  const [notifyMsg, setMsg] = useState<string | null>(null);
  const c = t().remind;

  return (
    <Settings
      settings={state.settings}
      flagged={state.flaggedItems}
      guest={guest}
      pid={pid}
      isDemo={profile?.isDemo ?? false}
      notifyCode={notifyCode}
      notifyMsg={notifyMsg}
      onGetCode={async () => {
        if (!pid) return;
        const r = await requestLinkCode();
        if (!r) {
          setMsg("Code nahi mil paya. Dobara try karo.");
          return;
        }
        setNotifyCode(pid, r.code);
        setCode(r.code);
        setMsg(c.codeReady(r.code));
      }}
      onUnlink={async () => {
        if (pid && notifyCode) await unlinkNotify(notifyCode);
        if (pid) clearNotifyCode(pid);
        setCode(null);
        setMsg(c.stopped);
      }}
      onChange={(s) => send({ type: "setSettings", settings: s })}
      onExport={() => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "my-progress.json";
        a.click();
        URL.revokeObjectURL(a.href);
      }}
      onImport={async (f) => {
        const parsed = parseImport(await f.text());
        if (!parsed) return alert("This file could not be validated. Nothing was imported.");
        send({ type: "load", state: parsed });
      }}
      onDelete={() => {
        if (pid) {
          const code = getNotifyCode(pid); // delete-my-data also deletes the reminder binding
          if (code) void unlinkNotify(code);
          clearNotifyCode(pid);
        }
        send({ type: "reset" });
        onBack();
      }}
      onBack={onBack}
    />
  );
}
