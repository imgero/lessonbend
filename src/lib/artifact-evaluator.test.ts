import { describe, expect, it } from "vitest";
import { evaluateMultichannelFeedback } from "./artifact-evaluator";
import { makeHalfArtifact } from "./half-artifact";

describe("multichannel feedback", () => {
  it("requires the golden fractions artifact to supply all feedback channels", () => {
    expect(evaluateMultichannelFeedback(makeHalfArtifact()).every((result) => result.passed)).toBe(true);
  });
});
