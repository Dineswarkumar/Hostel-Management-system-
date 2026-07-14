import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { paymentVerifySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["STUDENT"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, paymentVerifySchema);
  if ("error" in v) return v.error;
  const { invoiceId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = v.data;

  const invoice = await prisma.feeInvoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.userId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (invoice.status === "PAID") {
    return NextResponse.json({ success: true, invoice: { ...invoice, components: safeParse(invoice.components) } });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isMock = razorpay_order_id.startsWith("order_mock_");

  // Mock mode — accept any signature, mark paid
  if (isMock || !keySecret) {
    const updated = await prisma.feeInvoice.update({
      where: { id: invoiceId },
      data: { status: "PAID", paidAt: new Date(), transactionId: razorpay_payment_id },
    });
    const parsed = { ...updated, components: safeParse(updated.components) };
    broadcastSSE("UPDATE_FEE", parsed);
    return NextResponse.json({ success: true, invoice: parsed, isMock: true });
  }

  // Real mode — verify HMAC signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const updated = await prisma.feeInvoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date(), transactionId: razorpay_payment_id },
  });
  const parsed = { ...updated, components: safeParse(updated.components) };
  broadcastSSE("UPDATE_FEE", parsed);
  return NextResponse.json({ success: true, invoice: parsed });
}

function safeParse(s: string | null | undefined): unknown {
  if (!s) return [];
  try { return JSON.parse(s); } catch { return []; }
}
