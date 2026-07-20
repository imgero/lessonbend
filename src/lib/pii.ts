export type PiiFinding = { kind: "email" | "phone" | "name-cue"; value: string };

const patterns: Array<{ kind: PiiFinding["kind"]; expression: RegExp }> = [
  { kind: "email", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { kind: "phone", expression: /(?:\+41|0041|0)\s?(?:\d\s?){8,10}\b/g },
  { kind: "name-cue", expression: /\b(?:student|pupil|child|learner)\s*(?:is|named|called|name)?\s*[:=-]?\s*[A-Z][a-z]+\b/g },
];

const commonNames = /\b(?:aaron|adam|alex|alice|anna|ben|david|emma|eva|hannah|jack|james|john|julia|leo|lina|lucas|maria|mia|noah|oliver|sarah|sofia|tom)\b/gi;

export function findPossiblePii(text: string): PiiFinding[] {
  const findings = patterns.flatMap(({ kind, expression }) => Array.from(text.matchAll(expression), (match) => ({ kind, value: match[0] })));
  findings.push(...Array.from(text.matchAll(commonNames), (match) => ({ kind: "name-cue" as const, value: match[0] })));
  return findings;
}
