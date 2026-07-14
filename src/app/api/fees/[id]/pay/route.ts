import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";

/**
 * Mark an invoice as paid. Normally you would NOT call this directly —
 * the verify route does it after a real Razorpay payment succeeds.
 * This endpoint is useful for admin manual reconciliation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request, ["ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const invoice = await prisma.feeInvoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "PAID") {
    return NextResponse.json({ ...invoice, components: safeParse(invoice.components) });
  }

  const updated = await prisma.feeInvoice.update({
    where: { id: params.id },
    data: { status: "PAID", paidAt: new Date(), transactionId: `manual_${Date.now()}` },
  });
  const parsed = { ...updated, components: safeParse(updated.components) };
  broadcastSSE("UPDATE_FEE", parsed);
  return NextResponse.json(parsed);
}

function safeParse(s: string | null | undefined): unknown {
  if (!s) return [];
  try { return JSON.parse(s); } catch { return []; }
}
