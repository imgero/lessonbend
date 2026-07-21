import type { LessonSpec, SupportProfile } from "@/lib/contracts";

export const fractionProfiles: SupportProfile[] = [
  {
    id: "short-concrete-loops",
    label: "Pineapple",
    supports: ["one action per screen", "concrete visual manipulation", "immediate action-oriented feedback"],
    constraints: ["short loops", "low distraction"],
    emoji: "🍍", accent: "#c68000",
    whyMayHelp: null, evidenceLinks: null,
  },
  {
    id: "audio-first",
    label: "Blueberry",
    supports: ["audio-capable directions", "minimal text", "visual symbols paired with language"],
    constraints: ["never depend on reading a paragraph"],
    emoji: "🫐", accent: "#5663d8",
    whyMayHelp: null, evidenceLinks: null,
  },
];

/** Small, teacher-facing labels for the gallery. They describe a route's design, never a learner. */
export const presetRouteTags: Record<string, string[]> = {
  "short-concrete-loops": ["short loops", "instant feedback", "one step at a time"],
  "audio-first": ["audio-first", "minimal text", "replay"],
  "math-language-support": ["worked examples", "vocabulary", "visual models"],
};

export const fractionsGoldenSpec: LessonSpec = {
  goal: "Recognise and build fractions equivalent to one half.",
  successCriteria: ["Match two visual representations of one half.", "Explain that equal parts must cover the same whole."],
  prerequisiteKnowledge: ["A fraction describes equal parts of one whole."],
  misconceptions: [
    { signal: "Chooses one of three parts as a half.", response: "Show the whole split into two equal parts, then retry with a different picture." },
  ],
  checkpoints: [{ id: "half-match", skill: "identify equivalent halves", evidenceOfMastery: "selects a representation with one of two equal parts shaded" }],
  profiles: fractionProfiles,
};
