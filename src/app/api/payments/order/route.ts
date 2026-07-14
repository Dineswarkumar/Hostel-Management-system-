import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { paymentOrderSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["STUDENT"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, paymentOrderSchema);
  if ("error" in v) return v.error;

  const invoice = await prisma.feeInvoice.findUnique({ where: { id: v.data.invoiceId } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.userId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (invoice.status === "PAID") {
    return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
  }

  const amountInPaise = Math.round(invoice.total * 100);
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Mock mode — no keys, return a stub order so the UI can still flow
  if (!keyId || !keySecret) {
    return NextResponse.json({
      id: `order_mock_${Date.now()}`,
      amount: amountInPaise,
      currency: "INR",
      receipt: invoice.id,
      isMock: true,
      keyId: "rzp_test_placeholder",
    });
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: invoice.id,
      notes: { invoiceId: invoice.id, userId: auth.user.id },
    });
    return NextResponse.json({ ...order, isMock: false, keyId });
  } catch (err) {
    console.error("Razorpay order error:", err);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 502 }
    );
  }
}
