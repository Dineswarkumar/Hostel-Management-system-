import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viewerRole = searchParams.get("viewerRole");

    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { pinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Filter by viewerRole if specified
    const filtered = announcements.filter((a) => {
      if (a.targetRole && viewerRole && a.targetRole !== viewerRole) {
        return false;
      }
      return true;
    });

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error("Fetch announcements error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: content, postedById, postedByName, targetRole, priority, pinned } = body;

    if (!title || !content || !postedById || !postedByName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body: content,
        postedById,
        postedByName,
        targetRole: targetRole || null,
        priority: priority || "NORMAL",
        pinned: !!pinned,
      },
    });

    // Broadcast update via SSE
    broadcastSSE("NEW_ANNOUNCEMENT", announcement);

    return NextResponse.json(announcement);
  } catch (error: any) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    // Broadcast removal via SSE
    broadcastSSE("DELETE_ANNOUNCEMENT", { id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete announcement error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
