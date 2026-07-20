import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findPossiblePii } from "@/lib/pii";

export const runtime = "nodejs";
export const maxDuration = 120;

const requestSchema = z.object({ brief: z.string().min(20).max(1600), suggestedLabel: z.string().min(1).max(50).optional() });
const resultSchema = z.object({ label: z.string().min(3).max(50), supports: z.array(z.string()).min(2).max(8), constraints: z.array(z.string()).max(8), lessonMix: z.string().min(10).max(240), references: z.array(z.object({ title: z.string().min(3), url: z.string().url(), source: z.string().min(2).max(100).optional() })).min(2).max(6) });
// The Responses JSON-schema validator does not accept Zod's emitted `format: uri`.
// Keep URL validation at the server boundary, but make the model-facing field a string.
const researchSchema = {
  type: "object", additionalProperties: false, required: ["label", "supports", "constraints", "lessonMix", "references"], properties: {
    label: { type: "string" }, supports: { type: "array", items: { type: "string" } }, constraints: { type: "array", items: { type: "string" } }, lessonMix: { type: "string" },
    references: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "url", "source"], properties: { title: { type: "string" }, url: { type: "string" }, source: { type: "string" } } } },
  },
};

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please add a short anonymous observation." }, { status: 400 });
  const pii = findPossiblePii(parsed.data.brief);
  if (pii.length) return NextResponse.json({ error: "Personal information must be removed before researching.", findings: pii.map((item) => item.value) }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Profile research is unavailable because OPENAI_API_KEY is missing." }, { status: 503 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 115_000);
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120_000, maxRetries: 0 });
    const response = await openai.responses.create({
      model: process.env.PROFILE_PREP_MODEL ?? "gpt-5.6-terra",
      reasoning: { effort: "low" },
      tools: [{ type: "web_search_preview", search_context_size: "medium" }],
      tool_choice: "required",
      text: { format: { type: "json_schema", name: "anonymous_support_profile", strict: true, schema: researchSchema } },
      input: `Research an anonymous classroom-support profile from this teacher observation. You MUST use web search. Prefer recent meta-analyses, education-government sources, and accredited research. Do not diagnose or use medical labels. Provide direct, checkable source links. Return the required JSON only. Use this suggested neutral fruit name if suitable: ${parsed.data.suggestedLabel ?? "Banana"}. Observation: ${parsed.data.brief}`,
    }, { signal: controller.signal });
    const result = resultSchema.parse(JSON.parse(response.output_text));
    return NextResponse.json(result);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown research error";
    const timedOut = controller.signal.aborted || /timeout|timed out|aborted/i.test(message);
    return NextResponse.json({ error: timedOut ? "Research timed out after 115 seconds. No notes or profile were saved." : `Research failed: ${message}` }, { status: timedOut ? 504 : 502 });
  } finally { clearTimeout(timeout); }
}
