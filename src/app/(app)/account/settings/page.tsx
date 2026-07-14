"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RoleGuard } from "@/features/auth";
import { GlassSurface } from "@/components/glass/glass-surface";
import { ThemeSwitcher } from "@/components/shared/theme-toggle";

export default function AccountSettingsPage() {
  return (
    <RoleGuard>
      <div className="max-w-2xl space-y-6">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted text-sm">Notifications, theme, account actions.</p>
        </div>
        <GlassSurface intensity="strong" className="p-6 space-y-4">
          <Row
            title="Email notifications"
            body="Receipts, leave approvals, fee reminders."
            defaultOn
          />
          <Row
            title="Push notifications"
            body="Announcements, complaint updates, bus alerts."
            defaultOn
          />
          <Row
            title="Mess rating reminders"
            body="A daily nudge to rate the meals."
          />
        </GlassSurface>
        <GlassSurface className="p-6">
          <h2 className="font-semibold">Theme</h2>
          <p className="text-sm text-muted mt-1 mb-4">
            Choose how HostelHub looks. System follows your device.
          </p>
          <ThemeSwitcher />
        </GlassSurface>
      </div>
    </RoleGuard>
  );
}

function Row({
  title, body, defaultOn,
}: {
  title: string;
  body: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = React.useState(!!defaultOn);
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-2/40">
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted">{body}</div>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={
          "relative h-6 w-11 rounded-full transition-colors " +
          (on ? "bg-primary" : "bg-surface-2")
        }
        aria-pressed={on}
        aria-label={title}
      >
        <span
          className={
            "absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform " +
            (on ? "translate-x-5" : "translate-x-0.5")
          }
        />
      </button>
    </div>
  );
}
