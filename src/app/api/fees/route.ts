import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  // Students see their own; admin/super/staff can see all by passing ?userId=
  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get("userId");

  let where: Record<string, unknown> = {};
  if (auth.user.role === "STUDENT") {
    where.userId = auth.user.id;
  } else if (queryUserId) {
    where.userId = queryUserId;
  }

  const invoices = await prisma.feeInvoice.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          roomNumber: true,
          blockName: true,
        },
      },
    },
    orderBy: { month: "desc" },
  });
  const parsed = invoices.map((inv) => ({
    ...inv,
    components: safeParse(inv.components),
  }));
  return NextResponse.json(parsed);
}

function safeParse(s: string | null | undefined): unknown {
  if (!s) return [];
  try { return JSON.parse(s); } catch { return []; }
}
