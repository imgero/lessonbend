"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ClassInsights } from "@/components/class-insights";
import { artifactEventSchema, type SupportProfile } from "@/lib/contracts";

type Artifact = { id: string; profile_id: string; html: string | null; status: string };
type RunData = { run: { id: string; status: string; error?: string } | null; events: Array<{ status: string; detail: string; created_at: string }>; modelCalls: Array<{ stage: string; total_tokens: number | null }>; artifacts: Artifact[] };
type GalleryRun = { id: string; lesson_text: string; created_at: string; profile_count: number };

function GeneratedFrame({ html, label, profileId, accent, runId }: { html: string; label: string; profileId: string; accent?: string | null; runId?: string }) {
  const [state, setState] = useState("waiting");
  const [open, setOpen] = useState(false);
  const connectFrame = useCallback((frame: HTMLIFrameElement | null) => {
    const channel = new MessageChannel();
    const token = crypto.randomUUID();
    channel.port1.onmessage = (event) => {
      const parsed = artifactEventSchema.safeParse(event.data);
      if (!parsed.success || parsed.data.token !== token) return;
      setState(parsed.data.type.replace("lessonbend.", ""));
      if (runId && (parsed.data.type === "lessonbend.checkpoint" || parsed.data.type === "lessonbend.complete")) {
        const key = `lessonbend-insights:${runId}`;
        const rows = JSON.parse(localStorage.getItem(key) ?? "[]");
        rows.push({ profileId, type: parsed.data.type, checkpointId: parsed.data.type === "lessonbend.checkpoint" ? parsed.data.checkpointId : null, outcome: parsed.data.type === "lessonbend.checkpoint" ? parsed.data.outcome : null, stepIndex: parsed.data.stepIndex ?? null, totalSteps: parsed.data.totalSteps ?? null, at: parsed.data.timestamp ?? Date.now() });
        localStorage.setItem(key, JSON.stringify(rows));
      }
    };
    frame?.contentWindow?.postMessage({ type: "lessonbend.init", token }, "*", [channel.port2]);
  }, [profileId, runId]);
  return <><article style={{ "--profile-color": accent } as CSSProperties} className={`generated-frame ${profileId}`}><p><strong>{label}</strong><span>{state}</span></p><iframe title={`${label} generated artifact`} sandbox="allow-scripts" srcDoc={html} onLoad={(event) => connectFrame(event.currentTarget)} /><button className="start-lesson" onClick={() => setOpen(true)}>Start lesson</button></article>{open && <div className="lesson-fullscreen" role="dialog" aria-modal="true"><button className="exit-lesson" onClick={() => setOpen(false)}>Exit lesson</button><iframe title={`${label} fullscreen lesson`} sandbox="allow-scripts" srcDoc={html} onLoad={(event) => connectFrame(event.currentTarget)} /></div>}</>;
}

function stageFor(status = "") { if (status.includes("decomposition")) return 0; if (status === "decomposed" || status.includes("artifact_generation") || status.includes("repair")) return 1; if (status.includes("static") || status.includes("browser") || status.includes("evaluation")) return 2; return 3; }
function friendlyLiveStatus(status = "", detail = "") {
  const profile = detail.match(/^(Pineapple|Blueberry|Mango|Banana|Kiwi|Strawberry):/)?.[1];
  if (status.includes("decomposition")) return "Reading your lesson and finding the tricky bits…";
  if (status === "decomposed") return "The goal is clear. Designing each learner route…";
  if (status.includes("artifact_generation") || status.includes("repair")) return `${profile ? `Creating ${profile}'s version` : "Creating each learner version"}…`;
  if (status.includes("browser") || status.includes("static") || status.includes("evaluation")) return `${profile ? `Quality-checking ${profile}'s version` : "Quality-checking each version"}…`;
  if (status.includes("audio")) return "Adding the optional spoken directions…";
  return "Working through the lesson routes…";
}
function errorMessage(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const candidate = value as { formErrors?: unknown; fieldErrors?: Record<string, unknown> };
    const form = Array.isArray(candidate.formErrors) ? candidate.formErrors.filter((item): item is string => typeof item === "string") : [];
    const fields = Object.values(candidate.fieldErrors ?? {}).flat().filter((item): item is string => typeof item === "string");
    return [...form, ...fields].join(" ") || "Please check the lesson and selected profiles, then try again.";
  }
  return "Generation could not start. Please try again.";
}

export function GenerationPanel({ lessonText, profiles }: { lessonText: string; profiles: SupportProfile[] }) {
  const [runId, setRunId] = useState<string>();
  const [run, setRun] = useState<RunData>();
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(0);
  const [gallery, setGallery] = useState<GalleryRun[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  useEffect(() => { void fetch("/api/runs?latest=1", { cache: "no-store" }).then(r => r.ok ? r.json() : undefined).then((next) => { if (next) { setRun(next); setRunId(next.run?.id); } }); void fetch("/api/runs?gallery=1").then(r => r.ok ? r.json() : []).then(setGallery); }, []);
  useEffect(() => { if (!runId) return; const poll = async () => { const response = await fetch(`/api/runs/${runId}`, { cache: "no-store" }); if (response.ok) setRun(await response.json()); }; void poll(); const interval = window.setInterval(poll, 1000); return () => window.clearInterval(interval); }, [runId]);
  useEffect(() => { const interval = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(interval); }, []);
  const start = useCallback(async () => { setStarting(true); setShowInsights(false); setRun(undefined); const response = await fetch("/api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonText, profiles }) }); const data = await response.json(); if (response.ok) setRunId(data.id); else setRun({ run: { id: "local-error", status: "failed", error: errorMessage(data.error) }, events: [], modelCalls: [], artifacts: [] }); setStarting(false); }, [lessonText, profiles]);
  const status = run?.run?.status ?? "";
  const active = Boolean(run?.run && !["failed", "cancelled", "approved", "ready_for_approval"].includes(status));
  const stage = stageFor(status);
  const started = run?.events[0];
  const latestEvent = run?.events.at(-1);
  const elapsed = started ? Math.max(0, Math.floor((now - new Date(started.created_at).getTime()) / 1000)) : 0;
  const total = run?.modelCalls.reduce((sum, call) => sum + (call.total_tokens ?? 0), 0) ?? 0;
  const profile = (id: string) => profiles.find(p => p.id === id);
  const profileLabel = (id: string) => profile(id)?.label ?? id;
  const galleryItems = Array.from(new Map(gallery.map((item) => [item.lesson_text.trim().toLowerCase(), item])).values());
  const complete = Boolean(run?.run && !active && !run.run.error);
  const hasArtifacts = Boolean(run?.artifacts?.some((artifact) => artifact.html));
  const canShowInsights = Boolean(run?.run && !active && hasArtifacts);
  const failed = status === "failed";
  return <section className="engine">
    <div><p className="eyebrow">3. Generation</p><h2>Generate three routes to the same goal</h2><p>Your lesson, bent three ways—usually about two minutes.</p></div>
    <button className="generate" disabled={starting || active} onClick={() => void start()}>{active ? "Bending your lesson…" : starting ? "Starting…" : "Generate"}</button>
    {active && latestEvent && <p className="live-generation-status" role="status"><span aria-hidden="true" />{friendlyLiveStatus(latestEvent.status, latestEvent.detail)} <b>{elapsed}s</b></p>}
    {run && <>
      <div className="friendly-progress">{[["Reading your lesson", "Finding the goal and the tricky bits."], ["Designing each route", profiles.map(p => p.label).join(" · ")], ["Creating each version", run.artifacts.length ? run.artifacts.map(a => `${profileLabel(a.profile_id)}: ${a.status.replaceAll("_", " ")}`).join(" · ") : "Preparing the learner routes."], ["Quality check", "Checking that every lesson is safe, clear, and playable."]].map(([title, detail], index) => <article key={title} className={index < stage || (!active && status === "ready_for_approval") ? "complete" : index === stage && active ? "current" : ""}><b>{index < stage ? "✓" : index === stage && active ? "↝" : "○"} {title}</b><span>{detail}{index === stage && active ? ` · ${elapsed}s` : ""}</span></article>)}</div>
      {failed && <section className="generation-retry" aria-live="polite"><b>This route needs another pass.</b><span>Nothing has been shared. You can regenerate this route when you’re ready.</span><button className="approve" onClick={() => void start()}>Regenerate this route</button></section>}
      {status === "cancelled" && <p className="warning">This version was stopped. You can generate a new route whenever you’re ready.</p>}
      {run.artifacts.length > 0 && <div className="generated-grid">{run.artifacts.map(a => a.html && <GeneratedFrame key={a.id} profileId={a.profile_id} label={profileLabel(a.profile_id)} accent={profile(a.profile_id)?.accent} html={a.html} runId={run.run?.id} />)}</div>}
      {canShowInsights && <button className="approve" onClick={() => setShowInsights(current => !current)}>{showInsights ? "Hide insights" : "View insights"}</button>}
      {showInsights && run.run && <ClassInsights runId={run.run.id} profiles={profiles} />}
      <details className="technical-run"><summary>Debug run details</summary><p>{run.modelCalls.length} model calls · {total.toLocaleString()} tokens</p><div className="timeline">{run.events.map((entry, index) => <div key={`${entry.created_at}-${index}`}><b>{entry.status.replaceAll("_", " ")}</b><span>{entry.detail}</span></div>)}</div></details>
    </>}
    {galleryItems.length > 0 && <section className="past-lessons"><p className="eyebrow">Past lessons</p><h3>Open a previous run</h3><label className="gallery-picker">Choose a saved lesson <select value={runId ?? ""} onChange={async e => { const response = await fetch(`/api/runs/${e.target.value}`); if (response.ok) { const next = await response.json(); setRun(next); setRunId(e.target.value); setShowInsights(false); } }}>{galleryItems.map(item => <option key={item.id} value={item.id}>{new Date(item.created_at).toLocaleDateString()} · {item.profile_count} profiles · {item.lesson_text.slice(0, 48)}</option>)}</select></label></section>}
  </section>;
}
