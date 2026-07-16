import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/registration/status
export async function GET(request: NextRequest) {
  // Anyone authenticated can check if registration is open
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const window = await prisma.registrationWindow.findUnique({
    where: { id: "active_window" },
  });

  return NextResponse.json({
    isOpen: window?.isOpen ?? false,
    startedAt: window?.startedAt ?? null,
  });
}

// POST /api/admin/registration/status
export async function POST(request: NextRequest) {
  // Only ADMIN/SUPER_ADMIN can toggle the registration window
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  if (auth.user.role !== "ADMIN" && auth.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { isOpen } = body;

  if (typeof isOpen !== "boolean") {
    return NextResponse.json({ error: "Invalid body parameter 'isOpen'" }, { status: 400 });
  }

  const updated = await prisma.registrationWindow.upsert({
    where: { id: "active_window" },
    update: {
      isOpen,
      startedAt: isOpen ? new Date() : null,
    },
    create: {
      id: "active_window",
      isOpen,
      startedAt: isOpen ? new Date() : null,
    },
  });

  return NextResponse.json({
    isOpen: updated.isOpen,
    startedAt: updated.startedAt,
  });
}
