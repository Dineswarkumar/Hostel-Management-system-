"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, Calendar, Clock, Check, X, ShieldAlert, AlertCircle, Mail, Phone } from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import { leavesService, type Leave } from "@/features/leaves";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function LeavesPage() {
  return (
    <RoleGuard>
      <LeavesContent />
    </RoleGuard>
  );
}

function LeavesContent() {
  const { user } = useAuth();
  const [leaves, setLeaves] = React.useState<Leave[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Leave["status"] | "ALL">("PENDING");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const isStudent = user?.role === "STUDENT";
  const canApprove = user?.role === "STAFF" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const refresh = React.useCallback(async () => {
    if (!user) return;
    try {
      const list = await leavesService.list(user.id);
      setLeaves(list);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to load leaves", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time SSE updates
  React.useEffect(() => {
    if (!user) return;
    const es = new EventSource(`/api/realtime?userId=${user.id}`);

    const handleUpdate = () => {
      refresh();
    };

    es.addEventListener("NEW_LEAVE", handleUpdate);
    es.addEventListener("UPDATE_LEAVE", handleUpdate);

    return () => {
      es.close();
    };
  }, [user, refresh]);

  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (!user) return;
    setBusyId(id);
    try {
      const updated = await leavesService.updateStatus(id, status, { id: user.id, name: user.name });
      setLeaves((curr) => curr.map((l) => (l.id === updated.id ? updated : l)));
      toast({ title: `Leave ${status.toLowerCase()} successfully`, tone: "success" });
    } catch (error) {
      toast({ title: "Failed to update leave status", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-7 w-7 text-primary" /> Outpass & Leaves
        </h1>
        <p className="text-muted text-sm">
          {isStudent
            ? "Apply for weekend home visits, outpasses, and track warden approvals."
            : "Review student outpass and leave requests."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Student form */}
        {isStudent && (
          <div className="lg:col-span-1">
            <LeaveApplicationForm onSubmitted={refresh} />
          </div>
        )}

        {/* Right column: List of leaves */}
        <div className={cn("space-y-4", isStudent ? "lg:col-span-2" : "lg:col-span-3")}>
          {/* Admin filters */}
          {canApprove && (
            <div className="flex flex-wrap gap-2 mb-2">
              {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((s) => {
                const count = s === "ALL" ? leaves.length : leaves.filter((l) => l.status === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2",
                      filter === s ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-text"
                    )}
                  >
                    {s === "ALL" ? "All Requests" : s.charAt(0) + s.slice(1).toLowerCase()}
                    <span className="opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Student filters */}
          {isStudent && (
            <div className="flex flex-wrap gap-2 mb-2">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
                const count = s === "ALL" ? leaves.length : leaves.filter((l) => l.status === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s === "ALL" ? "ALL" : s)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      (filter === s || (s === "ALL" && filter === "ALL"))
                        ? "bg-primary text-primary-fg"
                        : "bg-surface-2 text-muted hover:text-text"
                    )}
                  >
                    {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : filtered.length === 0 ? (
            <GlassSurface className="p-12 text-center text-sm text-muted">
              {filter === "PENDING"
                ? "No pending leave requests."
                : filter === "APPROVED"
                ? "No approved leaves."
                : "No leave records found."}
            </GlassSurface>
          ) : (
            <div className="space-y-3">
              {filtered.map((l) => (
                <LeaveRow
                  key={l.id}
                  leave={l}
                  canApprove={canApprove}
                  busy={busyId === l.id}
                  onApprove={() => handleUpdateStatus(l.id, "APPROVED")}
                  onReject={() => handleUpdateStatus(l.id, "REJECTED")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaveApplicationForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const valid = fromDate && toDate && reason.trim().length > 5;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!valid) {
      toast({ title: "Incomplete details", description: "Reason must be at least 6 characters.", tone: "warning" });
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast({ title: "Invalid date range", description: "From Date cannot be after To Date.", tone: "warning" });
      return;
    }

    setLoading(true);
    try {
      await leavesService.apply({
        userId: user.id,
        userName: user.name,
        userRoom: user.roomNumber ? `Room ${user.roomNumber}${user.blockName ? ` / ${user.blockName}` : ""}` : undefined,
        fromDate,
        toDate,
        reason,
      });
      setFromDate("");
      setToDate("");
      setReason("");
      toast({ title: "Application submitted", description: "Warden will review shortly.", tone: "success" });
      onSubmitted();
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message || "Something went wrong.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassSurface intensity="strong" className="p-5 space-y-4 h-fit">
      <h2 className="font-semibold text-lg flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" /> Request Leave
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from-date">From Date</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-date">To Date</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Outpass</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Going home for family festival..."
            required
            rows={3}
          />
        </div>

        <Button type="submit" variant="skeuo" className="w-full" loading={loading}>
          Submit Application
        </Button>
      </form>
    </GlassSurface>
  );
}

function LeaveRow({
  leave, canApprove, busy, onApprove, onReject,
}: {
  leave: Leave;
  canApprove: boolean;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [showDetails, setShowDetails] = React.useState(false);

  const statusTone = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
    CANCELLED: "default",
  }[leave.status] as "warning" | "success" | "danger" | "default";

  const isPending = leave.status === "PENDING";

  return (
    <>
      <div onClick={() => setShowDetails(true)} className="cursor-pointer">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <GlassSurface className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all group">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={statusTone}>{leave.status}</Badge>
                <div className="text-sm font-semibold flex items-center gap-1 text-text group-hover:text-primary transition-colors">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span>{leave.fromDate}</span>
                  <span className="opacity-55 font-normal">to</span>
                  <span>{leave.toDate}</span>
                </div>
              </div>
              <p className="text-sm text-text-muted leading-relaxed font-normal line-clamp-2">{leave.reason}</p>
              <div className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-text">{leave.userName}</span>
                {leave.userRoom && <span>· {leave.userRoom}</span>}
                <span>· Applied {new Date(leave.createdAt).toLocaleDateString()}</span>
                {leave.approverName && (
                  <span className="text-success font-medium">
                    · Reviewed by {leave.approverName}
                  </span>
                )}
              </div>
            </div>

            {/* Action Controls (Warden only) */}
            {canApprove && isPending && (
              <div className="flex gap-2 shrink-0 sm:self-center" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="neu"
                  disabled={busy}
                  onClick={onReject}
                  className="text-danger flex items-center gap-1"
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="skeuo"
                  disabled={busy}
                  onClick={onApprove}
                  className="flex items-center gap-1"
                >
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </div>
            )}
          </GlassSurface>
        </motion.div>
      </div>

      {/* Leave Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col z-10"
            >
              <GlassSurface intensity="strong" className="p-6 flex flex-col max-h-[90vh] border-primary/20 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Outpass Request</span>
                    <Badge tone={statusTone}>{leave.status}</Badge>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-1 rounded-lg hover:bg-surface-2 text-muted hover:text-text transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
                  {/* Dates */}
                  <div>
                    <span className="text-xs text-muted uppercase tracking-wider font-semibold">Date Range</span>
                    <div className="text-base font-semibold mt-1 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>{leave.fromDate}</span>
                      <span className="text-muted font-normal text-sm">to</span>
                      <span>{leave.toDate}</span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <span className="text-xs text-muted uppercase tracking-wider font-semibold">Reason</span>
                    <p className="text-sm text-text-muted mt-1 bg-surface-2/40 p-3.5 rounded-xl border border-border/20 whitespace-pre-wrap leading-relaxed">
                      {leave.reason}
                    </p>
                  </div>

                  {/* Student Details Card */}
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                    <div className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarCheck className="h-3.5 w-3.5" /> Student Information
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted text-xs block">Name</span>
                        <span className="font-medium text-text">{leave.userName}</span>
                      </div>
                      {leave.userRoom && (
                        <div>
                          <span className="text-muted text-xs block">Room</span>
                          <span className="font-medium text-text">{leave.userRoom}</span>
                        </div>
                      )}
                      {leave.userEmail && (
                        <div>
                          <span className="text-muted text-xs block">Email</span>
                          <a href={`mailto:${leave.userEmail}`} className="text-primary hover:underline flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {leave.userEmail}
                          </a>
                        </div>
                      )}
                      {leave.userPhone && (
                        <div>
                          <span className="text-muted text-xs block">Phone</span>
                          <a href={`tel:${leave.userPhone}`} className="text-primary hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {leave.userPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Info */}
                  <div className="text-xs text-muted border-t border-border/30 pt-3 flex flex-wrap justify-between gap-2">
                    <div>Submitted: {new Date(leave.createdAt).toLocaleString()}</div>
                    {leave.approverName && <div>Approved by: {leave.approverName}</div>}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-muted">
                    {isPending ? "Pending review" : `Status: ${leave.status}`}
                  </div>
                  <div className="flex gap-2">
                    {canApprove && isPending && (
                      <>
                        <Button
                          variant="neu"
                          disabled={busy}
                          onClick={() => {
                            onReject();
                            setShowDetails(false);
                          }}
                          className="text-danger"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="skeuo"
                          disabled={busy}
                          onClick={() => {
                            onApprove();
                            setShowDetails(false);
                          }}
                        >
                          Approve
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" onClick={() => setShowDetails(false)}>Close</Button>
                  </div>
                </div>
              </GlassSurface>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
