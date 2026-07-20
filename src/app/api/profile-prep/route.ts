import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findPossiblePii } from "@/lib/pii";

export const runtime = "nodejs";
const requestSchema = z.object({ brief: z.string().min(20).max(1600) });
const resultSchema = z.object({ label: z.string().min(3).max(50), supports: z.array(z.string()).min(2).max(8), constraints: z.array(z.string()).max(8), lessonMix: z.string().min(10).max(240), references: z.array(z.object({ title: z.string(), url: z.string().url() })).min(1).max(6) });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please add a short anonymous observation." }, { status: 400 });
  const pii = findPossiblePii(parsed.data.brief);
  if (pii.length) return NextResponse.json({ error: "Remove personal information before researching.", findings: pii.map(item => item.value) }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 503 });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({ model: "gpt-5.6", tools: [{ type: "web_search_preview" }], input: `Research an anonymous classroom-support profile from this teacher observation. Prefer recent meta-analyses, education-government sources, and accredited research. Do not diagnose or use medical labels. Return ONLY JSON with label, supports, constraints, lessonMix, and references [{title,url}]. The profile label must be a neutral fruit-like nickname. Observation: ${parsed.data.brief}` });
  try { return NextResponse.json(resultSchema.parse(JSON.parse(response.output_text))); } catch { return NextResponse.json({ error: "Research returned an unusable profile. Please try again." }, { status: 502 }); }
}
