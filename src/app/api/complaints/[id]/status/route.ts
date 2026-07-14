import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status, assignedTo } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Complaint ID is required" }, { status: 400 });
    }

    const current = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const data: any = {
      status,
      updatedAt: new Date(),
    };

    if (assignedTo) {
      data.assignedToId = assignedTo.id;
      data.assignedToName = assignedTo.name;
    }

    if (status === "RESOLVED" || status === "CLOSED") {
      data.resolvedAt = new Date();
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data,
    });

    const parsed = {
      ...updated,
      photos: JSON.parse(updated.photos || "[]"),
    };

    // Broadcast update
    broadcastSSE("UPDATE_COMPLAINT", parsed);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Update complaint status error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
