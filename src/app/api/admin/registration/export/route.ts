import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper function to escape CSV values
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val);
  // If value contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return str;
}

// GET /api/admin/registration/export
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  if (auth.user.role !== "ADMIN" && auth.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all registrations ordered by timestamp
  const registrations = await prisma.hostelRegistration.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Build CSV headers
  let csv = "Serial No,Name,Phone Number,Selected Room Type,Date,Time\n";

  // Build rows
  registrations.forEach((reg, index) => {
    const serial = index + 1;
    const name = escapeCSV(reg.name);
    const phone = escapeCSV(reg.phone);
    const roomType = escapeCSV(reg.roomType);
    
    // Split date & time from createdAt
    const dateObj = new Date(reg.createdAt);
    const date = dateObj.toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" });
    const time = dateObj.toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

    csv += `${serial},${name},${phone},${roomType},${date},${time}\n`;
  });

  // Return CSV file response
  const filename = `registrations_${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
