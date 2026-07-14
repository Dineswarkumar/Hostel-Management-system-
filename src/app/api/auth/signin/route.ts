import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { signInSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const v = await validateBody(request, signInSchema);
  if ("error" in v) return v.error;

  const { email, password } = v.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Support legacy plain-text seeds by detecting a bcrypt hash prefix.
  const stored = user.password;
  const isHashed = stored.startsWith("$2") || stored.startsWith("$2a$") || stored.startsWith("$2b$");
  const ok = isHashed
    ? await bcrypt.compare(password, stored)
    : stored === password;

  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Auto-upgrade plain-text seed to bcrypt on first successful login.
  if (!isHashed) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(password, 10) },
    });
  }

  const token = createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "STUDENT" | "STAFF" | "ADMIN" | "SUPER_ADMIN",
  });

  const { password: _pw, ...userWithoutPassword } = user;
  return NextResponse.json({ user: userWithoutPassword, token });
}
