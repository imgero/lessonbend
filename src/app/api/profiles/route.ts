import { NextResponse } from "next/server";
import { supportProfileSchema } from "@/lib/contracts";
import { deleteProfile, listProfiles, saveProfile } from "@/lib/run-store";

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
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Profile id is required." }, { status: 400 });
  if (["short-concrete-loops", "audio-first"].includes(id)) return NextResponse.json({ error: "Preset profiles cannot be deleted." }, { status: 403 });
  await deleteProfile(id);
  return NextResponse.json({ deleted: id });
}
