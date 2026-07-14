"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users, Search, UserPlus, ShieldCheck, Wrench, GraduationCap, Code2 } from "lucide-react";
import { useAuth, RoleGuard, ROLE_LABEL, type Role } from "@/features/auth";
import { authService } from "@/features/auth/service";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  STUDENT: GraduationCap,
  STAFF: Wrench,
  ADMIN: ShieldCheck,
  SUPER_ADMIN: Code2,
};

export default function AdminUsersPage() {
  return (
    <RoleGuard allow={["ADMIN", "SUPER_ADMIN"]}>
      <UsersContent />
    </RoleGuard>
  );
}

function UsersContent() {
  const [query, setQuery] = React.useState("");
  const [users, setUsers] = React.useState<ReturnType<typeof authService.demoAccounts>>([]);

  React.useEffect(() => {
    setUsers(authService.demoAccounts());
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Users</h1>
          <p className="text-muted text-sm">Manage students, staff, and administrators.</p>
        </div>
        <button
          disabled
          className="skeuo-btn h-10 px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2 opacity-70 cursor-not-allowed"
          title="Available in Phase 2"
        >
          <UserPlus className="h-4 w-4" /> Add user
        </button>
      </div>

      <GlassSurface className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-10"
          />
        </div>
      </GlassSurface>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <GlassSurface className="p-8 text-center text-sm text-muted">
            No users match your search.
          </GlassSurface>
        ) : (
          filtered.map((u) => {
            const Icon = ROLE_ICON[u.role];
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <GlassSurface className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full neu grid place-items-center text-sm font-semibold shrink-0">
                      {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{u.name}</div>
                      <div className="text-xs text-muted truncate">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.roomNumber && (
                        <Badge tone="default" className="hidden sm:inline-flex">
                          Room {u.roomNumber}
                        </Badge>
                      )}
                      <Badge tone="primary">
                        <Icon className="h-3 w-3" /> {ROLE_LABEL[u.role]}
                      </Badge>
                    </div>
                  </div>
                </GlassSurface>
              </motion.div>
            );
          })
        )}
      </div>

      <GlassSurface className="p-4 text-xs text-muted">
        <p>
          ℹ User CRUD, role assignment, deactivation, and bulk import ship in Phase 2
          alongside the real backend. The current list shows the four demo accounts
          for sign-in.
        </p>
      </GlassSurface>
    </div>
  );
}
