import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        user: {
          select: {
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsed = complaints.map((c) => ({
      ...c,
      photos: JSON.parse(c.photos || "[]"),
      userPhone: c.user?.phone || null,
      userEmail: c.user?.email || null,
    }));

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Fetch complaints error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userName, userRoom, category, title, description, priority, photos } = body;

    if (!userId || !userName || !category || !title || !description || !priority) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate unique complaint ID: count existing and offset
    const count = await prisma.complaint.count();
    const complaintId = `C-${2489 + count + 1}`;

    const complaint = await prisma.complaint.create({
      data: {
        id: complaintId,
        userId,
        userName,
        userRoom: userRoom || null,
        category,
        title,
        description,
        photos: JSON.stringify(photos || []),
        priority,
        status: "PENDING",
      },
    });

    const responseData = {
      ...complaint,
      photos: photos || [],
    };

    // Broadcast new complaint
    broadcastSSE("NEW_COMPLAINT", responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Create complaint error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
