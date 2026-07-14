"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Download, Receipt, ShieldCheck, Search, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import { feesService, type FeeInvoice, type FeeStatus } from "@/features/fees";
import { getRoomType } from "@/features/rooms/catalog";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { formatINR, formatDate, cn } from "@/lib/utils";

export default function FeesPage() {
  return (
    <RoleGuard>
      <FeesWrapper />
    </RoleGuard>
  );
}

function FeesWrapper() {
  const { user } = useAuth();
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
    return <AdminFeesView />;
  }
  return <FeesContent />;
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

  // Real-time SSE updates
  React.useEffect(() => {
    if (!user) return;
    const es = new EventSource(`/api/realtime?userId=${user.id}`);

    const handleUpdate = () => {
      refresh();
    };

    es.addEventListener("UPDATE_FEE", handleUpdate);

    return () => {
      es.close();
    };
  }, [user, refresh]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (invoice: FeeInvoice) => {
    if (!user) return;
    setPaying(invoice.id);
    try {
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        toast({ title: "Failed to load payment gateway", tone: "danger" });
        return;
      }

      const orderRes = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.total,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Failed to initiate payment");
      }

      const orderData = await orderRes.json();

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "HostelHub",
        description: `Hostel Fee — ${invoice.month}`,
        order_id: orderData.isMock ? undefined : orderData.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: orderData.id,
                razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || "mock_signature",
                invoiceId: invoice.id,
                isMock: orderData.isMock,
              }),
            });

            if (verifyRes.ok) {
              toast({
                title: "Payment successful",
                description: "Receipt has been emailed and saved to your vault.",
                tone: "success",
              });
              refresh();
            } else {
              toast({ title: "Payment verification failed", tone: "danger" });
            }
          } catch (e: any) {
            toast({ title: "Verification failed", description: e.message, tone: "danger" });
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || "",
        },
        theme: {
          color: "#0F52BA",
        },
      };

      if (orderData.isMock) {
        const confirmPayment = confirm(
          `[HostelHub Payment Sandbox]\n\nPay outstanding fee: ${formatINR(invoice.total)}?\n\nClick OK to simulate successful checkout.`
        );
        if (confirmPayment) {
          options.handler({
            razorpay_payment_id: `pay_mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            razorpay_signature: "mock_sandbox_sig",
          });
        }
      } else {
        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();
      }
    } catch (e: any) {
      toast({ title: "Payment error", description: e.message || "Failed to process payment", tone: "danger" });
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
        <OutstandingCard invoice={outstanding} paying={paying === outstanding.id} onPay={() => handlePay(outstanding)} />
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

function AdminFeesView() {
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const { toast } = useToast();

  const refresh = React.useCallback(async () => {
    try {
      const data = await feesService.listAll();
      setInvoices(data);
    } catch (e: any) {
      toast({ title: "Failed to load invoices", description: e.message, tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time SSE updates
  React.useEffect(() => {
    const es = new EventSource("/api/realtime");
    const handleUpdate = () => {
      refresh();
    };
    es.addEventListener("UPDATE_FEE", handleUpdate);
    return () => es.close();
  }, [refresh]);

  const filtered = invoices.filter((inv) => {
    const studentName = inv.user?.name || "";
    const studentEmail = inv.user?.email || "";
    const room = inv.user?.roomNumber || "";
    const q = query.toLowerCase();
    return (
      studentName.toLowerCase().includes(q) ||
      studentEmail.toLowerCase().includes(q) ||
      room.toLowerCase().includes(q) ||
      inv.month.includes(q) ||
      inv.status.toLowerCase().includes(q)
    );
  });

  const totalInvoices = invoices.length;
  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.total, 0);
  const totalPending = invoices.filter((i) => i.status === "PENDING").reduce((sum, i) => sum + i.total, 0);
  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const pendingCount = invoices.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Receipt className="h-7 w-7 text-primary" /> Fees Dashboard
        </h1>
        <p className="text-muted text-sm">Monitor student billing collections, paid records, and outstanding dues.</p>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassSurface className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs text-muted font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-success" /> Total Collected
            </span>
            <div className="font-bold text-2xl text-success mt-2">{formatINR(totalPaid)}</div>
          </div>
          <div className="text-[10px] text-muted mt-3">From {paidCount} completed checkouts</div>
        </GlassSurface>

        <GlassSurface className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs text-muted font-medium flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-warning" /> Total Outstanding
            </span>
            <div className="font-bold text-2xl text-warning mt-2">{formatINR(totalPending)}</div>
          </div>
          <div className="text-[10px] text-muted mt-3">Across {pendingCount} unpaid student bills</div>
        </GlassSurface>

        <GlassSurface className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs text-muted font-medium flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-primary" /> Collection Rate
            </span>
            <div className="font-bold text-2xl text-primary mt-2">
              {totalInvoices > 0 ? `${Math.round((paidCount / totalInvoices) * 100)}%` : "0%"}
            </div>
          </div>
          <div className="text-[10px] text-muted mt-3">Total generated bills: {totalInvoices}</div>
        </GlassSurface>
      </div>

      <GlassSurface className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name, room, month, or transaction ID…"
            className="pl-10"
          />
        </div>
      </GlassSurface>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassSurface className="p-12 text-center text-sm text-muted">
          No student invoices found matching your criteria.
        </GlassSurface>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/30 glass-strong">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-surface-2/40 text-muted-foreground font-medium">
                <th className="p-4">Student</th>
                <th className="p-4">Month</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-2/10 transition-colors">
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-text">{inv.user?.name || "Deleted User"}</div>
                      <div className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                        <span>{inv.user?.email}</span>
                        {inv.user?.roomNumber && (
                          <span className="bg-surface-3 px-1.5 py-0.5 rounded text-[10px] border border-border/30">
                            Room {inv.user?.roomNumber} {inv.user?.blockName ? `(${inv.user.blockName})` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs">{inv.month}</td>
                  <td className="p-4 text-right font-semibold text-text">{formatINR(inv.total)}</td>
                  <td className="p-4 text-xs text-muted">{formatDate(inv.dueDate)}</td>
                  <td className="p-4">
                    <Badge tone={inv.status === "PAID" ? "success" : "warning"}>
                      {inv.status === "PAID" ? "Paid" : "Pending"}
                    </Badge>
                  </td>
                  <td className="p-4 text-xs">
                    {inv.status === "PAID" ? (
                      <div className="space-y-0.5 text-muted">
                        <div>Paid: {formatDate(inv.paidAt)}</div>
                        <div className="font-mono text-[10px] text-primary truncate max-w-[150px]" title={inv.transactionId}>
                          {inv.transactionId}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
