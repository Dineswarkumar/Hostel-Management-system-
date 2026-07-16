"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Settings, 
  Download, 
  Search, 
  ToggleLeft, 
  ToggleRight, 
  Calendar, 
  UserCheck, 
  Smartphone,
  Layers
} from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function AdminRegistrationPage() {
  return (
    <RoleGuard allow={["ADMIN", "SUPER_ADMIN"]}>
      <AdminRegistrationContent />
    </RoleGuard>
  );
}

function AdminRegistrationContent() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [startedAt, setStartedAt] = React.useState<string | null>(null);
  const [registrations, setRegistrations] = React.useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = React.useState(true);
  const [loadingRegs, setLoadingRegs] = React.useState(true);
  const [toggling, setToggling] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const { toast } = useToast();

  // Load Window Status
  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/registration/status");
      if (!res.ok) throw new Error("Failed to load status");
      const data = await res.json();
      setIsOpen(data.isOpen);
      setStartedAt(data.startedAt);
    } catch (e: any) {
      toast({ title: "Failed to fetch status", description: e.message, tone: "danger" });
    } finally {
      setLoadingStatus(false);
    }
  }, [toast]);

  // Load Applications
  const fetchRegistrations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/registration");
      if (!res.ok) throw new Error("Failed to load registrations");
      const data = await res.json();
      setRegistrations(data);
    } catch (e: any) {
      toast({ title: "Failed to fetch registrations", description: e.message, tone: "danger" });
    } finally {
      setLoadingRegs(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchStatus();
    fetchRegistrations();
  }, [fetchStatus, fetchRegistrations]);

  const toggleWindow = async () => {
    setToggling(true);
    try {
      const targetState = !isOpen;
      const res = await fetch("/api/admin/registration/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: targetState }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();
      setIsOpen(data.isOpen);
      setStartedAt(data.startedAt);
      toast({ 
        title: targetState ? "Registration Window Opened!" : "Registration Window Closed", 
        tone: targetState ? "success" : "warning" 
      });
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, tone: "danger" });
    } finally {
      setToggling(false);
    }
  };

  const filtered = registrations.filter((reg) => {
    const q = query.toLowerCase();
    return (
      reg.name.toLowerCase().includes(q) ||
      reg.phone.toLowerCase().includes(q) ||
      reg.roomType.toLowerCase().includes(q)
    );
  });

  const roomTypeLabels: Record<string, string> = {
    SINGLE_SEATER: "Single Seater",
    TWO_SEATER: "2-Seater Shared",
    THREE_SEATER: "3-Seater Shared",
    FOUR_SEATER: "4-Seater Shared",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" /> Hostel Registration
        </h1>
        <p className="text-muted text-sm">Issue registration windows and review incoming room applications.</p>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassSurface className="p-5 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: "10s" }} /> Control Window
              </span>
              <h2 className="text-lg font-bold mt-2 text-text">
                Status: {loadingStatus ? "Checking..." : isOpen ? "OPEN & ACTIVE" : "CLOSED"}
              </h2>
              <p className="text-xs text-muted mt-1 max-w-md">
                {isOpen 
                  ? `Students are currently permitted to submit new room registration choices. Opened on ${formatDate(startedAt || "")}.` 
                  : "Registration is locked. Students will see a 'closed' notice on their home dashboard."}
              </p>
            </div>
            <Button
              variant={isOpen ? "primary" : "skeuo"}
              size="lg"
              disabled={toggling || loadingStatus}
              onClick={toggleWindow}
              className={"flex items-center gap-2 shrink-0 " + (isOpen ? "bg-danger text-white hover:opacity-90" : "")}
            >
              {isOpen ? (
                <>
                  <ToggleRight className="h-5 w-5" /> Close Registration
                </>
              ) : (
                <>
                  <ToggleLeft className="h-5 w-5" /> Start Registration
                </>
              )}
            </Button>
          </div>
        </GlassSurface>

        <GlassSurface className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs text-muted font-medium flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-success" /> Total Applications
            </span>
            <div className="font-bold text-2xl mt-2 text-text">
              {loadingRegs ? "..." : registrations.length}
            </div>
            <p className="text-[10px] text-muted mt-2">Active student submissions recorded</p>
          </div>
          <Button
            variant="neu"
            size="sm"
            onClick={() => window.open("/api/admin/registration/export")}
            disabled={registrations.length === 0}
            className="w-full mt-4 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" /> Export to Excel
          </Button>
        </GlassSurface>
      </div>

      <GlassSurface className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name, phone number, or room selection..."
            className="pl-10"
          />
        </div>
      </GlassSurface>

      {loadingRegs ? (
        <div className="space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassSurface className="p-12 text-center text-sm text-muted">
          No room registration entries found.
        </GlassSurface>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/30 glass-strong">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-surface-2/40 text-muted-foreground font-medium">
                <th className="p-4">Student Info</th>
                <th className="p-4">Chosen Room Type</th>
                <th className="p-4">Date of Application</th>
                <th className="p-4">Time (Precision)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filtered.map((reg) => {
                const dateObj = new Date(reg.createdAt);
                const localDate = dateObj.toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" });
                const localTime = dateObj.toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
                return (
                  <tr key={reg.id} className="hover:bg-surface-2/10 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-text">{reg.name}</div>
                        <div className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                          <Smartphone className="h-3 w-3 shrink-0" /> {reg.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge tone="primary" className="flex items-center gap-1.5 w-fit">
                        <Layers className="h-3 w-3" /> {roomTypeLabels[reg.roomType] || reg.roomType}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs font-mono text-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted" /> {localDate}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono text-primary font-medium">
                      {localTime}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
