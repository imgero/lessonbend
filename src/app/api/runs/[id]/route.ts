import { NextResponse } from "next/server";
import { getRun } from "@/lib/run-store";
import { approveRun } from "@/lib/run-store";

export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getRun((await params).id);
  return result.run ? NextResponse.json(result) : NextResponse.json({ error: "Run not found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json();
  if (body.action !== "approve") return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  await approveRun((await params).id);
  return NextResponse.json({ status: "approved" });
}
