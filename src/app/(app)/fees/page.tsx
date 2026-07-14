"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Download, Receipt, ShieldCheck } from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import { feesService, type FeeInvoice, type FeeStatus } from "@/features/fees";
import { getRoomType } from "@/features/rooms/catalog";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatINR, formatDate, cn } from "@/lib/utils";

export default function FeesPage() {
  return (
    <RoleGuard>
      <FeesContent />
    </RoleGuard>
  );
}

function FeesContent() {
  const { user } = useAuth();
  const [invoices, setInvoices] = React.useState<FeeInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [paying, setPaying] = React.useState<string | null>(null);
  const { toast } = useToast();

  const refresh = React.useCallback(() => {
    if (!user) return;
    feesService.listForUser(user.id).then((r) => {
      setInvoices(r);
      setLoading(false);
    });
  }, [user]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const handlePay = async (id: string) => {
    setPaying(id);
    try {
      // Simulate payment
      await new Promise((r) => setTimeout(r, 1500));
      await feesService.pay(id);
      toast({
        title: "Payment successful",
        description: "Receipt has been emailed and saved to your vault.",
        tone: "success",
      });
      refresh();
    } finally {
      setPaying(null);
    }
  };

  const outstanding = invoices.find((i) => i.status === "PENDING");
  const paid = invoices.filter((i) => i.status === "PAID");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Fees</h1>
        <p className="text-muted text-sm">Pay dues, view history, download receipts.</p>
      </div>

      {loading ? (
        <Skeleton className="h-48" />
      ) : outstanding ? (
        <OutstandingCard invoice={outstanding} paying={paying === outstanding.id} onPay={() => handlePay(outstanding.id)} />
      ) : (
        <AllPaidCard />
      )}

      <section>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" /> Payment history
        </h2>
        {loading ? (
          <Skeleton className="h-32" />
        ) : paid.length === 0 ? (
          <GlassSurface className="p-8 text-center text-sm text-muted">
            No past payments.
          </GlassSurface>
        ) : (
          <div className="space-y-2">
            {paid.map((inv) => (
              <HistoryRow key={inv.id} invoice={inv} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OutstandingCard({
  invoice, paying, onPay,
}: {
  invoice: FeeInvoice;
  paying: boolean;
  onPay: () => void;
}) {
  const rt = getRoomType(invoice.roomType);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <GlassSurface intensity="strong" className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge tone="warning">Outstanding</Badge>
              <h2 className="text-2xl font-bold mt-2">Hostel fee — {invoice.month}</h2>
              <p className="text-muted text-sm">Room {rt.shortName} · {rt.name}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Due</div>
              <div className="font-semibold">{formatDate(invoice.dueDate)}</div>
            </div>
          </div>

          <div className="space-y-2 my-4">
            {invoice.components.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                <span className="text-muted">{c.name}</span>
                <span className="font-medium">{formatINR(c.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatINR(invoice.total)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="skeuo" size="lg" loading={paying} onClick={onPay} className="flex-1">
              <ShieldCheck className="h-4 w-4" /> Pay {formatINR(invoice.total)} via Razorpay
            </Button>
          </div>
          <p className="text-xs text-muted mt-2 text-center">
            Test mode — no real money moves. Razorpay integration in Phase 2.
          </p>
        </div>
      </GlassSurface>
    </motion.div>
  );
}

function AllPaidCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <GlassSurface intensity="strong" className="p-8 text-center">
        <div className="inline-flex h-14 w-14 rounded-full bg-success/15 grid place-items-center mb-3">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <div className="font-semibold text-lg">You're all paid up</div>
        <p className="text-sm text-muted mt-1">No outstanding dues. Nice.</p>
      </GlassSurface>
    </motion.div>
  );
}

function HistoryRow({ invoice }: { invoice: FeeInvoice }) {
  const rt = getRoomType(invoice.roomType);
  return (
    <GlassSurface className="p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl neu grid place-items-center shrink-0">
          <CreditCard className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{invoice.month} · {rt.shortName}</div>
          <div className="text-xs text-muted">
            Paid on {invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
            {invoice.transactionId && ` · ${invoice.transactionId.slice(0, 16)}…`}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold">{formatINR(invoice.total)}</div>
          <Badge tone="success" className="mt-0.5">Paid</Badge>
        </div>
        <Button variant="ghost" size="icon" aria-label="Download receipt">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </GlassSurface>
  );
}
