"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArtifactPlayer } from "@/components/artifact-player";
import { GenerationPanel } from "@/components/generation-panel";
import { ProfilePrep } from "@/components/profile-prep";
import { StaticGallery } from "@/components/static-gallery";
import { fractionProfiles } from "@/lib/fixtures";
import type { SupportProfile } from "@/lib/contracts";
import { findPossiblePii } from "@/lib/pii";

export default function Home() {
  if (process.env.NEXT_PUBLIC_STATIC_GALLERY === "true") return <StaticGallery />;
  return <LiveStudio />;
}

function LiveStudio() {
  const [lesson, setLesson] = useState("Teach equivalent fractions using a pizza divided into equal parts.");
  const [profiles, setProfiles] = useState<SupportProfile[]>(fractionProfiles);
  const [selected, setSelected] = useState<string[]>(fractionProfiles.map((profile) => profile.id));
  useEffect(() => { void fetch("/api/profiles").then((response) => response.ok ? response.json() : []).then((saved) => { if (saved.length) { setProfiles(saved); setSelected(saved.slice(0, 3).map((profile: SupportProfile) => profile.id)); } }); }, []);
  const findings = useMemo(() => findPossiblePii(lesson), [lesson]);
  const activeProfiles = profiles.filter((profile) => selected.includes(profile.id)).slice(0, 3);
  const evidence: Record<string, string> = { "short-concrete-loops": "Short loops and immediate rewards reflect meta-analytic findings on gamification for young learners.", "audio-first": "Audio-first, minimal text follows Universal Design for Learning guidance for reading barriers, often helpful for learners with dyslexia.", "math-language-support": "Worked examples before practice reflect cognitive-load research, supportive for language and processing differences." };
  return <main><header><div className="wordmark"><span className="wordmark-bend">L</span>esson<span>B</span>end</div><p className="eyebrow">Adaptive lesson studio</p><h1>Bend the lesson,<br />not the kid.</h1><p className="intro">Turn one learning goal into playful, supportive routes—without storing a child’s identity.</p></header><section className="grid"><div className="card lesson-card"><p className="eyebrow">1. Your lesson</p><h2>What are we learning today?</h2><textarea aria-label="Lesson input" value={lesson} onChange={(event) => setLesson(event.target.value)} />{findings.length > 0 ? <p className="warning">Possible personal information detected. Remove it before generation: {findings.map((finding) => finding.value).join(", ")}</p> : <p className="safe">Privacy check complete · no obvious personal information found.</p>}</div><div className="card profile-picker"><p className="eyebrow">2. Learner profiles</p><h2>Learner profiles</h2><p className="profile-explainer">Profiles describe support needs, never diagnoses.</p><div className="profiles">{profiles.map((profile, index) => <label key={profile.id} style={{ "--profile-color": ["#c68000", "#5663d8", "#d75a25", "#168b71", "#b34b95"][index % 5] } as CSSProperties} className={`profile-option ${selected.includes(profile.id) ? "chosen" : ""}`}><article><input type="checkbox" checked={selected.includes(profile.id)} onChange={() => setSelected((current) => current.includes(profile.id) ? current.filter((id) => id !== profile.id) : [...current, profile.id].slice(-3))} /><span className="profile-dot" /><h3>{profile.label}</h3><p>{profile.supports.join(" · ")}</p><small>{profile.constraints.join(" · ")}</small>{evidence[profile.id] && <details className="why-works"><summary>Why this works</summary><span>{evidence[profile.id]}</span></details>}</article></label>)}</div><ProfilePrep onSaved={(profile) => { setProfiles(current => [...current.filter((item) => item.id !== profile.id), profile]); setSelected(current => [...current.filter((id) => id !== profile.id), profile.id].slice(-3)); }} /></div></section><GenerationPanel lessonText={lesson} profiles={activeProfiles} /><details className="debug"><summary>Debug tools</summary><section className="review"><div><h2>Golden fraction fixture</h2><p>Hand-authored sandbox reference.</p></div><ArtifactPlayer /></section></details></main>;
}
