export type RubricResult = { criterion: string; passed: boolean; detail: string };

/** Deterministic guard before the model-based evaluator reviews a screenshot and lesson spec. */
export function evaluateMultichannelFeedback(source: string): RubricResult[] {
  const success = source.match(/(?:data-lb-feedback=["']success["']|setAttribute\(['"]data-lb-feedback['"],\s*ok\?['"]success)[\s\S]{0,1600}/i)?.[0] ?? "";
  const retry = source.match(/(?:data-lb-feedback=["']retry["']|setAttribute\(['"]data-lb-feedback['"],\s*ok\?['"]success['"]:['"]retry)[\s\S]{0,1600}/i)?.[0] ?? "";
  return [
    { criterion: "success is multichannel", passed: /check|✓|✔/i.test(success) && /green|#dcfce7|#4ade80/i.test(source) && /correct|yes|great|well done/i.test(success), detail: "Success needs green, a check icon, and explicit text." },
    { criterion: "success celebrates", passed: /celebrat|confetti|bounce|pop/i.test(success) || /celebrat|confetti|bounce|pop/i.test(source), detail: "Success needs a small celebration animation." },
    { criterion: "retry is multichannel", passed: /retry|↻|⟲/i.test(retry) && /amber|orange|#f59e0b|#d97706/i.test(source) && /look|find|notice|two equal/i.test(retry), detail: "Retry needs amber, a retry icon, text, and a next-move cue." },
    { criterion: "feedback has validation hooks", passed: Boolean(success) && Boolean(retry), detail: "Use data-lb-feedback=success and data-lb-feedback=retry." },
  ];
}
