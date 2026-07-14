import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { complaintSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const assignedToId = searchParams.get("assignedToId");

  const where: Record<string, unknown> = {};
  // Students can only see their own; staff/admin/super see all (or filtered)
  if (auth.user.role === "STUDENT") {
    where.userId = auth.user.id;
  } else if (assignedToId) {
    where.assignedToId = assignedToId;
  }
  if (status) where.status = status;

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  const parsed = complaints.map((c) => ({
    ...c,
    photos: safeParse(c.photos),
  }));
  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["STUDENT"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, complaintSchema);
  if ("error" in v) return v.error;

  if (v.data.userId !== auth.user.id) {
    return NextResponse.json(
      { error: "userId does not match session" },
      { status: 403 }
    );
  }

  // Generate a unique complaint id
  const count = await prisma.complaint.count();
  const id = `C-${2489 + count + 1}`;

  const complaint = await prisma.complaint.create({
    data: {
      id,
      userId: auth.user.id,
      userName: v.data.userName,
      userRoom: v.data.userRoom ?? null,
      category: v.data.category,
      title: v.data.title,
      description: v.data.description,
      photos: JSON.stringify(v.data.photos),
      priority: v.data.priority,
      status: "PENDING",
    },
  });

  const responseData = { ...complaint, photos: v.data.photos };
  broadcastSSE("NEW_COMPLAINT", responseData);
  return NextResponse.json(responseData);
}

function safeParse(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
