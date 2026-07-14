import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { leaveStatusSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request, ["ADMIN", "SUPER_ADMIN", "STAFF"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, leaveStatusSchema);
  if ("error" in v) return v.error;

  const updated = await prisma.leave.update({
    where: { id: params.id },
    data: {
      status: v.data.status,
      approverId: v.data.approverId ?? auth.user.id,
      approverName: v.data.approverName ?? auth.user.name,
    },
  });
  broadcastSSE("UPDATE_LEAVE", updated);
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  // Students can cancel their own leaves; admin/super can cancel any
  const leave = await prisma.leave.findUnique({ where: { id: params.id } });
  if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (auth.user.role === "STUDENT" && leave.userId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.leave.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });
  broadcastSSE("UPDATE_LEAVE", updated);
  return NextResponse.json(updated);
}
