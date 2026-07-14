"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wrench, ArrowRight, Star, AlertCircle, X, Mail, Phone, User as UserIcon, Maximize2 } from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import {
  complaintsService,
  CATEGORY_LABEL,
  STATUS_LABEL,
  type Complaint,
  type ComplaintCategory,
  type Priority,
  type ComplaintStatus,
} from "@/features/complaints";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { timeAgo, cn } from "@/lib/utils";

export default function ComplaintsPage() {
  return (
    <RoleGuard>
      <ComplaintsContent />
    </RoleGuard>
  );
}

function ComplaintsContent() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<Complaint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<ComplaintStatus | "ALL">("ALL");
  const { toast } = useToast();

  const refresh = React.useCallback(() => {
    if (!user) return;
    const f = user.role === "STUDENT" ? { userId: user.id } : undefined;
    complaintsService.list(f).then((r) => {
      setItems(r);
      setLoading(false);
    });
  }, [user]);

  React.useEffect(() => { refresh(); }, [refresh]);

  React.useEffect(() => {
    if (!user) return;
    const es = new EventSource(`/api/realtime?userId=${user.id}`);

    const handleUpdate = () => {
      refresh();
    };

    es.addEventListener("NEW_COMPLAINT", handleUpdate);
    es.addEventListener("UPDATE_COMPLAINT", handleUpdate);

    return () => {
      es.close();
    };
  }, [user, refresh]);

  const filtered = filter === "ALL" ? items : items.filter((c) => c.status === filter);

  const handleStatus = async (id: string, status: ComplaintStatus) => {
    await complaintsService.updateStatus(id, status);
    toast({ title: "Status updated", tone: "success" });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {user?.role === "STUDENT" ? "My complaints" : user?.role === "STAFF" ? "My tasks" : "All complaints"}
          </h1>
          <p className="text-muted text-sm">
            {user?.role === "STUDENT"
              ? "Track your maintenance requests."
              : "Manage and resolve tickets."}
          </p>
        </div>
        {user?.role === "STUDENT" && (
          <Link href="/complaints/new">
            <Button variant="skeuo">
              <Plus className="h-4 w-4" /> Raise complaint
            </Button>
          </Link>
        )}
      </div>

      {user?.role !== "STUDENT" && (
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED"] as const).map((s) => {
            const count = s === "ALL" ? items.length : items.filter((c) => c.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2",
                  filter === s ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-text"
                )}
              >
                {s === "ALL" ? "All" : STATUS_LABEL[s]}
                <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState role={user?.role} />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ComplaintRow
              key={c.id}
              c={c}
              canManage={user?.role === "STAFF" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"}
              onUpdateStatus={(s) => handleStatus(c.id, s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ComplaintRow({
  c, canManage, onUpdateStatus,
}: {
  c: Complaint;
  canManage: boolean;
  onUpdateStatus: (s: ComplaintStatus) => void;
}) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [activePhoto, setActivePhoto] = React.useState<string | null>(null);

  const statusTone = {
    PENDING: "warning",
    ASSIGNED: "primary",
    IN_PROGRESS: "primary",
    RESOLVED: "success",
    CLOSED: "default",
  }[c.status] as "warning" | "primary" | "success" | "default";

  const priorityTone = {
    LOW: "default",
    NORMAL: "primary",
    HIGH: "warning",
    URGENT: "danger",
  }[c.priority] as "default" | "primary" | "warning" | "danger";

  return (
    <>
      <GlassSurface
        className="p-4 hover:border-primary/40 transition-all cursor-pointer group"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl neu grid place-items-center shrink-0 group-hover:bg-primary/10 transition-colors">
            <Wrench className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted">{c.id}</span>
              <Badge tone="default">{CATEGORY_LABEL[c.category]}</Badge>
              <Badge tone={priorityTone}>{c.priority}</Badge>
              <Badge tone={statusTone}>{STATUS_LABEL[c.status]}</Badge>
            </div>
            <div className="font-medium mt-1 group-hover:text-primary transition-colors">{c.title}</div>
            <p className="text-sm text-muted mt-0.5 line-clamp-2">{c.description}</p>
            {c.photos && c.photos.length > 0 && (
              <div className="flex gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                {c.photos.slice(0, 4).map((url, i) => (
                  <div
                    key={i}
                    className="relative h-14 w-14 rounded-lg overflow-hidden border border-border group/img cursor-zoom-in"
                    onClick={() => setActivePhoto(url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Attachment ${i + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="h-3 w-3 text-white" />
                    </div>
                  </div>
                ))}
                {c.photos.length > 4 && (
                  <div className="h-14 w-14 rounded-lg border border-border bg-surface-2 grid place-items-center text-xs text-muted">
                    +{c.photos.length - 4}
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-muted mt-2">
              {c.userName}{c.userRoom ? ` · ${c.userRoom}` : ""} · {timeAgo(c.createdAt)}
              {c.assignedToName && ` · Assigned: ${c.assignedToName}`}
            </div>
            {c.rating && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-muted">Rated:</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn("h-3.5 w-3.5", i < c.rating! ? "fill-warning text-warning" : "text-muted")}
                  />
                ))}
              </div>
            )}
          </div>
          {canManage && c.status !== "RESOLVED" && c.status !== "CLOSED" && (
            <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {c.status === "PENDING" && (
                <Button size="sm" variant="neu" onClick={() => onUpdateStatus("ASSIGNED")}>
                  Take it
                </Button>
              )}
              {c.status === "ASSIGNED" && (
                <Button size="sm" variant="neu" onClick={() => onUpdateStatus("IN_PROGRESS")}>
                  Start
                </Button>
              )}
              {c.status === "IN_PROGRESS" && (
                <Button size="sm" variant="skeuo" onClick={() => onUpdateStatus("RESOLVED")}>
                  Mark done
                </Button>
              )}
            </div>
          )}
        </div>
      </GlassSurface>

      {/* Details Dialog */}
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
                    <span className="font-mono text-sm text-primary font-semibold">{c.id}</span>
                    <Badge tone={statusTone}>{STATUS_LABEL[c.status]}</Badge>
                    <Badge tone={priorityTone}>{c.priority} Priority</Badge>
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
                  {/* Category */}
                  <div>
                    <span className="text-xs text-muted uppercase tracking-wider font-semibold">Category</span>
                    <div className="text-base font-semibold mt-0.5">{CATEGORY_LABEL[c.category]}</div>
                  </div>

                  {/* Title */}
                  <div>
                    <span className="text-xs text-muted uppercase tracking-wider font-semibold">Title</span>
                    <h2 className="text-lg font-bold mt-0.5 text-text">{c.title}</h2>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-xs text-muted uppercase tracking-wider font-semibold">Description</span>
                    <p className="text-sm text-text-muted mt-1 bg-surface-2/40 p-3.5 rounded-xl border border-border/20 whitespace-pre-wrap leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  {/* Student Details Card (for staff/admin) */}
                  {canManage && (
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                      <div className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5" /> Student Information
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted text-xs block">Name</span>
                          <span className="font-medium text-text">{c.userName}</span>
                        </div>
                        {c.userRoom && (
                          <div>
                            <span className="text-muted text-xs block">Room</span>
                            <span className="font-medium text-text">{c.userRoom}</span>
                          </div>
                        )}
                        {c.userEmail && (
                          <div>
                            <span className="text-muted text-xs block">Email</span>
                            <a href={`mailto:${c.userEmail}`} className="text-primary hover:underline flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {c.userEmail}
                            </a>
                          </div>
                        )}
                        {c.userPhone && (
                          <div>
                            <span className="text-muted text-xs block">Phone</span>
                            <a href={`tel:${c.userPhone}`} className="text-primary hover:underline flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {c.userPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attachments Section */}
                  {c.photos && c.photos.length > 0 && (
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wider font-semibold block mb-2">
                        Attachments ({c.photos.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {c.photos.map((url, i) => (
                          <div
                            key={i}
                            onClick={() => setActivePhoto(url)}
                            className="relative aspect-square rounded-xl overflow-hidden border border-border/40 cursor-zoom-in group/item"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Attachment ${i + 1}`}
                              className="h-full w-full object-cover transition-transform group-hover/item:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline Info */}
                  <div className="text-xs text-muted border-t border-border/30 pt-3 flex flex-wrap justify-between gap-2">
                    <div>Raised: {new Date(c.createdAt).toLocaleString()}</div>
                    {c.resolvedAt && <div>Resolved: {new Date(c.resolvedAt).toLocaleString()}</div>}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-muted">
                    {c.assignedToName ? `Assigned to: ${c.assignedToName}` : "Unassigned"}
                  </div>
                  <div className="flex gap-2">
                    {canManage && c.status !== "RESOLVED" && c.status !== "CLOSED" && (
                      <>
                        {c.status === "PENDING" && (
                          <Button variant="neu" onClick={() => onUpdateStatus("ASSIGNED")}>
                            Assign to Self
                          </Button>
                        )}
                        {c.status === "ASSIGNED" && (
                          <Button variant="neu" onClick={() => onUpdateStatus("IN_PROGRESS")}>
                            Start Progress
                          </Button>
                        )}
                        {c.status === "IN_PROGRESS" && (
                          <Button variant="skeuo" onClick={() => onUpdateStatus("RESOLVED")}>
                            Mark Resolved
                          </Button>
                        )}
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

      {/* Lightbox for attachments */}
      <AnimatePresence>
        {activePhoto && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePhoto(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl max-h-[85vh] z-10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto}
                alt="Full size attachment"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors border border-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({ role }: { role?: string }) {
  return (
    <GlassSurface className="p-12 text-center">
      <div className="text-4xl mb-2">🛠️</div>
      <div className="font-medium">
        {role === "STUDENT" ? "No complaints yet" : "All clear"}
      </div>
      <div className="text-sm text-muted mt-1">
        {role === "STUDENT" ? "Raise one if something needs fixing." : "No tickets in this view."}
      </div>
    </GlassSurface>
  );
}
