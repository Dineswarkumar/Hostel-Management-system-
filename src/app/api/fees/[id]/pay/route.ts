import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const current = await prisma.feeInvoice.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (current.status === "PAID") {
      return NextResponse.json({
        ...current,
        components: JSON.parse(current.components || "[]"),
      });
    }

    const updated = await prisma.feeInvoice.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        transactionId: `txn_${id}_${Date.now()}`,
      },
    });

    const parsed = {
      ...updated,
      components: JSON.parse(updated.components || "[]"),
    };

    // Broadcast payment update
    broadcastSSE("UPDATE_FEE", parsed);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Pay invoice error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
