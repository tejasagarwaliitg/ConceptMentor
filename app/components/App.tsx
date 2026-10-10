"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GRAPH, LIVE_NODES } from "@/content/graph";
import { nextStep, now, probesRemaining, reduce } from "@/lib/engine";
import { getNotifyCode, syncNotify } from "@/lib/api";
import { usualActiveHour } from "@/lib/rhythm";
import { t } from "@/lib/copy";
import { MAX_PROBES, type GradedAnswer, type NodeId, type StudentState } from "@/lib/types";
import { useProfile } from "@/lib/store";
import {
  DEMO_PROFILE_ID,
  createProfile,
  ensureDemoProfile,
  freshStore,
  loadStore,
  saveStore,
  type NewProfileInput,
  type Profile,
  type ProfileStore,
} from "@/lib/profiles";
import { buildDemoState } from "@/lib/seed";
import { MapView } from "./MapView";
import { Outcome } from "./Outcome";
import { Question } from "./Question";
import { Repair } from "./Repair";
import { SettingsScreen } from "./SettingsScreen";
import { Stuck } from "./Stuck";
import { Today } from "./Today";
import { Shell } from "./Shell";
import { Intake } from "./Intake";
import { Practice } from "./Practice";
import { ProfilePicker } from "./ProfilePicker";
import { BookOpen, ArrowLeft } from "lucide-react";

export type Screen =
  | { name: "intake" }
  | { name: "today" }
  | { name: "probe"; node: NodeId; itemType: "B1" | "A" }
  | { name: "outcome" }
  | { name: "repair"; node: NodeId }
  | { name: "stuck"; node: NodeId }
  | { name: "recheck"; node: NodeId }
  | { name: "map" }
  | { name: "practice" }
  | { name: "settings" }
  | { name: "unavailable"; node: NodeId };

function loadingCard() {
  return <div className="app-shell"><main className="learning-main"><div className="learning-card loading-card" role="status"><span className="loading-orbit"/>Loading your progress…</div></main></div>;
}

export function App({ draftPreview = false }: { draftPreview?: boolean }) {
  const [guest, setGuest] = useState(false);
  const [store, setStore] = useState<ProfileStore | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try { setStore(loadStore(window.localStorage)); }
      catch { setStore(freshStore()); }
    });
    return () => { active = false; };
  }, []);

  const persist = useCallback((next: ProfileStore) => {
    try {
      saveStore(window.localStorage, next);
    } catch {
      /* storage full or blocked */
    }
    setStore(next);
  }, []);

  if (!store) return loadingCard();
  const base = store;

  function select(id: string | null) {
    persist({ ...base, activeId: id });
  }
  function create(input: NewProfileInput) {
    const profile = createProfile(input);
    persist({ ...base, activeId: profile.id, profiles: { ...base.profiles, [profile.id]: profile } });
  }
  function useDemo() {
    if (base.profiles[DEMO_PROFILE_ID]) {
      select(DEMO_PROFILE_ID);
      return;
    }
    const demo: Profile = ensureDemoProfile(buildDemoState());
    persist({ ...base, activeId: demo.id, profiles: { ...base.profiles, [demo.id]: demo } });
  }
  function switchProfile() {
    setGuest(false);
    persist({ ...base, activeId: null });
  }

  const activeId = base.activeId;
  const activeProfile = !guest && activeId ? base.profiles[activeId] ?? null : null;
  if (!guest && !activeProfile) {
    return (
      <ProfilePicker
        store={base}
        onSelect={select}
        onCreate={create}
        onUseDemo={useDemo}
        onGuest={() => setGuest(true)}
      />
    );
  }
  return (
    <StudentApp
      key={`${guest ? "guest" : "profile"}:${activeId ?? "none"}`}
      activeId={activeId}
      profile={activeProfile}
      guest={guest}
      setGuest={setGuest}
      draftPreview={draftPreview}
      onSwitchProfile={switchProfile}
    />
  );
}
function StudentApp({ activeId, profile, guest, setGuest, draftPreview, onSwitchProfile }: { activeId: string | null; profile: Profile | null; guest: boolean; setGuest: (guest: boolean) => void; draftPreview: boolean; onSwitchProfile: () => void }) {
  const { state, send, ready } = useProfile(activeId, guest);
  const [screen, setScreen] = useState<Screen>({ name: "today" });
  const [tag, setTag] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const synced = useRef(false);
  const session = state.session;

  const route = useCallback((s: StudentState) => {
    const sess = s.session;
    if (!sess) return setScreen({ name: "today" });
    const step = nextStep(sess);
    if (step.kind === "item" && step.node && step.itemType) {
      setScreen({ name: "probe", node: step.node, itemType: step.itemType });
    } else setScreen({ name: "outcome" });
  }, []);

  const home = useCallback(() => {
    send({ type: "endSession" });
    setScreen({ name: "today" });
  }, [send]);

  function start(node: NodeId) {
    setTag(null);
    send({ type: "startSession", entry: node, at: now(state), sessionId: crypto.randomUUID() });
    setScreen({ name: "probe", node, itemType: "B1" });
  }

  function onProbeGraded(a: GradedAnswer, info: { tag?: string | null }) {
    if (info.tag) setTag(info.tag);
    send({ type: "graded", answer: a });
    // the engine is a pure reducer, so the next screen can be computed from the same event
    route(reduce(state, { type: "graded", answer: a }));
  }

  const highlight = useMemo<NodeId[]>(() => {
    if (!session) return [];
    return [...new Set([session.entry, ...(Object.keys(session.probed) as NodeId[])])];
  }, [session]);

  // Notify sync (WP-A): once per boot, non-guest only. The engine stays
  // authoritative — bot intents are applied as reducer events (invalid ones ignored).
  useEffect(() => {
    if (!ready || guest || synced.current) return;
    synced.current = true;
    const openRecheck = (node: string | null) => {
      if (node && (LIVE_NODES as string[]).includes(node)) {
        const n = node as NodeId;
        send({ type: "startSession", entry: n, at: now(state), sessionId: crypto.randomUUID() });
        setScreen({ name: "recheck", node: n });
      }
    };
    const recheck = new URLSearchParams(window.location.search).get("recheck");
    const code = getNotifyCode();
    if (!code) {
      openRecheck(recheck);
      return;
    }
    const due = (Object.keys(state.nodes) as NodeId[])
      .filter((n) => state.nodes[n]?.nextRecheck !== undefined)
      .map((n) => ({ node: n, dueAt: state.nodes[n]!.nextRecheck! }));
    // study rhythm for the inactivity nudge: usual hour from real history
    // (null until ≥5 sessions across ≥2 days), plus timezone + last activity.
    const tzOffsetMin = -new Date().getTimezoneOffset();
    const usualHour = usualActiveHour(state.activity ?? [], tzOffsetMin);
    const log = state.activity ?? [];
    const rhythm =
      usualHour === null
        ? undefined
        : { usualHour, tzOffsetMin, lastActiveAt: log.length > 0 ? log[log.length - 1] : null };
    void syncNotify(code, due, rhythm).then((res) => {
      if (!res?.linked) {
        openRecheck(recheck);
        return;
      }
      for (const it of res.intents) {
        for (const d of due) send({ type: "setRecheckChoice", node: d.node, days: it.days, at: it.at });
      }
      if (res.intents.length > 0) setNotice(t().remind.appliedInApp);
      openRecheck(recheck);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return loadingCard();

  const content = () => {
  switch (screen.name) {
    case "intake":
      return (
        <div className="learning-card intake-card">
          <div className="question-top"><span>START WITH YOUR OWN QUESTION</span></div>
          <Intake
            owner={guest ? null : activeId}
            onSettings={() => setScreen({ name: "settings" })}
            onMapped={(node) => start(node)}
            onChapter={() => setScreen({ name: "today" })}
            onSkip={() => setScreen({ name: "today" })}
          />
        </div>
      );
    case "today":
      return (
        <Today
          state={state}
          draftPreview={draftPreview}
          guest={guest}
          notice={notice}
          onGuest={setGuest}
          profile={profile ? { displayName: profile.displayName, classLabel: profile.classLabel, targetExam: profile.targetExam } : null}
          isDemo={profile?.isDemo ?? false}
          onSwitchProfile={onSwitchProfile}
          onCommit={(node, days) => send({ type: "setRecheckChoice", node, days, at: now(state) })}
          onStart={start}
          onIntake={() => setScreen({ name: "intake" })}
          onRecheck={(n) => {
            send({ type: "startSession", entry: n, at: now(state), sessionId: crypto.randomUUID() });
            setScreen({ name: "recheck", node: n });
          }}
          onSimulate={(d) => send({ type: "simulateDays", days: d })}
          onMap={() => setScreen({ name: "map" })}
          onPractice={() => setScreen({ name: "practice" })}
          onSettings={() => setScreen({ name: "settings" })}
        />
      );

    case "practice":
      return <Practice historyScope={guest ? "guest" : activeId ?? "device"} onBack={() => setScreen({ name: "today" })} />;

    case "map":
      return <MapView state={state} highlight={highlight} isDemo={profile?.isDemo ?? false} onBack={() => setScreen({ name: "today" })} />;

    case "settings":
      return <SettingsScreen state={state} send={send} guest={guest} onBack={() => setScreen({ name: "today" })} />;

    case "unavailable":
      return (
        <div className="learning-card unavailable-card">
          <span className="feature-icon"><BookOpen size={25}/></span>
          <p className="eyebrow">CONTENT REVIEW</p>
          <h1>This check is not available yet.</h1>
          <p>A fresh question for {GRAPH[screen.node].name.toLowerCase()} is not available in this review set. Your progress has not changed. Try again when more questions are available.</p>
          <a className="button primary" href={GRAPH[screen.node].ncertUrl} target="_blank" rel="noopener noreferrer">Read the NCERT reference <BookOpen size={16}/></a>
          <button onClick={home} className="button secondary"><ArrowLeft size={16}/> Back to topics</button>
        </div>
      );

    case "probe":
      if (!session) return null;
      return (
        <Question
          key={`${screen.node}-${screen.itemType}-${session.answers.length}`}
          node={screen.node}
          type={screen.itemType}
          progress={`Question ${Math.min(session.probeCount + 1, MAX_PROBES)} of up to ${MAX_PROBES} · ${probesRemaining(session)} remaining`}
          exclude={[...new Set([...(state.seenQuestionIds ?? []), ...Object.values(state.recentItems ?? {}).flatMap(ids => ids ?? [])])]}
          onPresented={(itemId) => send({ type: "itemPresented", itemId })}
          onGraded={onProbeGraded}
          onUnavailable={() => setScreen({ name: "unavailable", node: screen.node })}
          onLater={home}
          onFlag={(id) => send({ type: "flagItem", itemId: id })}
        />
      );

    case "outcome": {
      if (!session?.outcome) return null;
      const suspected = session.suspected ?? session.entry;
      return (
        <Outcome
          session={session}
          settings={state.settings}
          tag={tag}
          onRepair={(n) => setScreen({ name: "repair", node: n })}
          onStuck={() => setScreen({ name: "stuck", node: session.entry })}
          onDispute={() => {
            send({ type: "dispute" });
            setScreen({ name: "stuck", node: suspected });
          }}
          onDone={home}
        />
      );
    }

    case "repair":
      if (!session) return null;
      return (
        <Repair
          node={screen.node}
          session={session}
          settings={state.settings}
          tag={tag}
          exclude={[...new Set([...(state.seenQuestionIds ?? []), ...Object.values(state.recentItems ?? {}).flatMap(ids => ids ?? [])])]}
          onPresented={(itemId) => send({ type: "itemPresented", itemId })}
          order={null}
          onGraded={(a) => send({ type: "graded", answer: a })}
          onFlag={(id) => send({ type: "flagItem", itemId: id })}
          onFeedback={(id, v) => send({ type: "setSettings", settings: { videoFeedback: { ...(state.settings.videoFeedback ?? {}), [id]: v } } })}
          onDone={home}
        />
      );

    case "stuck":
      return <Stuck node={screen.node} suggested={null} onDone={home} settings={state.settings} />;

    case "recheck":
      if (!session) return null;
      return (
        <Question
          node={screen.node}
          type="B2"
          exclude={[...new Set([...(state.seenQuestionIds ?? []), ...Object.values(state.recentItems ?? {}).flatMap(ids => ids ?? [])])]}
          onPresented={(itemId) => send({ type: "itemPresented", itemId })}
          progress="Review check · about 2 minutes"
          onGraded={(a) => {
            send({ type: "graded", answer: a });
            // a wrong submission is evidence the concept needs another look:
            // lead straight to the review for it (contrast, check and its video)
            if (a.correct === false) setScreen({ name: "repair", node: screen.node });
            else home();
          }}
          onUnavailable={() => setScreen({ name: "unavailable", node: screen.node })}
          onLater={home}
          onFlag={(id) => send({ type: "flagItem", itemId: id })}
        />
      );
  }
  };
  return <Shell active={screen.name} guest={guest} onHome={home} onMap={() => setScreen({ name: "map" })} onPractice={() => setScreen({ name: "practice" })} onSettings={() => setScreen({ name: "settings" })}>{content()}</Shell>;
}
