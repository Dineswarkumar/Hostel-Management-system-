"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bus, Wrench, CreditCard, UtensilsCrossed, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/features/auth";

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STUDENT_TABS: TabItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/bus", label: "Bus", icon: Bus },
  { href: "/complaints", label: "Complaints", icon: Wrench },
  { href: "/fees", label: "Fees", icon: CreditCard },
  { href: "/mess", label: "Mess", icon: UtensilsCrossed },
];

const STAFF_TABS: TabItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/complaints", label: "Tasks", icon: Wrench },
  { href: "/announcements", label: "Notices", icon: MoreHorizontal },
];

const ADMIN_TABS: TabItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/announcements", label: "Notices", icon: MoreHorizontal },
  { href: "/complaints", label: "Tickets", icon: Wrench },
  { href: "/bus", label: "Bus", icon: Bus },
  { href: "/fees", label: "Fees", icon: CreditCard },
];

const TABS: Record<string, TabItem[]> = {
  STUDENT: STUDENT_TABS,
  STAFF: STAFF_TABS,
  ADMIN: ADMIN_TABS,
  SUPER_ADMIN: ADMIN_TABS,
};

export function BottomTabs() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;
  const tabs = TABS[user.role] ?? STUDENT_TABS;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="glass-strong border-t">
        <div className="flex items-stretch justify-around h-16">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname?.startsWith(t.href + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors " +
                  (active ? "text-primary" : "text-muted")
                }
              >
                <Icon className={"h-5 w-5 " + (active ? "scale-110" : "")} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
