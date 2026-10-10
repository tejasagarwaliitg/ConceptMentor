import { initialState } from "./state";
import type { StudentState } from "./types";

/**
 * Profiles. Each profile owns its full engine state — activity logs, due
 * dates and (via the link code below) bot bindings are always per-person.
 * Guest mode never touches this store.
 */

export interface NewProfileInput {
  displayName: string;
  classLabel?: string;
  targetExam?: string;
}

export interface Profile {
  id: string;
  displayName: string;
  classLabel?: string;
  targetExam?: string;
  isDemo: boolean; // all seeded history is simulated data
  createdAt: number;
  state: StudentState;
}

export interface ProfileStore {
  activeId: string | null; // null = show the profile picker
  profiles: Record<string, Profile>;
}

export const DEMO_PROFILE_ID = "demo";
export const PROFILES_KEY = "kadi.profiles.v1";
const LEGACY_KEY = "kadi.student.v1";

function rid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function createProfile(input: NewProfileInput, createdAt = Date.now()): Profile {
  return {
    id: rid("p"),
    displayName: input.displayName.trim().slice(0, 80) || "Student",
    classLabel: input.classLabel?.trim().slice(0, 40) || undefined,
    targetExam: input.targetExam?.trim().slice(0, 80) || undefined,
    isDemo: false,
    createdAt,
    state: initialState(),
  };
}

export function ensureDemoProfile(state: StudentState): Profile {
  return {
    id: DEMO_PROFILE_ID,
    displayName: "Aarav (demo)",
    classLabel: "Class 12",
    targetExam: "JEE Main 2027",
    isDemo: true,
    createdAt: Date.now(),
    state,
  };
}

function validState(s: unknown): s is StudentState {
  if (!s || typeof s !== "object") return false;
  const st = s as Record<string, unknown>;
  return (
    st.version === 1 &&
    typeof st.settings === "object" &&
    typeof st.nodes === "object" &&
    Array.isArray(st.seenInstances) &&
    typeof st.weekly === "object" &&
    Array.isArray(st.flaggedItems)
  );
}

function validProfile(p: unknown): p is Profile {
  if (!p || typeof p !== "object") return false;
  const q = p as Record<string, unknown>;
  return typeof q.id === "string" && typeof q.displayName === "string" && validState(q.state);
}

export function freshStore(): ProfileStore {
  return { activeId: null, profiles: {} };
}

/** Never throws: corrupt store -> legacy single student -> fresh picker. */
export function loadStore(storage: Pick<Storage, "getItem">): ProfileStore {
  try {
    const raw = storage.getItem(PROFILES_KEY);
    if (raw) {
      const j = JSON.parse(raw) as Partial<ProfileStore>;
      if (j && typeof j.profiles === "object" && j.profiles) {
        const profiles: Record<string, Profile> = {};
        for (const [k, v] of Object.entries(j.profiles)) {
          if (validProfile(v) && v.id === k) {
            v.state.activity ??= [];
            profiles[k] = v;
          }
        }
        const activeId = typeof j.activeId === "string" && profiles[j.activeId] ? j.activeId : null;
        return { activeId, profiles };
      }
    }
  } catch {
    /* fall through */
  }
  try {
    const raw = storage.getItem(LEGACY_KEY);
    if (raw) {
      const j = JSON.parse(raw) as StudentState;
      if (validState(j)) {
        const p = createProfile({ displayName: "You" });
        p.state = { ...j, activity: j.activity ?? [] };
        return { activeId: p.id, profiles: { [p.id]: p } };
      }
    }
  } catch {
    /* fall through */
  }
  return freshStore();
}

export function saveStore(storage: Pick<Storage, "setItem">, store: ProfileStore): void {
  storage.setItem(PROFILES_KEY, JSON.stringify(store));
}
