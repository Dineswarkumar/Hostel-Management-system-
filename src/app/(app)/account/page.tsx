"use client";

import * as React from "react";
import { User as UserIcon, Mail, Phone, Shield, LogOut } from "lucide-react";
import { useAuth, RoleGuard, ROLE_LABEL } from "@/features/auth";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  return (
    <RoleGuard>
      <Content />
    </RoleGuard>
  );
}

function Content() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>
        <p className="text-muted text-sm">Your account details.</p>
      </div>

      <GlassSurface intensity="strong" className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-2xl neu grid place-items-center text-xl font-bold">
            {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg">{user.name}</div>
            <div className="text-sm text-muted">{user.email}</div>
            <Badge tone="primary" className="mt-2">
              <Shield className="h-3 w-3" /> {ROLE_LABEL[user.role]}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <Row icon={UserIcon} label="Name" value={user.name} />
          <Row icon={Mail} label="Email" value={user.email} />
          {user.phone && <Row icon={Phone} label="Phone" value={user.phone} />}
          {user.roomNumber && (
            <Row icon={Shield} label="Room" value={`Room ${user.roomNumber}${user.blockName ? ` · ${user.blockName}` : ""}`} />
          )}
        </div>
      </GlassSurface>

      <Button variant="ghost" onClick={() => signOut()} className="text-danger">
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/40">
      <Icon className="h-4 w-4 text-muted" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
