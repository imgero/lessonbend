export type PiiFinding = { kind: "email" | "phone" | "name-cue"; value: string };

const patterns: Array<{ kind: PiiFinding["kind"]; expression: RegExp }> = [
  { kind: "email", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { kind: "phone", expression: /(?:\+41|0041|0)\s?(?:\d\s?){8,10}\b/g },
  { kind: "name-cue", expression: /\b(?:student|pupil|child)\s*(?:name|named|called)?\s*[:=-]\s*[A-Z][a-z]+\b/g },
];

export function findPossiblePii(text: string): PiiFinding[] {
  return patterns.flatMap(({ kind, expression }) => Array.from(text.matchAll(expression), (match) => ({ kind, value: match[0] })));
}
