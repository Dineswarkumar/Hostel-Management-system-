import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const buses = await prisma.bus.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (userId) {
      const votes = await prisma.busVote.findMany({
        where: { userId },
      });
      const votesMap = new Map(votes.map((v) => [v.busId, v.type]));

      const enriched = buses.map((b) => ({
        ...b,
        userVote: votesMap.get(b.id) || null,
      }));
      return NextResponse.json(enriched);
    }

    return NextResponse.json(buses);
  } catch (error: any) {
    console.error("Fetch buses error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, time, description, createdById, createdByName } = body;

    if (!name || !time || !description || !createdById || !createdByName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bus = await prisma.bus.create({
      data: {
        name: name.trim(),
        time: time.trim(),
        description: description.trim(),
        status: "SCHEDULED",
        upvotes: 0,
        downvotes: 0,
        createdById,
        createdByName,
      },
    });

    broadcastSSE("NEW_BUS", bus);

    return NextResponse.json(bus);
  } catch (error: any) {
    console.error("Create bus error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, name, time, description } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const data: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) data.status = status;
    if (name !== undefined) data.name = name.trim();
    if (time !== undefined) data.time = time.trim();
    if (description !== undefined) data.description = description.trim();

    const updated = await prisma.bus.update({
      where: { id },
      data,
    });

    broadcastSSE("UPDATE_BUS", updated);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update bus error:", error);
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

    await prisma.bus.delete({
      where: { id },
    });

    broadcastSSE("DELETE_BUS", { id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete bus error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
