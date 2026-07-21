"use client";

import { useState } from "react";
import { staticGallery, type StaticGalleryArtifact } from "@/lib/static-gallery";
import { ClassInsights } from "@/components/class-insights";
import type { SupportProfile } from "@/lib/contracts";

const demoProfiles: SupportProfile[] = [
  { id: "pineapple", label: "Pineapple", emoji: "🍍", accent: "#c68000", supports: ["short loops", "immediate rewards"], constraints: [], whyMayHelp: null, evidenceLinks: null },
  { id: "blueberry", label: "Blueberry", emoji: "🫐", accent: "#5663d8", supports: ["audio-first", "minimal text"], constraints: [], whyMayHelp: null, evidenceLinks: null },
  { id: "mango", label: "Mango", emoji: "🥭", accent: "#d75a25", supports: ["worked examples", "vocabulary"], constraints: [], whyMayHelp: null, evidenceLinks: null },
];

function LessonCard({ artifact }: { artifact: StaticGalleryArtifact }) {
  const [open, setOpen] = useState(false);
  return <><article className={`generated-frame ${artifact.profileId}`}><p><strong>{artifact.label}</strong><span>ready to play</span></p><iframe title={`${artifact.label} lesson`} sandbox="allow-scripts" srcDoc={artifact.html} /><button className="start-lesson" onClick={() => setOpen(true)}>Start lesson</button></article>{open && <div className="lesson-fullscreen" role="dialog" aria-modal="true"><button className="exit-lesson" onClick={() => setOpen(false)}>Exit lesson</button><iframe title={`${artifact.label} fullscreen lesson`} sandbox="allow-scripts" srcDoc={artifact.html} /></div>}</>;
}

export function StaticGallery({ onTeacherLogin }: { onTeacherLogin: () => void }) {
  return <main>
    <header className="gallery-hero"><div className="wordmark"><span className="wordmark-bend">L</span>esson<span>B</span>end</div><p className="eyebrow">Adaptive lesson studio</p><h1>Bend the lesson,<br />not the kid.</h1><p className="intro">One learning goal becomes playful, supportive routes—without storing a child’s identity.</p><button className="demo-login" onClick={onTeacherLogin}>Log in as teacher <small>(demo)</small></button></header>
    <section className="gallery-page" aria-label="Playable lesson gallery">{staticGallery.map((lesson) => <section className="gallery-lesson" key={lesson.id}><p className="eyebrow">{lesson.artifacts.length} playable route{lesson.artifacts.length === 1 ? "" : "s"}</p><h2>{lesson.title}</h2><p>{lesson.description}</p><div className="generated-grid">{lesson.artifacts.map((artifact) => <LessonCard key={artifact.id} artifact={artifact} />)}</div></section>)}</section>
    <section className="science-section"><p className="eyebrow">The science</p><h2>Designed around evidence, not labels.</h2><p>LessonBend uses shell-rendered virtual manipulatives, multiple ways to engage with the same goal, and immediate next-step feedback. <a href="https://eric.ed.gov/?id=EJ1154970" target="_blank" rel="noreferrer">Virtual manipulatives</a> · <a href="https://udlguidelines.cast.org/" target="_blank" rel="noreferrer">CAST UDL</a> · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/" target="_blank" rel="noreferrer">Feedback research</a> · <a href="https://ies.ed.gov/ncee/wwc/practiceguide/15" target="_blank" rel="noreferrer">IES fractions guidance</a>.</p></section>
  </main>;
}
