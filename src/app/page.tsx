"use client";

import { useEffect, useMemo, useState } from "react";
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
  return <main><header><div className="wordmark"><span className="wordmark-bend">L</span>esson<span>B</span>end</div><p className="eyebrow">Adaptive lesson studio</p><h1>Bend the lesson,<br />not the kid.</h1><p className="intro">Turn one learning goal into playful, supportive routes—without storing a child’s identity.</p></header><section className="grid"><div className="card lesson-card"><p className="eyebrow">1. Your lesson</p><h2>What are we learning today?</h2><textarea aria-label="Lesson input" value={lesson} onChange={(event) => setLesson(event.target.value)} />{findings.length > 0 ? <p className="warning">Possible personal information detected. Remove it before generation: {findings.map((finding) => finding.value).join(", ")}</p> : <p className="safe">Privacy check complete · no obvious personal information found.</p>}</div><div className="card"><p className="eyebrow">2. Choose supports</p><h2>Pick up to three routes</h2><div className="profiles">{profiles.map((profile) => <label key={profile.id} className={`profile-option ${profile.id} ${selected.includes(profile.id) ? "chosen" : ""}`}><article><input type="checkbox" checked={selected.includes(profile.id)} onChange={() => setSelected((current) => current.includes(profile.id) ? current.filter((id) => id !== profile.id) : [...current, profile.id].slice(-3))} /><span className="profile-dot" /><h3>{profile.label}</h3><p>{profile.supports.join(" · ")}</p><small>{profile.constraints.join(" · ")}</small></article></label>)}</div></div></section><ProfilePrep onSaved={(profile) => { setProfiles(current => [...current, profile]); setSelected(current => [...current, profile.id].slice(-3)); }} /><GenerationPanel lessonText={lesson} profiles={activeProfiles} /><details className="debug"><summary>Debug tools</summary><section className="review"><div><h2>Golden fraction fixture</h2><p>Hand-authored sandbox reference.</p></div><ArtifactPlayer /></section></details></main>;
}
