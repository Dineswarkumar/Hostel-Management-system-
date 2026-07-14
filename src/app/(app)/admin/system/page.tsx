"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Server, Database, Bell, Activity, AlertTriangle } from "lucide-react";
import { RoleGuard } from "@/features/auth";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";

export default function SystemPage() {
  return (
    <RoleGuard allow={["SUPER_ADMIN"]}>
      <Content />
    </RoleGuard>
  );
}

function Content() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">System</h1>
        <p className="text-muted text-sm">Super-admin panel: health, audit, feature flags.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Health icon={Server} label="API" value="OK" tone="success" />
        <Health icon={Database} label="Database" value="OK" tone="success" />
        <Health icon={Activity} label="Realtime" value="OK" tone="success" />
        <Health icon={Bell} label="Queue" value="0 pending" tone="success" />
      </div>

      <GlassSurface className="p-6">
        <h2 className="font-semibold mb-3">Phase 2 will add</h2>
        <ul className="space-y-2 text-sm text-muted">
          <li>• Feature flags per hostel</li>
          <li>• Role &amp; permission matrix editor</li>
          <li>• Full audit log (who / what / when / IP / diff)</li>
          <li>• Schema browser &amp; read-only DB console</li>
          <li>• Backup &amp; restore triggers</li>
        </ul>
      </GlassSurface>

      <GlassSurface className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="font-semibold">Heads up</h2>
        </div>
        <p className="text-sm text-muted">
          This panel is read-only in v0.1. The frontend is fully functional with mock
          data — Phase 2 wires the real Supabase + Razorpay backend. No destructive
          actions are exposed yet.
        </p>
      </GlassSurface>
    </div>
  );
}

function Health({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "success" | "warning" | "danger";
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <GlassSurface className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted" />
          <span className="text-xs text-muted">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="font-bold">{value}</span>
        </div>
      </GlassSurface>
    </motion.div>
  );
}
