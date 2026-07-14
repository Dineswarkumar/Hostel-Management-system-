import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ["SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const [users, announcements, complaints, buses, leaves, invoices, busVotes] = await Promise.all([
    prisma.user.count(),
    prisma.announcement.count(),
    prisma.complaint.count(),
    prisma.bus.count(),
    prisma.leave.count(),
    prisma.feeInvoice.count(),
    prisma.busVote.count(),
  ]);

  const memory = process.memoryUsage();
  return NextResponse.json({
    tableCounts: { users, announcements, complaints, buses, leaves, invoices, busVotes },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memoryHeapUsed: memory.heapUsed,
      memoryHeapTotal: memory.heapTotal,
      uptime: process.uptime(),
    },
  });
}
