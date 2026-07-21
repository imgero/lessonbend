import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { artifactEvaluationSchema, lessonModuleSchema, lessonSpecSchema, type LessonModule, type SupportProfile } from "@/lib/contracts";
import { artifactFeedbackPromptRequirement } from "@/lib/artifact-prompt";
import { evaluateMultichannelFeedback } from "@/lib/artifact-evaluator";
import { lintArtifactSource } from "@/lib/artifact-policy";
import { validateInBrowser } from "@/lib/browser-validator";
import * as store from "@/lib/run-store";
import { renderTrustedArtifactV9 } from "@/lib/trusted-shell-v9";

const model = "gpt-5.6";
const MAX_REPAIRS = 1;
const MODEL_TIMEOUT_MS = 300_000;

async function monitored<T>(runId: string, status: string, detail: string, work: Promise<T>) {
  const started = Date.now();
  const heartbeat = setInterval(() => { void store.event(runId, status, `${detail} Still running: ${Math.round((Date.now() - started) / 1000)}s.`); }, 5_000);
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${detail} timed out after ${MODEL_TIMEOUT_MS / 1000}s.`)), MODEL_TIMEOUT_MS));
  try { return await Promise.race([work, timeout]); } finally { clearInterval(heartbeat); }
}
const client = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const usage = (response: { usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null }) => response.usage ?? undefined;

function moduleContentFailures(module: LessonModule) {
  const failures: string[] = [];
  const visibleText = JSON.stringify({ intro: module.intro, audioText: module.audioText, vocabulary: module.vocabulary, steps: module.steps.map(step => ({ prompt: step.prompt, retryNextMove: step.retryNextMove, choices: step.choices, pairs: step.pairs, items: step.items, bins: step.bins, diagram: step.diagram })) });
  if (module.intro.trim().split(/\s+/).length > 60 || (module.audioText?.trim().split(/\s+/).length ?? 0) > 60) failures.push("Intro and audio text must stay under 60 words.");
  if (!/[.!?]["')\]]?$/.test(module.intro.trim()) || (module.audioText && !/[.!?]["')\]]?$/.test(module.audioText.trim()))) failures.push("The lesson passage or audio text ends mid-sentence; complete it with closing punctuation.");
  // Curly quotes and dashes are normal English typography; reject actual unexpected writing-system leakage.
  if (/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0400-\u052f]/.test(visibleText)) failures.push("Use only the lesson language; remove unexpected non-language characters.");
  if (/\b(?:drag|drop|swipe)\b/i.test(visibleText)) failures.push("The shell uses tap/click interactions. Do not use drag, drop, or swipe language.");
  let streak = 1;
  for (let index = 1; index < module.steps.length; index++) { streak = module.steps[index].kind === module.steps[index - 1].kind ? streak + 1 : 1; if (streak > 2) failures.push("Do not use the same interaction type more than two consecutive steps."); }
  for (const kind of new Set(module.steps.map(step => step.kind))) if (module.steps.filter(step => step.kind === kind).length > module.steps.length * 0.6) failures.push("No interaction type may make up more than 60% of a lesson.");
  return failures;
}

function usesAutoAdvance(profile: SupportProfile) {
  return profile.id === "short-concrete-loops" || profile.id === "audio-first";
}

function removeCheckCopy(value: string) {
  return value
    .replace(/(?:,?\s*and)?\s*then\s+tap\s+(?:the\s+)?check(?:\s+button)?\.?/gi, ".")
    .replace(/\s+\./g, ".")
    .replace(/\.\.+/g, ".")
    .trim();
}

function applyAutoAdvanceCopy(module: LessonModule, autoAdvance: boolean): LessonModule {
  if (!autoAdvance) return module;
  return {
    ...module,
    steps: module.steps.map((step) => ({
      ...step,
      prompt: removeCheckCopy(step.prompt),
      retryNextMove: removeCheckCopy(step.retryNextMove),
    })),
  };
}

function guaranteeFractionWarmup(module: LessonModule, lessonSpec: unknown, autoAdvance = false): LessonModule {
  if (!/fraction/i.test(JSON.stringify(lessonSpec)) || ["shade", "build", "match", "find-mistake"].includes(module.steps[0]?.kind ?? "")) return module;
  const first = module.steps[0];
  return {
    ...module,
    steps: [{
      ...first,
      checkpointId: first.checkpointId,
      kind: "shade",
      prompt: autoAdvance ? "Shade 2 of the circle’s 4 equal parts." : "Shade 2 of the circle’s 4 equal parts, then tap Check.",
      denominator: 4,
      correctNumerator: 2,
      targetDenominator: null,
      incorrectNumerator: null,
      choices: null,
      pairs: null,
      items: null,
      bins: null,
      diagram: null,
      retryNextMove: "Count the four equal parts, then shade two of them.",
    }, ...module.steps.slice(1)],
  };
}

async function addEmbeddedAudio(runId: string, html: string) {
  const match = html.match(/const m=(\{[\s\S]*?\});let step=/);
  if (!match) return { html, bytes: 0 };
  const lessonModule = JSON.parse(match[1]) as { adaptations?: { audio?: boolean }; audioText?: string | null };
  if (!lessonModule.adaptations?.audio || !lessonModule.audioText) return { html, bytes: 0 };
  try {
    const speech = await client().audio.speech.create({ model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts", voice: "coral", input: lessonModule.audioText, instructions: "Speak warmly, clearly, and encouragingly for a child learning in a calm classroom." });
    const bytes = Buffer.from(await speech.arrayBuffer());
    const dataUri = `data:audio/mpeg;base64,${bytes.toString("base64")}`;
    const enhanced = html.replace(/<body([^>]*)>/, `<body$1><audio id="recorded-audio" preload="auto" src="${dataUri}"></audio>`).replace("</body>", `<script>document.querySelector('#audio').onclick=()=>{const a=document.querySelector('#recorded-audio');a.currentTime=0;a.play().catch(()=>{})}</script></body>`);
    await store.event(runId, "audio_embedded", `Blueberry: recorded directions embedded (${Math.round(bytes.length / 1024)} KB audio; ${Math.round(enhanced.length / 1024)} KB artifact).`);
    return { html: enhanced, bytes: bytes.length };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown TTS error";
    await store.event(runId, "audio_fallback", `Blueberry: recorded voice unavailable (${reason}); browser voice remains available.`);
    return { html, bytes: 0 };
  }
}

function extractHtml(text: string) {
  return text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? text.trim();
}

async function authorArtifact(runId: string, lessonSpec: unknown, profile: SupportProfile, repairInstructions?: string[]) {
  const autoAdvance = usesAutoAdvance(profile);
  const fractionInstruction = autoAdvance
    ? "This profile auto-advances as soon as the correct sectors are selected. For shade/build/find-mistake prompts, say exactly what to tap or select, and NEVER mention a Check button."
    : "The shell renders fraction kinds as tappable sectors plus a Check button. For shade/build/find-mistake prompts, explicitly ask learners to select sectors and tap Check.";
  const response = await monitored(runId, "artifact_generation_running", `${profile.label}: generating lesson module.`, client().responses.parse({
    model,
    max_output_tokens: 4500,
    input: `Generate ONLY a LessonModule JSON for a trusted educational renderer. Never generate HTML, CSS, JavaScript, CSP, events, or feedback UI. INSTRUCTION CONTRACT: every prompt must name one concrete action and its visible target. Good: "Two parts are not equal. Tap the wrong line to fix it." Good: "Shade 3 of the circle's 4 equal parts, then tap Check." Bad: "Fix the circle rule." Bad: "Tap a fraction" when no fraction-choice buttons exist. ${fractionInstruction} Do not ask for labels, choices, two-circle comparisons, or a target denominator the shell does not render. Avoid these exact previous failures: "steps tell learners to tap a fraction or tap Equal/Not equal, but those choices are never rendered"; "the final equivalence task shows only one circle"; and "the implementation instead presents selectable sectors and a Check button." Pick interaction kinds that fit the subject: shade/build/find-mistake for fraction maths; sequence for chronological events, procedures, and life cycles; bin-sort for classifying science/grammar concepts; cloze for reading vocabulary and comprehension; reveal-pairs for concept-to-meaning recall; label-parts for simple science diagrams. select is a rare later follow-up only, never an opener. The renderer owns visual models. For sequence use items with order and provide at least 3 items; bin-sort uses bins and item.bin; cloze uses choices with one correct; reveal-pairs uses pairs; label-parts uses diagram labels. Set unused fields to null. For fraction kinds only, use valid values: correctNumerator must not exceed denominator; targetDenominator must be a multiple of denominator for build; never describe unequal partitions because the renderer draws equal sectors. Make the route distinct for the profile while preserving the goal.\nLessonSpec:${JSON.stringify(lessonSpec)}\nProfile:${JSON.stringify(profile)}\n${repairInstructions?.join(" ") ?? ""}`,
    text: { format: zodTextFormat(lessonModuleSchema, "lesson_module") },
  }));
  await store.modelCall(runId, repairInstructions ? "repair_author" : "artifact_author", model, usage(response));
  let fallback: ReturnType<typeof lessonModuleSchema.safeParse> | undefined;
  if (response.output_text) {
    try { fallback = lessonModuleSchema.safeParse(JSON.parse(response.output_text)); } catch { /* parse result below remains empty */ }
  }
  const parsed = response.output_parsed ?? (fallback?.success ? fallback.data : undefined);
  if (!parsed) throw new Error(`${profile.label}: author returned no usable module.`);
  let repairedModule = applyAutoAdvanceCopy(guaranteeFractionWarmup(parsed, lessonSpec, autoAdvance), autoAdvance);
  const contentFailures = moduleContentFailures(repairedModule);
  if (contentFailures.some(failure => failure.includes("ends mid-sentence") || failure.includes("under 60 words"))) {
    const textRepair = await client().responses.parse({ model, max_output_tokens: 350, input: `Return only JSON. Rewrite intro and audioText as short, complete English sentences under 60 words each. Preserve meaning. Intro: ${repairedModule.intro}\nAudio: ${repairedModule.audioText ?? repairedModule.intro}`, text: { format: zodTextFormat(z.object({ intro: z.string().min(5).max(360), audioText: z.string().min(5).max(360) }), "text_repair") } });
    await store.modelCall(runId, "text_field_repair", model, usage(textRepair));
    if (textRepair.output_parsed) repairedModule = applyAutoAdvanceCopy(guaranteeFractionWarmup({ ...repairedModule, ...textRepair.output_parsed }, lessonSpec, autoAdvance), autoAdvance);
  }
  const remainingFailures = moduleContentFailures(repairedModule);
  if (remainingFailures.length) {
    const visibleRepair = await client().responses.parse({ model, max_output_tokens: 1600, input: `Return ONLY a LessonModule JSON. Preserve every interaction kind, denominator, checkpointId, correctness flag, order, bin assignment, and structure. Rewrite only learner-visible strings to remove non-English stray characters and drag/drop/swipe wording. Keep intro and audioText complete and under 60 words. Module: ${JSON.stringify(repairedModule)}`, text: { format: zodTextFormat(lessonModuleSchema, "generation_visible_text_repair") } });
    await store.modelCall(runId, "generation_visible_text_repair", model, usage(visibleRepair));
    if (visibleRepair.output_parsed) repairedModule = applyAutoAdvanceCopy(guaranteeFractionWarmup(visibleRepair.output_parsed, lessonSpec, autoAdvance), autoAdvance);
  }
  const finalFailures = moduleContentFailures(repairedModule);
  if (finalFailures.length) throw new Error(`${profile.label}: ${finalFailures.join(" ")}`);
  const adaptations = profile.id === "short-concrete-loops" ? { audio: false, minimalText: true, workedExample: false } : profile.id === "audio-first" ? { audio: true, minimalText: true, workedExample: false } : { audio: false, minimalText: false, workedExample: true };
  return renderTrustedArtifactV9({ ...repairedModule, adaptations, audioText: repairedModule.audioText ?? repairedModule.intro }, profile.accent);
}

async function gradeArtifact(runId: string, lessonSpec: unknown, profile: SupportProfile, html: string, staticResults: unknown, browserResults: unknown) {
  const response = await client().responses.parse({
    model,
    input: `Score this artifact, do not demand perfection. Hard gates safety, events, feedbackPresence, validMathModel, and instructionClarity must all be true to pass. instructionClarity is false if any learner-facing prompt is vague or does not state a concrete action and target. Pass: "Tap the line that makes the parts uneven." Fail: "Fix the circle rule." validMathModel applies only whenever a fraction circle is shown: it must be one whole correctly divided into equal sectors, not disconnected circles. Flag variety as inadequate if one interaction type exceeds 60% of steps or any type repeats more than twice consecutively. For non-math interactions assess whether sequence, sorting, cloze, pairs, or diagram labeling is meaningful and aligned to the lesson. Score the four quality dimensions 0-2; a total of 6/8 passes if all hard gates pass. Use 0 only for absent/broken, 1 for adequate, 2 for strong. Judge visible multichannel feedback by intent, not DOM nesting.\nLessonSpec:${JSON.stringify(lessonSpec)}\nProfile:${JSON.stringify(profile)}\nStatic checks:${JSON.stringify(staticResults)}\nBrowser checks:${JSON.stringify(browserResults)}\nArtifact HTML:${html}`,
    text: { format: zodTextFormat(artifactEvaluationSchema, "artifact_evaluation") },
  });
  await store.modelCall(runId, "artifact_evaluator", model, usage(response));
  return response.output_parsed;
}

export async function executeRun(input: { id: string; lessonText: string; profiles: SupportProfile[] }) {
  const { id: runId, lessonText, profiles } = input;
  try {
    await store.event(runId, "decomposition_started", "Creating a structured lesson specification.");
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing. Add it to .env.local, then regenerate this run.");
    const decomposition = await monitored(runId, "decomposition_running", "Planner is generating the lesson specification.", client().responses.parse({
      model,
      input: `Decompose the teacher lesson into a rigorous, age-appropriate LessonSpec. Do not diagnose learners. Preserve the central learning goal, identify likely misconceptions, and design observable mastery checkpoints. Teacher lesson:\n${lessonText}\nAnonymous support profiles:\n${JSON.stringify(profiles)}`,
      text: { format: zodTextFormat(lessonSpecSchema, "lesson_spec") },
    }));
    const lessonSpec = decomposition.output_parsed;
    if (!lessonSpec) throw new Error("The planner returned no structured lesson specification.");
    await store.modelCall(runId, "lesson_planner", model, usage(decomposition));
    await store.saveSpec(runId, lessonSpec);
    await store.event(runId, "decomposed", "LessonSpec validated against Zod.");

    const profileResults = await Promise.allSettled(profiles.map(async (profile) => {
      const artifactId = crypto.randomUUID();
      let repaired = false;
      let repairInstructions: string[] | undefined;
      for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
        await store.event(runId, attempt === 0 ? "artifact_generation_started" : "repair_started", attempt === 0 ? `${profile.label}: initial generation.` : `${profile.label}: repair ${attempt} of ${MAX_REPAIRS}.`);
        let html: string;
        try {
          html = await authorArtifact(runId, lessonSpec, profile, repairInstructions);
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Author failed to return a module.";
          await store.event(runId, "artifact_generation_failed", reason);
          if (attempt === MAX_REPAIRS) throw error;
          repairInstructions = ["Return a complete JSON object that satisfies every required field. Do not truncate.", reason];
          repaired = true;
          continue;
        }
        await store.event(runId, "artifact_generated", `${profile.label}: HTML generated.`);
        const staticFailures = lintArtifactSource(html);
        const feedbackResults = evaluateMultichannelFeedback(html);
        if (staticFailures.length) {
          await store.saveArtifact({ id: artifactId, runId, profileId: profile.id, html, validation: { staticFailures, feedbackResults }, status: "static_validation_failed" });
          if (attempt === MAX_REPAIRS) throw new Error(`${profile.label}: static validation failed after ${MAX_REPAIRS} repairs.`);
          repairInstructions = staticFailures;
          repaired = true;
          continue;
        }
        await store.event(runId, "static_policy_passed", `${profile.label}: static policy and feedback checks passed.`);
        await store.event(runId, "browser_validation_started", `${profile.label}: launching isolated browser.`);
        const browser = await validateInBrowser(html, artifactId);
        if (!browser.passed) {
          await store.saveArtifact({ id: artifactId, runId, profileId: profile.id, html, screenshotPath: browser.screenshotPath, validation: browser, status: "browser_validation_failed" });
          if (attempt === MAX_REPAIRS) throw new Error(`${profile.label}: browser validation failed after ${MAX_REPAIRS} repairs.`);
          repairInstructions = [
            ...browser.consoleErrors,
            ...browser.outboundRequests.map((url) => `Remove outbound request: ${url}`),
            ...(browser.missingCircle ? ["This is a fraction lesson. Use shade, build, or find-mistake so the trusted shell renders a real tappable sector circle; never replace the fraction model with text choices."] : []),
            ...(browser.emptySteps.length ? [`Make every step interactive and visible. Empty steps: ${browser.emptySteps.join(", ")}.`] : []),
            ...(browser.blank ? ["The visible lesson region was blank or had no controls. Provide a real interaction."] : []),
          ];
          repaired = true;
          continue;
        }
        await store.event(runId, "browser_validation_passed", `${profile.label}: screenshot captured with no console or network errors.`);
        await store.event(runId, "evaluation_started", `${profile.label}: scoring against lesson spec.`);
        const evaluation = await gradeArtifact(runId, lessonSpec, profile, html, { staticFailures, feedbackResults }, browser);
        const score = evaluation ? Object.values(evaluation.dimensions).reduce((sum, value) => sum + value, 0) : 0;
        const passes = Boolean(evaluation && Object.values(evaluation.hardGates).every(Boolean) && score >= 6);
        if (passes) {
          const audio = await addEmbeddedAudio(runId, html);
          html = audio.html;
          await store.saveArtifact({ id: artifactId, runId, profileId: profile.id, html, screenshotPath: browser.screenshotPath, validation: { browser, evaluation, score, passes, audioBytes: audio.bytes, artifactHtmlBytes: Buffer.byteLength(html) }, status: "ready_for_review" });
        } else await store.saveArtifact({ id: artifactId, runId, profileId: profile.id, html, screenshotPath: browser.screenshotPath, validation: { browser, evaluation, score, passes }, status: "evaluation_failed" });
        if (passes) break;
        if (attempt === MAX_REPAIRS) throw new Error(`${profile.label}: evaluator score ${score}/10 failed after ${MAX_REPAIRS} repairs: ${evaluation?.reasons.join(" ")}`);
        repairInstructions = evaluation?.repairInstructions ?? evaluation?.reasons;
        repaired = true;
      }
      if (repaired) await store.event(runId, "repaired", `${profile.label}: repair path used.`);
    }));
    const failedProfile = profileResults.find((result) => result.status === "rejected");
    if (failedProfile?.status === "rejected") throw failedProfile.reason;
    await store.event(runId, "ready_for_approval", "All artifacts passed validation. Approve or regenerate.");
  } catch (error) {
    await store.fail(runId, error instanceof Error ? error.message : "Unknown pipeline failure");
  }
}

export async function repairStoredTextArtifact(artifactId: string) {
  const artifact = await store.getArtifact(artifactId);
  if (!artifact?.html || !artifact.run_id || !artifact.profile_id) throw new Error("Stored artifact is unavailable for repair.");
  const match = String(artifact.html).match(/const m=(\{[\s\S]*?\});let step=/);
  if (!match) throw new Error("Stored lesson module is unavailable for repair.");
  const parsed = lessonModuleSchema.safeParse(JSON.parse(match[1]));
  if (!parsed.success) throw new Error("Stored lesson module is malformed.");
  const response = await client().responses.parse({ model, max_output_tokens: 1600, input: `Return ONLY a LessonModule JSON. Preserve every interaction kind, denominator, checkpointId, correctness flag, order, bin assignment, and structure exactly. Rewrite only every learner-visible string (intro, audioText, vocabulary, prompts, retry cues, choices, pairs, items, bins, diagram labels) to remove non-English stray characters and drag/drop/swipe language. The shell supports tap/click only. Keep intro and audioText complete and under 60 words. Module: ${JSON.stringify(parsed.data)}`, text: { format: zodTextFormat(lessonModuleSchema, "stored_visible_text_repair") } });
  await store.modelCall(String(artifact.run_id), "stored_text_repair", model, usage(response));
  const repaired = response.output_parsed;
  if (!repaired) throw new Error("Text repair returned no usable fields.");
  const repairedModule = repaired;
  const contentFailures = moduleContentFailures(repairedModule);
  if (contentFailures.length) throw new Error(`Stored repair still violates contract: ${contentFailures.join(" ")}`);
  const profileId = String(artifact.profile_id);
  const adaptations = profileId === "short-concrete-loops" ? { audio: false, minimalText: true, workedExample: false } : profileId === "audio-first" ? { audio: true, minimalText: true, workedExample: false } : { audio: false, minimalText: false, workedExample: true };
  const html = renderTrustedArtifactV9({ ...repairedModule, adaptations });
  const browser = await validateInBrowser(html, artifactId);
  const staticFailures = lintArtifactSource(html);
  await store.saveArtifact({ id: artifactId, runId: String(artifact.run_id), profileId, html, screenshotPath: browser.screenshotPath, validation: { browser, staticFailures, repaired: "text-and-prompt" }, status: browser.passed && !staticFailures.length ? "ready_for_review" : "browser_validation_failed" });
  return { passed: browser.passed && !staticFailures.length, artifactId, browser, staticFailures };
}

export async function refreshStoredArtifactShell(artifactId: string) {
  const artifact = await store.getArtifact(artifactId);
  if (!artifact?.html || !artifact.run_id || !artifact.profile_id) throw new Error("Stored artifact is unavailable for refresh.");
  const match = String(artifact.html).match(/const m=(\{[\s\S]*?\});let step=/);
  if (!match) throw new Error("Stored lesson module is unavailable for refresh.");
  const parsed = lessonModuleSchema.parse(JSON.parse(match[1]));
  const profileId = String(artifact.profile_id);
  const adaptations = profileId === "short-concrete-loops" ? { audio: false, minimalText: true, workedExample: false } : profileId === "audio-first" ? { audio: true, minimalText: true, workedExample: false } : { audio: false, minimalText: false, workedExample: true };
  const html = renderTrustedArtifactV9({ ...parsed, adaptations });
  const browser = await validateInBrowser(html, artifactId);
  const staticFailures = lintArtifactSource(html);
  await store.saveArtifact({ id: artifactId, runId: String(artifact.run_id), profileId, html, screenshotPath: browser.screenshotPath, validation: { browser, staticFailures, refreshedShell: true }, status: browser.passed && !staticFailures.length ? "ready_for_review" : "browser_validation_failed" });
  return { passed: browser.passed && !staticFailures.length, artifactId, browser, staticFailures };
}
