"use client";

import { useState } from "react";
import { staticGallery, type StaticGalleryArtifact } from "@/lib/static-gallery";

function LessonCard({ artifact }: { artifact: StaticGalleryArtifact }) {
  const [open, setOpen] = useState(false);
  return <><article className={`generated-frame ${artifact.profileId}`}><p><strong>{artifact.label}</strong><span>ready to play</span></p><iframe title={`${artifact.label} lesson`} sandbox="allow-scripts" srcDoc={artifact.html} /><button className="start-lesson" onClick={() => setOpen(true)}>Start lesson</button></article>{open && <div className="lesson-fullscreen" role="dialog" aria-modal="true"><button className="exit-lesson" onClick={() => setOpen(false)}>Exit lesson</button><iframe title={`${artifact.label} fullscreen lesson`} sandbox="allow-scripts" srcDoc={artifact.html} /></div>}</>;
}

export function StaticGallery({ onTeacherLogin }: { onTeacherLogin: () => void }) {
  return <main className="landing-shell">
    <header className="landing-hero"><div className="wordmark"><span className="wordmark-bend">L</span>esson<span>B</span>end</div><h1>Bend the lesson,<br />not the kid.</h1><p>One learning goal, a different playable lesson for every learner — with zero student data collected.</p><div className="landing-actions"><button className="demo-login" onClick={onTeacherLogin}>Log in as teacher</button><a href="#example-lessons">See example lessons <span aria-hidden="true">↓</span></a></div></header>
    <section className="how-it-works" aria-labelledby="how-it-works-title"><p className="eyebrow">How it works</p><h2 id="how-it-works-title">A lesson that changes shape, not expectations.</h2><ol><li><b>Describe your learners</b><span>Choose anonymous support profiles.</span></li><li><b>LessonBend creates each route</b><span>One goal, distinct playable ways in.</span></li><li><b>Teachers review and play</b><span>Keep what fits. Try another version when it doesn&apos;t.</span></li></ol></section>
    <section id="example-lessons" className="gallery-page" aria-label="Playable lesson gallery"><div className="gallery-intro"><p className="eyebrow">Example lessons</p><h2>See the same goal bent three ways.</h2></div>{staticGallery.map((lesson) => <section className="gallery-lesson" key={lesson.id}><p className="eyebrow">{lesson.artifacts.length} playable route{lesson.artifacts.length === 1 ? "" : "s"}</p><h2>{lesson.title}</h2><p>{lesson.description}</p><div className="generated-grid">{lesson.artifacts.map((artifact) => <LessonCard key={artifact.id} artifact={artifact} />)}</div></section>)}</section>
    <section className="science-section"><p className="eyebrow">The science</p><h2>Designed around evidence, not labels.</h2><p>LessonBend uses shell-rendered virtual manipulatives, multiple ways to engage with the same goal, and immediate next-step feedback. <a href="https://eric.ed.gov/?id=EJ1154970" target="_blank" rel="noreferrer">Virtual manipulatives</a> · <a href="https://udlguidelines.cast.org/" target="_blank" rel="noreferrer">CAST UDL</a> · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/" target="_blank" rel="noreferrer">Feedback research</a> · <a href="https://ies.ed.gov/ncee/wwc/practiceguide/15" target="_blank" rel="noreferrer">IES fractions guidance</a>.</p></section>
  </main>;
}
