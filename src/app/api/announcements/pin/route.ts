import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const current = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { pinned: !current.pinned },
    });

    // Broadcast pin update
    broadcastSSE("UPDATE_ANNOUNCEMENT", updated);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Toggle pin error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
