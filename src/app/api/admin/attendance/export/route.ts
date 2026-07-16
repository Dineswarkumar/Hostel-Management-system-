import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return str;
}

// GET /api/admin/attendance/export
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  if (
    auth.user.role !== "STAFF" &&
    auth.user.role !== "ADMIN" &&
    auth.user.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all students
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { roomNumber: "asc" },
  });

  // Get all unique dates present in attendance logs (ordered chronologically)
  const distinctDates = await prisma.attendance.findMany({
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "asc" },
  });

  const dates = distinctDates.map((d) => d.date);

  // Fetch all attendance logs
  const records = await prisma.attendance.findMany();

  // Construct CSV Header: Student Name, Room, Block, Date 1, Date 2...
  let csv = "Student Name,Room Number,Block Name";
  dates.forEach((date) => {
    csv += `,${date}`;
  });
  csv += "\n";

  // Construct CSV Rows
  students.forEach((stud) => {
    const name = escapeCSV(stud.name);
    const room = escapeCSV(stud.roomNumber);
    const block = escapeCSV(stud.blockName);
    
    let row = `${name},${room},${block}`;

    dates.forEach((date) => {
      const match = records.find((r) => r.userId === stud.id && r.date === date);
      row += `,${match ? match.status : "UNMARKED"}`;
    });

    csv += `${row}\n`;
  });

  // Return CSV file response
  const filename = `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
