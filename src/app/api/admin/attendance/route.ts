import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/attendance?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  // Only STAFF, ADMIN, and SUPER_ADMIN can view attendance details
  if (
    auth.user.role !== "STAFF" &&
    auth.user.role !== "ADMIN" &&
    auth.user.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid or missing 'date' parameter. Use YYYY-MM-DD" }, { status: 400 });
  }

  // Fetch all students
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      roomNumber: true,
      blockName: true,
    },
    orderBy: { roomNumber: "asc" },
  });

  // Fetch attendance records for this date
  const records = await prisma.attendance.findMany({
    where: { date },
  });

  // Map students with their status
  const mapped = students.map((stud) => {
    const record = records.find((r) => r.userId === stud.id);
    return {
      ...stud,
      attendanceStatus: record?.status || null, // null if not marked yet
      markedByName: record?.markedByName || null,
      updatedAt: record?.updatedAt || null,
    };
  });

  return NextResponse.json(mapped);
}

// POST /api/admin/attendance
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  // Only STAFF, ADMIN, and SUPER_ADMIN can mark attendance
  if (
    auth.user.role !== "STAFF" &&
    auth.user.role !== "ADMIN" &&
    auth.user.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { date, records } = body; // records: [{ userId: string, status: "PRESENT" | "ABSENT" | "LATE" }]

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
  }

  if (!Array.isArray(records)) {
    return NextResponse.json({ error: "Invalid body. 'records' must be an array" }, { status: 400 });
  }

  // Mark/update attendance records
  for (const item of records) {
    const { userId, status } = item;
    if (!userId || !["PRESENT", "ABSENT", "LATE"].includes(status)) continue;

    // Fetch user details to save snapshot name & room
    const userDetail = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userDetail) continue;

    const roomText = userDetail.roomNumber
      ? `${userDetail.roomNumber}${userDetail.blockName ? ` / ${userDetail.blockName}` : ""}`
      : null;

    await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        status,
        userName: userDetail.name,
        userRoom: roomText,
        markedById: auth.user.id,
        markedByName: auth.user.name,
      },
      create: {
        userId,
        date,
        status,
        userName: userDetail.name,
        userRoom: roomText,
        markedById: auth.user.id,
        markedByName: auth.user.name,
      },
    });
  }

  // Database Pruning Optimization: Delete records older than 1 year (365 days)
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  try {
    const pruneCount = await prisma.attendance.deleteMany({
      where: {
        createdAt: {
          lt: oneYearAgo,
        },
      },
    });
    if (pruneCount.count > 0) {
      console.log(`Pruned ${pruneCount.count} attendance records older than 1 year.`);
    }
  } catch (pruneErr) {
    console.error("Failed to prune old attendance records:", pruneErr);
  }

  return NextResponse.json({ success: true });
}
