import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { leaveSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const where = auth.user.role === "STUDENT" ? { userId: auth.user.id } : {};
  const leaves = await prisma.leave.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(leaves);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["STUDENT"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, leaveSchema);
  if ("error" in v) return v.error;

  if (v.data.userId !== auth.user.id) {
    return NextResponse.json({ error: "userId does not match session" }, { status: 403 });
  }

  if (v.data.toDate < v.data.fromDate) {
    return NextResponse.json(
      { error: "toDate must be on or after fromDate" },
      { status: 400 }
    );
  }

  const leave = await prisma.leave.create({
    data: {
      userId: auth.user.id,
      userName: v.data.userName,
      userRoom: v.data.userRoom ?? null,
      fromDate: v.data.fromDate,
      toDate: v.data.toDate,
      reason: v.data.reason,
      status: "PENDING",
    },
  });
  broadcastSSE("NEW_LEAVE", leave);
  return NextResponse.json(leave);
}
