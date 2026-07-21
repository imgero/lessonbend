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

export function StaticGallery() {
  return <main><header><div className="wordmark"><span className="wordmark-bend">L</span>esson<span>B</span>end</div><p className="eyebrow">Playable lesson gallery</p><h1>Bend the lesson,<br />not the kid.</h1><p className="intro">Explore ready-to-play lesson routes. Each one adapts the same goal without storing a child’s identity.</p><p className="local-note">Want to generate your own or add Banana? Run LessonBend locally with your own OpenAI key.</p></header><section className="gallery-page">{staticGallery.map((lesson) => <section className="gallery-lesson" key={lesson.id}><p className="eyebrow">{lesson.artifacts.length} playable route{lesson.artifacts.length === 1 ? "" : "s"}</p><h2>{lesson.title}</h2><p>{lesson.description}</p><div className="generated-grid">{lesson.artifacts.map((artifact) => <LessonCard key={artifact.id} artifact={artifact} />)}</div></section>)}</section><ClassInsights runId="gallery-demo" profiles={demoProfiles} /><section className="science-section"><p className="eyebrow">The science</p><h2>Designed around evidence, not labels.</h2><p>For mathematics, LessonBend uses shell-rendered virtual manipulatives—especially for fractions—because research syntheses find that interactive representations can support mathematics learning when they are tied to a clear instructional goal. <a href="https://eric.ed.gov/?id=EJ1154970" target="_blank" rel="noreferrer">Read the virtual-manipulatives meta-analysis</a>.</p><p>Its support profiles follow the Universal Design for Learning idea of anticipating learner variability through multiple ways to engage, represent ideas, and act or express learning. <a href="https://udlguidelines.cast.org/" target="_blank" rel="noreferrer">Explore CAST’s UDL Guidelines</a>.</p><p>Feedback is immediate, specific, and retry-oriented: the child sees what to look for next rather than receiving a punitive red mark. That direction is consistent with broad feedback research. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/" target="_blank" rel="noreferrer">Read the feedback meta-analysis</a>.</p><p>For fractions, the lessons also draw on the U.S. Institute of Education Sciences practice guide: build from informal sharing, make fractions meaningful as numbers, and use representations deliberately. <a href="https://ies.ed.gov/ncee/wwc/practiceguide/15" target="_blank" rel="noreferrer">Read the IES fractions guidance</a>.</p></section></main>;
}
