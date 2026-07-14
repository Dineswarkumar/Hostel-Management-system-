import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  const { password: _pw, ...safe } = user;
  return NextResponse.json({ user: safe });
}
