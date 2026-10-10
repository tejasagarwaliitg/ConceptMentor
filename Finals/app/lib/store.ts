"use client";
import { useCallback, useEffect, useState } from "react";
import { initialState, reduce, type Event } from "./engine";
import { loadStore, saveStore } from "./profiles";
import type { StudentState } from "./types";

const GUEST_KEY = "kadi.student.v1";

function loadGuest(): StudentState {
  try {
    const raw = window.sessionStorage.getItem(GUEST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StudentState;
      if (parsed?.version === 1 && parsed.nodes && parsed.weekly && Array.isArray(parsed.flaggedItems) && Array.isArray(parsed.seenInstances)) {
        return { ...parsed, activity: parsed.activity ?? [] };
      }
    }
  } catch {
    /* start fresh */
  }
  return initialState();
}

/**
 * State for one profile (or the guest session). The profile store itself is
 * owned by App (picker + switching); this hook loads the active profile's
 * engine state and writes every change back into the store, so the picker's
 * copy never goes stale. Saves after EVERY change (patchy networks, shared phones).
 */
export function useProfile(activeId: string | null, guest: boolean) {
  const [state, setState] = useState<StudentState | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      if (guest) {
        setState(loadGuest());
        return;
      }
      const store = loadStore(window.localStorage);
      const p = activeId ? store.profiles[activeId] : undefined;
      setState(p ? { ...p.state, activity: p.state.activity ?? [] } : initialState());
    });
  }, [guest, activeId]);

  useEffect(() => {
    if (!state) return;
    try {
      if (guest) {
        window.sessionStorage.setItem(GUEST_KEY, JSON.stringify(state));
      } else if (activeId) {
        const store = loadStore(window.localStorage);
        const p = store.profiles[activeId];
        if (p) saveStore(window.localStorage, { ...store, profiles: { ...store.profiles, [activeId]: { ...p, state } } });
      }
    } catch {
      /* storage full or blocked */
    }
  }, [guest, activeId, state]);

  const send = useCallback((ev: Event) => {
    setState((s) => (s ? reduce(s, ev) : s));
  }, []);

  return { state: state ?? initialState(), send, ready: state !== null };
}
