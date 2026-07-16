"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  CalendarCheck2, 
  Search, 
  Download, 
  Check, 
  X, 
  Clock, 
  Save, 
  Calendar,
  Building
} from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function AdminAttendancePage() {
  return (
    <RoleGuard allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
      <AdminAttendanceContent />
    </RoleGuard>
  );
}

function AdminAttendanceContent() {
  const { user } = useAuth();
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const { toast } = useToast();

  const fetchAttendance = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${date}`);
      if (!res.ok) throw new Error("Failed to load attendance");
      const data = await res.json();
      setStudents(data);
    } catch (e: any) {
      toast({ title: "Failed to fetch attendance", description: e.message, tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [date, toast]);

  React.useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleStatusChange = (studentId: string, newStatus: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            // Toggle status (if clicked same status, revert to unmarked/null)
            attendanceStatus: s.attendanceStatus === newStatus ? null : newStatus,
          };
        }
        return s;
      })
    );
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      // Gather only marked records
      const records = students
        .filter((s) => s.attendanceStatus !== null)
        .map((s) => ({
          userId: s.id,
          status: s.attendanceStatus,
        }));

      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records }),
      });

      if (!res.ok) throw new Error("Failed to save changes");
      toast({ title: "Attendance Saved!", description: "Pruned logs older than 1 year.", tone: "success" });
      fetchAttendance();
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status: string) => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        attendanceStatus: status,
      }))
    );
    toast({ title: `Marked all students as ${status}`, tone: "success" });
  };

  const filtered = students.filter((s) => {
    const q = query.toLowerCase();
    const room = s.roomNumber ? `room ${s.roomNumber}` : "";
    const block = s.blockName ? s.blockName.toLowerCase() : "";
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      room.includes(q) ||
      block.includes(q)
    );
  });

  const presentCount = students.filter((s) => s.attendanceStatus === "PRESENT").length;
  const absentCount = students.filter((s) => s.attendanceStatus === "ABSENT").length;
  const lateCount = students.filter((s) => s.attendanceStatus === "LATE").length;
  const unmarkedCount = students.filter((s) => s.attendanceStatus === null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CalendarCheck2 className="h-7 w-7 text-primary" /> Student Attendance
          </h1>
          <p className="text-muted text-sm">Mark and manage daily attendance logs. Automatic 1-year data pruning is active.</p>
        </div>
        <Button
          variant="neu"
          size="sm"
          onClick={() => window.open("/api/admin/attendance/export")}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> Export Report (Excel)
        </Button>
      </div>

      {/* Date & Quick Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassSurface className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs text-muted font-medium flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" /> Select Date
            </span>
            <div className="mt-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-2 hover:bg-surface-3 text-text border border-border/40 rounded-xl px-3 py-2 text-sm outline-none transition-colors"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted mt-3">Changes are saved on a per-day basis</p>
        </GlassSurface>

        <GlassSurface className="p-5 md:col-span-3">
          <div className="flex items-center justify-between flex-wrap gap-4 h-full">
            <div>
              <span className="text-xs text-muted font-medium">Quick Statistics</span>
              <div className="flex gap-4 mt-3 flex-wrap">
                <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/20 text-center">
                  <div className="text-lg font-bold text-success">{presentCount}</div>
                  <div className="text-[10px] text-muted">Present</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-danger/10 border border-danger/20 text-center">
                  <div className="text-lg font-bold text-danger">{absentCount}</div>
                  <div className="text-[10px] text-muted">Absent</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-warning/10 border border-warning/20 text-center">
                  <div className="text-lg font-bold text-warning">{lateCount}</div>
                  <div className="text-[10px] text-muted">Late</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-surface-3 border border-border/20 text-center">
                  <div className="text-lg font-bold text-muted">{unmarkedCount}</div>
                  <div className="text-[10px] text-muted">Unmarked</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => markAll("PRESENT")} className="text-xs">
                All Present
              </Button>
              <Button variant="ghost" size="sm" onClick={() => markAll("ABSENT")} className="text-xs text-danger">
                All Absent
              </Button>
            </div>
          </div>
        </GlassSurface>
      </div>

      {/* Search and Action Bar */}
      <div className="flex items-center gap-3">
        <GlassSurface className="p-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students by name, room, block..."
              className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </GlassSurface>
        <Button
          variant="skeuo"
          size="lg"
          disabled={saving || loading}
          onClick={saveAttendance}
          className="flex items-center gap-2 shrink-0 px-6"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Daily Attendance"}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassSurface className="p-12 text-center text-sm text-muted">
          No students match search filter.
        </GlassSurface>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => {
            const isPresent = student.attendanceStatus === "PRESENT";
            const isAbsent = student.attendanceStatus === "ABSENT";
            const isLate = student.attendanceStatus === "LATE";

            return (
              <motion.div key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassSurface className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-text flex items-center gap-2">
                      {student.name}
                      {student.roomNumber && (
                        <Badge tone="primary" className="text-[10px] flex items-center gap-1">
                          <Building className="h-3 w-3" /> Room {student.roomNumber} {student.blockName ? `(${student.blockName})` : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted mt-0.5">{student.email}</div>
                  </div>

                  {/* Present / Absent / Late Button Segment */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-surface-2 p-1 rounded-xl border border-border/20">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "PRESENT")}
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                        isPresent 
                          ? "bg-success text-white shadow-lg" 
                          : "text-muted hover:text-text hover:bg-surface-3"
                      )}
                    >
                      <Check className="h-3.5 w-3.5" /> Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "ABSENT")}
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                        isAbsent 
                          ? "bg-danger text-white shadow-lg" 
                          : "text-muted hover:text-danger hover:bg-surface-3"
                      )}
                    >
                      <X className="h-3.5 w-3.5" /> Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "LATE")}
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                        isLate 
                          ? "bg-warning text-white shadow-lg" 
                          : "text-muted hover:text-warning hover:bg-surface-3"
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" /> Late
                    </button>
                  </div>
                </GlassSurface>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
