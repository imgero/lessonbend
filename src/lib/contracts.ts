import { z } from "zod";

export const supportProfileSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1).max(50),
  supports: z.array(z.string().min(1)).min(1).max(12),
  constraints: z.array(z.string().min(1)).max(12),
  emoji: z.string().max(8).nullable().default(null),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),
  whyMayHelp: z.string().min(10).max(360).nullable().default(null),
  evidenceLinks: z.array(z.object({ label: z.string().min(2).max(120), href: z.string().url() })).max(6).nullable().default(null),
});

export const lessonSpecSchema = z.object({
  goal: z.string().min(1),
  successCriteria: z.array(z.string().min(1)).min(1),
  prerequisiteKnowledge: z.array(z.string().min(1)),
  misconceptions: z.array(z.object({ signal: z.string().min(1), response: z.string().min(1) })),
  checkpoints: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    skill: z.string().min(1),
    evidenceOfMastery: z.string().min(1),
  })).min(1),
  profiles: z.array(supportProfileSchema).min(1).max(3),
});

export const artifactEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lessonbend.ready"), token: z.string().uuid() }),
  z.object({ type: z.literal("lessonbend.checkpoint"), token: z.string().uuid(), checkpointId: z.string(), outcome: z.enum(["retry", "mastered"]), timestamp: z.number().optional(), stepIndex: z.number().int().positive().optional(), totalSteps: z.number().int().positive().optional() }),
  z.object({ type: z.literal("lessonbend.complete"), token: z.string().uuid(), timestamp: z.number().optional(), stepIndex: z.number().int().positive().optional(), totalSteps: z.number().int().positive().optional() }),
  z.object({ type: z.literal("lessonbend.error"), token: z.string().uuid(), message: z.string().max(200) }),
]);

/** Requirements every generated artifact must satisfy, irrespective of support profile. */
export const artifactRequirementsSchema = z.object({
  feedback: z.object({
    success: z.object({
      color: z.literal("green"),
      icon: z.literal("check"),
      explicitText: z.literal(true),
      celebration: z.literal(true),
    }),
    retry: z.object({
      color: z.literal("amber"),
      icon: z.literal("retry"),
      explicitText: z.literal(true),
      nextMoveCue: z.literal(true),
    }),
    colorAloneIsForbidden: z.literal(true),
  }),
});

export const artifactRequirements = artifactRequirementsSchema.parse({
  feedback: {
    success: { color: "green", icon: "check", explicitText: true, celebration: true },
    retry: { color: "amber", icon: "retry", explicitText: true, nextMoveCue: true },
    colorAloneIsForbidden: true,
  },
});

export const artifactEvaluationSchema = z.object({
  hardGates: z.object({ safety: z.boolean(), events: z.boolean(), feedbackPresence: z.boolean(), validMathModel: z.boolean(), instructionClarity: z.boolean() }),
  dimensions: z.object({ interactionMeaningfulness: z.number().int().min(0).max(2), profileAdaptation: z.number().int().min(0).max(2), masteryEvidence: z.number().int().min(0).max(2), accessibility: z.number().int().min(0).max(2) }),
  reasons: z.array(z.string().min(1)).max(6),
  repairInstructions: z.array(z.string().min(1)).max(8),
});

export const lessonModuleSchema = z.object({
  title: z.string().min(3).max(90),
  intro: z.string().min(10).max(280),
  audioText: z.string().min(5).max(300).nullable(),
  vocabulary: z.array(z.object({ term: z.string().min(1), meaning: z.string().min(3) })).max(4),
  steps: z.array(z.object({
    checkpointId: z.string().regex(/^[a-z0-9-]+$/),
    kind: z.enum(["shade", "build", "match", "find-mistake", "sort", "select", "sequence", "bin-sort", "cloze", "reveal-pairs", "label-parts"]),
    prompt: z.string().min(5).max(220),
    denominator: z.number().int().min(2).max(8).nullable(),
    correctNumerator: z.number().int().min(1).max(7).nullable(),
    targetDenominator: z.number().int().min(2).max(8).nullable(),
    incorrectNumerator: z.number().int().min(1).max(7).nullable(),
    choices: z.array(z.object({ label: z.string().min(1), correct: z.boolean() })).min(2).max(5).nullable(),
    pairs: z.array(z.object({ left: z.string().min(1), right: z.string().min(1) })).min(2).max(4).nullable(),
    items: z.array(z.object({ label: z.string().min(1).max(120), order: z.number().int().min(1).max(8).nullable(), bin: z.string().min(1).max(60).nullable(), matchKey: z.string().min(1).max(60).nullable(), correct: z.boolean() })).min(3).max(8).nullable(),
    bins: z.array(z.string().min(1).max(60)).min(2).max(4).nullable(),
    diagram: z.object({ shape: z.enum(["circle", "rectangle", "plant", "water-cycle"]), labels: z.array(z.object({ zone: z.string().min(1).max(40), text: z.string().min(1).max(80), correct: z.boolean() })).min(2).max(5) }).nullable(),
    retryNextMove: z.string().min(8).max(220),
  })).min(3).max(5),
  adaptations: z.object({ audio: z.boolean(), minimalText: z.boolean(), workedExample: z.boolean() }),
});

export type LessonSpec = z.infer<typeof lessonSpecSchema>;
export type SupportProfile = z.infer<typeof supportProfileSchema>;
export type ArtifactEvent = z.infer<typeof artifactEventSchema>;
export type ArtifactRequirements = z.infer<typeof artifactRequirementsSchema>;
export type LessonModule = z.infer<typeof lessonModuleSchema>;
