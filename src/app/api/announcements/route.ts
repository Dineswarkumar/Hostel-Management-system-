import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { announcementSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const viewerRole = searchParams.get("viewerRole");

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const filtered = announcements.filter((a) => {
    if (a.targetRole && viewerRole && a.targetRole !== viewerRole) return false;
    return true;
  });
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["STAFF", "ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, announcementSchema);
  if ("error" in v) return v.error;

  // postedById must match the authenticated user (don't trust client)
  if (v.data.postedById !== auth.user.id) {
    return NextResponse.json(
      { error: "postedById does not match session" },
      { status: 403 }
    );
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: v.data.title,
      body: v.data.body,
      postedById: auth.user.id,
      postedByName: auth.user.name,
      targetRole: v.data.targetRole ?? null,
      priority: v.data.priority,
      pinned: v.data.pinned,
    },
  });

  broadcastSSE("NEW_ANNOUNCEMENT", announcement);
  return NextResponse.json(announcement);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request, ["STAFF", "ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  // Only ADMIN+ can delete
  if (auth.user.role === "STAFF") {
    const a = await prisma.announcement.findUnique({ where: { id } });
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (a.postedById !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.announcement.delete({ where: { id } });
  broadcastSSE("DELETE_ANNOUNCEMENT", { id });
  return NextResponse.json({ success: true });
}
