import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { userCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const safe = users.map(({ password: _p, ...u }) => u);
  return NextResponse.json(safe);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, userCreateSchema);
  if ("error" in v) return v.error;

  const exists = await prisma.user.findUnique({ where: { email: v.data.email.toLowerCase() } });
  if (exists) {
    return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(v.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: v.data.name,
      email: v.data.email.toLowerCase(),
      password: hashed,
      role: v.data.role,
      phone: v.data.phone ?? null,
      roomNumber: v.data.roomNumber ?? null,
      blockName: v.data.blockName ?? null,
      parentPhone: v.data.parentPhone ?? null,
    },
  });
  const { password: _p, ...safe } = user;
  return NextResponse.json(safe);
}
