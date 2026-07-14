import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, password, role, phone } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Name, email, password, and role are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password,
        role,
        phone,
      },
    });

    const { password: _pw, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token: `session_${user.id}_${Date.now()}`,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
