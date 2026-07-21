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
  {
    id: "math-language-support",
    label: "Mango",
    supports: ["explicit vocabulary", "worked example", "representations alongside symbols"],
    constraints: ["explain terms before asking for transfer"],
    emoji: "🥭", accent: "#d75a25",
    whyMayHelp: null, evidenceLinks: null,
  },
];

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
