import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSeen, markSeen } from "@/lib/qbank/client";

function storage(): Storage {
  const values = new Map<string, string>();
  return { get length() { return values.size; }, clear: () => values.clear(), getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null, removeItem: key => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); } };
}
afterEach(() => vi.unstubAllGlobals());
describe("shown practice history", () => {
  it("persists without duplicates and keeps profiles separate", () => {
    vi.stubGlobal("window", { localStorage: storage(), sessionStorage: storage() });
    markSeen("question-1", "student-a"); markSeen("question-1", "student-a");
    expect(loadSeen("student-a")).toEqual(["question-1"]);
    expect(loadSeen("student-b")).toEqual([]);
  });
  it("stores guest questions in session storage only", () => {
    const localStorage = storage(); const sessionStorage = storage();
    vi.stubGlobal("window", { localStorage, sessionStorage });
    markSeen("guest-question", "guest");
    expect(loadSeen("guest")).toEqual(["guest-question"]);
    expect(sessionStorage.length).toBe(1);
    expect(localStorage.length).toBe(0);
  });
});
