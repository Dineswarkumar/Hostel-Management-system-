import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { complaintStatusSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request, ["STAFF", "ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, complaintStatusSchema);
  if ("error" in v) return v.error;

  const data: Record<string, unknown> = {
    status: v.data.status,
    updatedAt: new Date(),
  };
  if (v.data.assignedToId) {
    data.assignedToId = v.data.assignedToId;
    data.assignedToName = v.data.assignedToName ?? null;
  }
  if (v.data.status === "RESOLVED" || v.data.status === "CLOSED") {
    data.resolvedAt = new Date();
  }

  const updated = await prisma.complaint.update({
    where: { id: params.id },
    data,
  });

  const parsed = {
    ...updated,
    photos: (() => { try { return JSON.parse(updated.photos); } catch { return []; } })(),
  };
  broadcastSSE("UPDATE_COMPLAINT", parsed);
  return NextResponse.json(parsed);
}
