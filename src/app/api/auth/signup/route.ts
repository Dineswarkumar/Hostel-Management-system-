import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { signUpSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const v = await validateBody(request, signUpSchema);
  if ("error" in v) return v.error;
  const { name, email, password, role, phone } = v.data;

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashed,
      role,
      phone: phone ?? null,
    },
  });

  const token = createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "STUDENT" | "STAFF" | "ADMIN" | "SUPER_ADMIN",
  });

  const { password: _pw, ...safe } = user;
  return NextResponse.json({ user: safe, token });
}
