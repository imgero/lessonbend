"use client";

import { useState } from "react";
import { staticGallery, type StaticGalleryArtifact } from "@/lib/static-gallery";

function LessonCard({ artifact }: { artifact: StaticGalleryArtifact }) {
  const [open, setOpen] = useState(false);
  return <><article className={`generated-frame ${artifact.profileId}`}><p><strong>{artifact.label}</strong><span>ready to play</span></p><iframe title={`${artifact.label} lesson`} sandbox="allow-scripts" srcDoc={artifact.html} /><button className="start-lesson" onClick={() => setOpen(true)}>Start lesson</button></article>{open && <div className="lesson-fullscreen" role="dialog" aria-modal="true"><button className="exit-lesson" onClick={() => setOpen(false)}>Exit lesson</button><iframe title={`${artifact.label} fullscreen lesson`} sandbox="allow-scripts" srcDoc={artifact.html} /></div>}</>;
}

export function StaticGallery() {
  return <main><header><div className="wordmark"><span className="wordmark-bend">L</span>esson<span>B</span>end</div><p className="eyebrow">Playable lesson gallery</p><h1>Bend the lesson,<br />not the kid.</h1><p className="intro">Explore ready-to-play lesson routes. Each one adapts the same goal without storing a child’s identity.</p><p className="local-note">Want to generate your own? Run LessonBend locally with your own OpenAI key.</p></header><section className="gallery-page">{staticGallery.map((lesson) => <section className="gallery-lesson" key={lesson.id}><p className="eyebrow">{lesson.artifacts.length} playable route{lesson.artifacts.length === 1 ? "" : "s"}</p><h2>{lesson.title}</h2><p>{lesson.description}</p><div className="generated-grid">{lesson.artifacts.map((artifact) => <LessonCard key={artifact.id} artifact={artifact} />)}</div></section>)}</section></main>;
}
