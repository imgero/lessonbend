import { artifactRequirements } from "@/lib/contracts";

/** Appended verbatim to every artifact-author prompt. */
export const artifactFeedbackPromptRequirement = `
Feedback is a hard accessibility requirement. Never communicate correctness using colour alone.
For a correct response, show all of: a green tone, a visible check-mark icon, explicit success text, and a small non-blocking celebration animation.
For an incorrect response, show all of: a warm amber tone (never punitive red), a visible retry icon, explicit supportive text, and a gentle visual cue that points to the next thing to inspect. Explain the next move; do not only say "try again".
Mark the success feedback with data-lb-feedback="success" and the retry feedback with data-lb-feedback="retry" so it can be validated.
Requirements JSON: ${JSON.stringify(artifactRequirements.feedback)}
`.trim();
