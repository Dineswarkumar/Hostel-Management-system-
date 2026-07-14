import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { complaintRateSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request, ["STUDENT"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, complaintRateSchema);
  if ("error" in v) return v.error;

  // Only the complaint owner can rate
  const existing = await prisma.complaint.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.status !== "RESOLVED" && existing.status !== "CLOSED") {
    return NextResponse.json(
      { error: "Can only rate resolved complaints" },
      { status: 400 }
    );
  }

  const updated = await prisma.complaint.update({
    where: { id: params.id },
    data: { rating: v.data.rating },
  });
  const parsed = { ...updated, photos: (() => { try { return JSON.parse(updated.photos); } catch { return []; } })() };
  broadcastSSE("UPDATE_COMPLAINT", parsed);
  return NextResponse.json(parsed);
}
