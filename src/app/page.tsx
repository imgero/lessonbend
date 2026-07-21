"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArtifactPlayer } from "@/components/artifact-player";
import { GenerationPanel } from "@/components/generation-panel";
import { ProfilePrep } from "@/components/profile-prep";
import { StaticGallery } from "@/components/static-gallery";
import { fractionProfiles } from "@/lib/fixtures";
import type { SupportProfile } from "@/lib/contracts";
import { findPossiblePii } from "@/lib/pii";

const evidence: Record<string, { context: string; links: Array<{ label: string; href: string }> }> = {
  "short-concrete-loops": { context: "May be useful for learners with ADHD-related attention or organisation needs. This is a support context, not a diagnosis.", links: [{ label: "NICE ADHD guidance", href: "https://www.nice.org.uk/guidance/ng87/chapter/recommendations" }] },
  "audio-first": { context: "May be useful for dyslexia and other reading-access needs. This is a support context, not a diagnosis.", links: [{ label: "IDA dyslexia accommodations", href: "https://dyslexiaida.org/accommodations-for-students-with-dyslexia/" }, { label: "CAST UDL guidance", href: "https://udlguidelines.cast.org/representation/perception/ways-perceive-information/" }] },
  "math-language-support": { context: "May be useful for language-processing differences or learners new to a topic. This is a support context, not a diagnosis.", links: [{ label: "IES worked-example guidance", href: "https://ies.ed.gov/ncee/wwc/PracticeGuide/1" }, { label: "Worked-example research review", href: "https://link.springer.com/article/10.1007/s10648-010-9145-4" }] },
};

function ProfileEvidence({ profile }: { profile: SupportProfile }) {
  const item = evidence[profile.id] ?? (profile.whyMayHelp ? { context: profile.whyMayHelp, links: (profile.evidenceLinks ?? []).map(link => ({ label: link.label, href: link.href })) } : undefined);
  if (!item) return null;
  return <details className="why-works"><summary>Why this may help</summary><span>{item.context}</span><div className="evidence-links">{item.links.map(link => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div></details>;
}

export default function Home() {
  if (process.env.NEXT_PUBLIC_STATIC_GALLERY === "true") return <StaticGallery />;
  return <LiveStudio />;
}

function LiveStudio() {
  const [lesson, setLesson] = useState("Teach equivalent fractions using a pizza divided into equal parts.");
  const [profiles, setProfiles] = useState<SupportProfile[]>(fractionProfiles);
  const [selected, setSelected] = useState<string[]>(fractionProfiles.map(profile => profile.id));
  useEffect(() => { void fetch("/api/profiles").then(response => response.ok ? response.json() : []).then(saved => { if (saved.length) { setProfiles(saved); setSelected(saved.slice(0, 3).map((profile: SupportProfile) => profile.id)); } }); }, []);
  const findings = useMemo(() => findPossiblePii(lesson), [lesson]);
  const activeProfiles = profiles.filter(profile => selected.includes(profile.id)).slice(0, 3);
  return <main>
    <header><div className="wordmark"><span className="wordmark-bend">L</span>esson<span>B</span>end</div><p className="eyebrow">Adaptive lesson studio</p><h1>Bend the lesson,<br />not the kid.</h1><p className="intro">Turn one learning goal into playful, supportive routes—without storing a child’s identity.</p></header>
    <section className="grid">
      <div className="card lesson-card"><p className="eyebrow">1. Your lesson</p><h2>What are we learning today?</h2><textarea aria-label="Lesson input" value={lesson} onChange={event => setLesson(event.target.value)} />{findings.length > 0 ? <p className="warning">Possible personal information detected. Remove it before generation: {findings.map(finding => finding.value).join(", ")}</p> : <p className="safe">Privacy check complete · no obvious personal information found.</p>}</div>
      <div className="card profile-picker"><p className="eyebrow">2. Learner profiles</p><h2>Learner profiles</h2><p className="profile-explainer">Profiles describe support needs, never diagnoses.</p><div className="profiles">{profiles.map((profile, index) => <label key={profile.id} style={{ "--profile-color": profile.accent ?? ["#c68000", "#5663d8", "#d75a25", "#168b71", "#b34b95"][index % 5] } as CSSProperties} className={`profile-option ${selected.includes(profile.id) ? "chosen" : ""}`}><article><input type="checkbox" checked={selected.includes(profile.id)} onChange={() => setSelected(current => current.includes(profile.id) ? current.filter(id => id !== profile.id) : [...current, profile.id].slice(-3))} /><span className="profile-dot" /><h3>{profile.emoji ? `${profile.emoji} ` : ""}{profile.label}</h3><p className="profile-summary">{profile.supports.slice(0, 3).join(" · ")}</p>{(profile.supports.length > 3 || profile.constraints.length > 0) && <details className="profile-more"><summary>Show more</summary><span>{profile.supports.join(" · ")}{profile.constraints.length ? ` · ${profile.constraints.join(" · ")}` : ""}</span></details>}<ProfileEvidence profile={profile} /></article></label>)}</div><ProfilePrep usedIds={profiles.map(profile => profile.id)} onSaved={profile => { setProfiles(current => [...current.filter(item => item.id !== profile.id), profile]); setSelected(current => [...current.filter(id => id !== profile.id), profile.id].slice(-3)); }} /></div>
    </section>
    <GenerationPanel lessonText={lesson} profiles={activeProfiles} />
    <details className="debug"><summary>Debug tools</summary><section className="review"><div><h2>Golden fraction fixture</h2><p>Hand-authored sandbox reference.</p></div><ArtifactPlayer /></section></details>
  </main>;
}
