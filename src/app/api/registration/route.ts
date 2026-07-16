import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/registration
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  // Find if this user already has a registration
  const registration = await prisma.hostelRegistration.findFirst({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(registration || null);
}

// POST /api/registration
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  // Check if registration window is open
  const window = await prisma.registrationWindow.findUnique({
    where: { id: "active_window" },
  });

  if (!window || !window.isOpen) {
    return NextResponse.json({ error: "Hostel registration is currently closed." }, { status: 403 });
  }

  const body = await request.json();
  const { name, phone, roomType } = body;

  if (!name || !phone || !roomType) {
    return NextResponse.json({ error: "Missing required fields: name, phone, roomType" }, { status: 400 });
  }

  // Validate roomType
  const validRoomTypes = ["SINGLE_SEATER", "TWO_SEATER", "THREE_SEATER", "FOUR_SEATER"];
  if (!validRoomTypes.includes(roomType)) {
    return NextResponse.json({ error: "Invalid room type selected." }, { status: 400 });
  }

  // Create new registration (linked to user if they are logged in)
  const registration = await prisma.hostelRegistration.create({
    data: {
      userId: auth.user.id,
      name,
      phone,
      roomType,
      createdAt: new Date(), // Saves exact date, time, and seconds
    },
  });

  return NextResponse.json(registration);
}
