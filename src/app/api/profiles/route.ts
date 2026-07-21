import { NextResponse } from "next/server";
import { supportProfileSchema } from "@/lib/contracts";
import { listProfiles, saveProfile } from "@/lib/run-store";

export const runtime = "nodejs";
export async function GET() { return NextResponse.json(await listProfiles()); }
const isHttpUrl = (value: string) => { try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } };
export async function POST(request: Request) {
  const parsed = supportProfileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const links = parsed.data.evidenceLinks ?? [];
  if (links.some(link => !isHttpUrl(link.href))) return NextResponse.json({ error: "Evidence links must use http or https URLs." }, { status: 400 });
  await saveProfile(parsed.data);
  return NextResponse.json(parsed.data, { status: 201 });
}
