"use client";

import { useMemo, type CSSProperties } from "react";
import type { SupportProfile } from "@/lib/contracts";

type Event = { profileId: string; type?: "lessonbend.checkpoint" | "lessonbend.complete"; outcome?: "mastered" | "retry" | null; stepIndex?: number | null; totalSteps?: number | null; at: number };

function demoEvents(profiles: SupportProfile[]): Event[] {
  return profiles.flatMap((profile, profileIndex) => Array.from({ length: 5 }, (_, index) => ({ profileId: profile.id, type: "lessonbend.checkpoint" as const, stepIndex: index + 1, totalSteps: 5, outcome: index === 2 && profileIndex !== 0 ? "retry" as const : "mastered" as const, at: Date.now() - (5 - index) * (profileIndex + 1) * 18000 })));
}

const formatDuration = (seconds: number) => seconds < 60 ? `${Math.max(1, seconds)}s` : `${Math.round(seconds / 60)} min`;

export function ClassInsights({ runId, profiles, demo = runId === "gallery-demo" }: { runId: string; profiles: SupportProfile[]; demo?: boolean }) {
  const events = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`lessonbend-insights:${runId}`) ?? "[]") as Event[];
      const live = saved.filter(event => demo || Boolean(event.stepIndex));
      return live.length ? live : demo ? demoEvents(profiles) : [];
    } catch { return demo ? demoEvents(profiles) : []; }
  }, [runId, profiles, demo]);
  const totalSteps = Math.max(0, ...events.map(event => event.totalSteps ?? event.stepIndex ?? 0));
  const aggregate = Array.from({ length: totalSteps }, (_, index) => {
    const stepIndex = index + 1;
    const hits = events.filter(event => event.type !== "lessonbend.complete" && event.stepIndex === stepIndex).sort((a, b) => a.at - b.at);
    return { id: `step-${stepIndex}`, retries: hits.filter(hit => hit.outcome === "retry").length, time: hits.length > 1 ? Math.round((hits.at(-1)!.at - hits[0].at) / 1000) : 0 };
  });
  const longest = [...aggregate].sort((a, b) => b.time - a.time || b.retries - a.retries)[0];
  const mostRetries = [...aggregate].sort((a, b) => b.retries - a.retries)[0];
  return <section className="class-insights">
    <p className="eyebrow">{demo ? "Demo class insight" : "Class insight"}</p>
    <h2>Patterns by route, never judgments.</h2>
    <p className="insight-privacy">{demo ? "Illustrative gallery data only—not a student session." : "Anonymous profile-level session data only. No student names or identities are stored."}</p>
    {!events.length ? <p className="insight-empty">No activity yet. Play a lesson to begin this anonymous profile-level view.</p> : <>
      <div className="insight-grid">{profiles.map((profile, index) => {
        const own = events.filter(event => event.profileId === profile.id && event.type !== "lessonbend.complete");
        const profileTotal = Math.max(0, ...own.map(event => event.totalSteps ?? event.stepIndex ?? 0));
        const mastered = new Set(own.filter(event => event.outcome === "mastered").map(event => event.stepIndex)).size;
        const retries = own.filter(event => event.outcome === "retry").length;
        const percent = Math.round((mastered / Math.max(profileTotal, 1)) * 100);
        const duration = own.length > 1 ? Math.round((Math.max(...own.map(event => event.at)) - Math.min(...own.map(event => event.at))) / 1000) : 0;
        const interpretation = profile.id === "short-concrete-loops" ? "Short bursts with quick advances match the short-loop route working as intended." : profile.id === "math-language-support" ? "Longer time on worked-example steps is expected: processing time is part of the design." : "Extended time plus retries on text-dense steps may signal an access barrier; consider the audio route next time.";
        return <article className="insight-card" key={profile.id} style={{ "--profile-color": profile.accent ?? ["#c68000", "#5663d8", "#d75a25"][index % 3] } as CSSProperties}>
          <h3>{profile.emoji ?? "●"} {profile.label}</h3>
          <div className="insight-bar"><i style={{ width: `${percent}%` }} /></div>
          <p><b>{percent}% complete</b> · {formatDuration(duration)} · {retries} retries</p>
          <div className="step-timeline">{Array.from({ length: profileTotal }, (_, index) => {
            const stepIndex = index + 1;
            const hits = own.filter(event => event.stepIndex === stepIndex).sort((a, b) => a.at - b.at);
            const last = hits.at(-1);
            const stepDuration = hits.length > 1 ? Math.round((last!.at - hits[0].at) / 1000) : 0;
            return <span className={last?.outcome === "retry" ? "retry" : last ? hits.length > 1 ? "retry" : "first" : "stuck"} key={stepIndex}>S{stepIndex}<small>{last ? formatDuration(stepDuration) : "stopped"}</small></span>;
          })}</div>
          <p className="insight-copy">{interpretation}</p>
          <small>Based on: {profile.supports.slice(0, 2).join(" · ")}</small>
        </article>;
      })}</div>
      <div className="aggregate"><b>Across routes</b><span>Longest: {longest?.id ?? "—"}</span><span>Most retries: {mostRetries?.id ?? "—"}</span></div>
    </>}
  </section>;
}
