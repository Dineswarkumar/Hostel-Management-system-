"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell, Wrench, BusIcon, CreditCard, UtensilsCrossed, ArrowUpRight,
  TrendingUp, AlertCircle, CheckCircle2, Clock, Vote, Plus,
} from "lucide-react";
import { useAuth, ROLE_LABEL, RoleGuard } from "@/features/auth";
import { announcementsService, type Announcement } from "@/features/announcements";
import { complaintsService, type Complaint, STATUS_LABEL } from "@/features/complaints";
import { busService, type Bus } from "@/features/bus";
import { feesService, type FeeInvoice } from "@/features/fees";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, timeAgo, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <RoleGuard>
      <DashboardContent />
    </RoleGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Hey, {user.name.split(" ")[0]} <span className="inline-block animate-pulse-soft">👋</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          {ROLE_LABEL[user.role]} · {user.roomNumber ? `Room ${user.roomNumber}` : "HostelHub"}
        </p>
      </div>
      {user.role === "STUDENT" && <StudentDashboard userId={user.id} />}
      {user.role === "STAFF" && <StaffDashboard userId={user.id} />}
      {user.role === "ADMIN" && <AdminDashboard />}
      {user.role === "SUPER_ADMIN" && <SuperAdminDashboard />}
    </div>
  );
}

/* ============== STUDENT ============== */
function StudentDashboard({ userId }: { userId: string }) {
  const [fee, setFee] = React.useState<FeeInvoice | null>(null);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      feesService.getOutstanding(userId),
      announcementsService.list({ viewerRole: "STUDENT" }),
      complaintsService.list({ userId, status: undefined }),
      busService.list(),
    ]).then(([f, a, c, b]) => {
      if (cancelled) return;
      setFee(f);
      setAnnouncements(a.slice(0, 3));
      setComplaints(c.filter((x) => x.status !== "RESOLVED" && x.status !== "CLOSED").slice(0, 3));
      setBuses(b);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const openCount = complaints.length;
  const firstBus = buses[0];
  const atRiskCount = buses.filter((b) => b.status === "CANCELLED" || b.status === "DELAYED").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              icon={CreditCard}
              title="Fee due"
              value={fee ? formatINR(fee.total) : "All paid"}
              subtitle={fee ? `Due ${formatDate(fee.dueDate)}` : "You're up to date"}
              tone={fee ? "warning" : "success"}
              href="/fees"
            />
            <StatCard
              icon={Wrench}
              title="Open complaints"
              value={String(openCount)}
              subtitle={openCount > 0 ? "Tap to track" : "No active tickets"}
              tone={openCount > 0 ? "danger" : "success"}
              href="/complaints"
            />
            <StatCard
              icon={BusIcon}
              title="Buses running"
              value={`${buses.length - atRiskCount}/${buses.length}`}
              subtitle={atRiskCount > 0 ? `${atRiskCount} at risk` : "All routes green"}
              tone={atRiskCount > 0 ? "warning" : "primary"}
              href="/bus"
            />
          </>
        )}
      </div>

      {firstBus && (
        <NextBusCard bus={firstBus} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Announcements"
          icon={Bell}
          href="/announcements"
          empty={!loading && announcements.length === 0}
          emptyText="No announcements yet"
        >
          {loading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="space-y-2">
              {announcements.map((a) => (
                <li key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-2/40">
                  <div className="mt-1">
                    {a.pinned && <Badge tone="primary" className="text-[10px]">Pinned</Badge>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{a.title}</div>
                    <div className="text-xs text-muted line-clamp-1">{a.body}</div>
                  </div>
                  <div className="text-xs text-muted shrink-0">{timeAgo(a.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Your complaints"
          icon={Wrench}
          href="/complaints"
          empty={!loading && complaints.length === 0}
          emptyText="No open complaints"
        >
          {loading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="space-y-2">
              {complaints.map((c) => (
                <li key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2/40">
                  <div className="text-xs font-mono text-muted">{c.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.title}</div>
                    <div className="text-xs text-muted">{c.category}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* ============== STAFF ============== */
function StaffDashboard({ userId }: { userId: string }) {
  const [tasks, setTasks] = React.useState<Complaint[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    complaintsService.list({ assignedToId: userId }).then((t) => {
      if (cancelled) return;
      setTasks(t.filter((x) => x.status !== "RESOLVED" && x.status !== "CLOSED").slice(0, 5));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Wrench} title="My open tasks" value={String(tasks.length)} tone="primary" href="/complaints" />
        <StatCard icon={CheckCircle2} title="Resolved this week" value="—" tone="success" />
        <StatCard icon={Clock} title="Avg response time" value="2.4h" tone="primary" />
      </div>
      <SectionCard title="Assigned tasks" icon={Wrench}>
        {loading ? (
          <Skeleton className="h-32" />
        ) : tasks.length === 0 ? (
          <EmptyState text="No tasks assigned. Nice." />
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2/40">
                <div className="text-xs font-mono text-muted">{t.id}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{t.title}</div>
                  <div className="text-xs text-muted">{t.userName} · {t.userRoom}</div>
                </div>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

/* ============== ADMIN ============== */
function AdminDashboard() {
  const [stats, setStats] = React.useState<{ occupancy: string; fee: string; tickets: number; buses: string } | null>(null);
  React.useEffect(() => {
    Promise.all([announcementsService.list({ viewerRole: "ADMIN" }), complaintsService.list(), busService.list()])
      .then(([a, c, b]) => {
        const open = c.filter((x) => x.status !== "RESOLVED" && x.status !== "CLOSED").length;
        const atRisk = b.filter((x) => x.status === "CANCELLED" || x.status === "DELAYED").length;
        setStats({
          occupancy: "86%",
          fee: "72%",
          tickets: open,
          buses: `${b.length - atRisk}/${b.length}`,
        });
        void a;
      });
  }, []);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} title="Occupancy" value={stats?.occupancy ?? "—"} tone="primary" />
        <StatCard icon={CreditCard} title="Fees collected" value={stats?.fee ?? "—"} tone="success" />
        <StatCard icon={Wrench} title="Open tickets" value={stats ? String(stats.tickets) : "—"} tone="warning" href="/complaints" />
        <StatCard icon={BusIcon} title="Buses green" value={stats?.buses ?? "—"} tone="primary" href="/bus" />
      </div>
      <GlassSurface className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Quick actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/announcements?new=1" icon={Bell} label="New announcement" />
          <QuickAction href="/bus?new=1" icon={BusIcon} label="Add bus route" />
          <QuickAction href="/fees?new=1" icon={CreditCard} label="Set fees" />
          <QuickAction href="/admin/users" icon={Plus} label="Add user" />
        </div>
      </GlassSurface>
    </div>
  );
}

/* ============== SUPER ADMIN ============== */
function SuperAdminDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} title="Server health" value="OK" tone="success" />
        <StatCard icon={AlertCircle} title="Error rate" value="0.04%" tone="success" />
        <StatCard icon={Wrench} title="DB size" value="128 MB" tone="primary" />
        <StatCard icon={Bell} title="Audit events (24h)" value="—" tone="primary" />
      </div>
      <GlassSurface className="p-6">
        <h2 className="font-semibold mb-3">System</h2>
        <p className="text-sm text-muted">Phase 2 panel — feature flags, role matrix, audit log, DB tools.</p>
      </GlassSurface>
    </div>
  );
}

/* ============== Reusable widgets ============== */

function StatCard({
  icon: Icon, title, value, subtitle, tone = "primary", href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subtitle?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "accent";
  href?: string;
}) {
  const Wrapper: React.ElementType = href ? "a" : "div";
  const props = href ? { href } : {};
  return (
    <Wrapper {...props}>
      <GlassSurface className="p-5 h-full hover:scale-[1.01] transition-transform">
        <div className="flex items-start justify-between mb-3">
          <div className="h-9 w-9 rounded-xl skeuo-btn-accent grid place-items-center">
            <Icon className="h-4 w-4" />
          </div>
          {href && <ArrowUpRight className="h-4 w-4 text-muted" />}
        </div>
        <div className="text-xs text-muted">{title}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
      </GlassSurface>
    </Wrapper>
  );
}

function SectionCard({
  title, icon: Icon, href, children, empty, emptyText,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyText?: string;
}) {
  return (
    <GlassSurface className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        {href && (
          <a href={href} className="text-xs text-primary hover:underline">
            View all
          </a>
        )}
      </div>
      {empty ? <EmptyState text={emptyText ?? "Nothing here"} /> : children}
    </GlassSurface>
  );
}

function NextBusCard({ bus }: { bus: Bus }) {
  return (
    <GlassSurface className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BusIcon className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted">Next bus</span>
          </div>
          <div className="text-xl font-bold">{bus.name}</div>
          <div className="text-sm text-muted mt-0.5 line-clamp-1">{bus.description}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono">{bus.time}</div>
          <div className="text-xs text-muted mt-1">Status: {bus.status.toLowerCase()}</div>
        </div>
      </div>
    </GlassSurface>
  );
}

function QuickAction({
  href, icon: Icon, label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <a
      href={href}
      className="neu rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition-transform min-h-[100px]"
    >
      <div className="h-10 w-10 rounded-xl skeuo-btn grid place-items-center">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </a>
  );
}

function StatusBadge({ status }: { status: Complaint["status"] }) {
  const tone = {
    PENDING: "warning",
    ASSIGNED: "primary",
    IN_PROGRESS: "primary",
    RESOLVED: "success",
    CLOSED: "default",
  }[status] as "warning" | "primary" | "success" | "default";
  return <Badge tone={tone}>{STATUS_LABEL[status]}</Badge>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-8 text-sm text-muted">{text}</div>
  );
}
