"use client";

import { useEffect, useState } from "react";
import { findPossiblePii } from "@/lib/pii";
import type { SupportProfile } from "@/lib/contracts";
import { fruitById, fruitProfiles, takenFruitIds } from "@/lib/fruits";

type Proposal = { label: string; supports: string[]; constraints: string[]; lessonMix: string; references: Array<{ title: string; url: string; source?: string }> };

function Chips({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => { const next = draft.trim(); if (next && !values.includes(next)) onChange([...values, next]); setDraft(""); };
  return <div className="chip-editor"><b>{label}</b><div className="chips">{values.map((value, index) => <details className="edit-chip" key={`${value}-${index}`}><summary>{value.split(/[,:;]/)[0]}</summary><span>{value}</span><button aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>×</button></details>)}<input value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} onBlur={add} /></div></div>;
}

export function ProfilePrep({ onSaved, usedIds }: { onSaved: (profile: SupportProfile) => void; usedIds: string[] }) {
  const [open, setOpen] = useState(false);
  const [fruitId, setFruitId] = useState("banana");
  const [brief, setBrief] = useState("");
  const [proposal, setProposal] = useState<Proposal>();
  const [status, setStatus] = useState<"idle" | "researching" | "error">("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const pii = findPossiblePii(brief);
  const fruit = fruitById.get(fruitId) ?? fruitById.get("banana")!;
  useEffect(() => { if (status !== "researching") return; const started = Date.now(); const interval = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000); return () => window.clearInterval(interval); }, [status]);
  const research = async () => {
    setStatus("researching"); setElapsed(0); setError(""); setProposal(undefined);
    try {
      const response = await fetch("/api/profile-prep", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brief, suggestedLabel: fruit.label }) });
      const payload = await response.json().catch(() => ({ error: "Profile research returned an empty response." }));
      if (!response.ok) throw new Error(payload.error ?? "Profile research could not finish.");
      setProposal({ ...payload, label: fruit.label });
      setStatus("idle");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Profile research could not finish."); setStatus("error"); }
  };
  const save = async () => {
    if (!proposal) return;
    const profile = { id: fruit.id, label: fruit.label, emoji: fruit.emoji, accent: fruit.accent, supports: proposal.supports, constraints: proposal.constraints };
    const response = await fetch("/api/profiles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) });
    if (!response.ok) { setError("The profile could not be saved. Please try again."); setStatus("error"); return; }
    onSaved(profile); setOpen(false); setBrief(""); setProposal(undefined); setError(""); setFruitId("banana");
  };
  if (!open) return <button className="add-profile" onClick={() => setOpen(true)}>＋ Add profile</button>;
  return <section className="profile-prep" aria-label="Add learner profile"><div className="profile-prep-head"><div><p className="eyebrow">New learner profile</p><h3>Add a route, not a label.</h3></div><button className="close-profile" aria-label="Close add profile" onClick={() => setOpen(false)}>×</button></div><label className="profile-name">Fruit identity<select value={fruitId} onChange={(event) => setFruitId(event.target.value)}>{fruitProfiles.map(([id, name, emoji]) => <option key={id} value={id} disabled={takenFruitIds.has(id) || usedIds.includes(id)}>{emoji} {name}{usedIds.includes(id) ? " — already used" : ""}</option>)}</select><small>{fruit.emoji} {fruit.label} will carry this route’s color throughout the lesson.</small></label><label className="profile-brief">Describe what you observe<textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Needs one small action at a time and benefits from hearing directions again." /> </label><p className="privacy-note">Your notes are processed once and never saved.</p>{pii.length > 0 ? <p className="warning">Personal information detected. Remove it before researching: {pii.map((item) => item.value).join(", ")}</p> : <button className="generate" disabled={status === "researching" || brief.trim().length < 20} onClick={() => void research()}>{status === "researching" ? "Researching recent evidence…" : "Research & suggest"}</button>}{status === "researching" && <p className="research-status" aria-live="polite"><span /> Researching recent evidence, prioritising meta-analyses and education sources · {elapsed}s</p>}{error && <p className="warning" aria-live="assertive">Research stopped: {error}</p>}{proposal && <article className="proposal-card" style={{ borderColor: fruit.accent }}><p className="eyebrow">Suggested profile</p><h3>{fruit.emoji} {proposal.label}</h3><label className="profile-name">Proposed lesson mix<input value={proposal.lessonMix} onChange={(event) => setProposal({ ...proposal, lessonMix: event.target.value.slice(0, 240) })} /></label><Chips label="Suggested supports" values={proposal.supports} onChange={(supports) => setProposal({ ...proposal, supports: supports.slice(0, 8) })} placeholder="Add support" /><Chips label="Constraints" values={proposal.constraints} onChange={(constraints) => setProposal({ ...proposal, constraints: constraints.slice(0, 8) })} placeholder="Add constraint" /><section className="references"><b>Why these suggestions</b><p>Recent evidence and accredited education sources</p>{proposal.references.map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">{reference.title}<small>{reference.source ?? new URL(reference.url).hostname}</small></a>)}</section><button className="approve" disabled={!proposal.supports.length} onClick={() => void save()}>Save {fruit.emoji} {proposal.label}</button></article>}</section>;
}
