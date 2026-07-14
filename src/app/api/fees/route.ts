import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const invoices = await prisma.feeInvoice.findMany({
      where: { userId },
      orderBy: { month: "desc" },
    });

    const parsed = invoices.map((inv) => ({
      ...inv,
      components: JSON.parse(inv.components || "[]"),
    }));

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Fetch fees error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
