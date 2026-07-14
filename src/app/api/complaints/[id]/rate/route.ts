import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { rating } = await request.json();

    if (!id || typeof rating !== "number") {
      return NextResponse.json({ error: "ID and rating (number) are required" }, { status: 400 });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: { rating },
    });

    const parsed = {
      ...updated,
      photos: JSON.parse(updated.photos || "[]"),
    };

    // Broadcast rating update
    broadcastSSE("UPDATE_COMPLAINT", parsed);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Rate complaint error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
