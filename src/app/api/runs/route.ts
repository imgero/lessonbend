import { NextResponse } from "next/server";
import { z } from "zod";
import { supportProfileSchema } from "@/lib/contracts";
import { executeRun } from "@/lib/pipeline";
import { createRun, getActiveRun, getLatestComparisonRun, listGalleryRuns } from "@/lib/run-store";

export const runtime = "nodejs";
const requestSchema = z.object({ lessonText: z.string().min(10), profiles: z.array(supportProfileSchema).min(1).max(3) });

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  if (query.get("gallery") === "1") return NextResponse.json(await listGalleryRuns());
  if (query.get("latest") !== "1") return NextResponse.json({ error: "Use ?latest=1" }, { status: 400 });
  const latest = await getLatestComparisonRun();
  return latest ? NextResponse.json(latest) : NextResponse.json({ error: "No comparison run found" }, { status: 404 });
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const active = await getActiveRun();
  if (active) return NextResponse.json({ error: "A generation is already active.", activeRunId: active.id, status: active.status }, { status: 409 });
  const id = crypto.randomUUID();
  await createRun({ id, lessonText: parsed.data.lessonText, profilesJson: JSON.stringify(parsed.data.profiles) });
  void executeRun({ id, ...parsed.data });
  return NextResponse.json({ id, status: "created" }, { status: 202 });
}
