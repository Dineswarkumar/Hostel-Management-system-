"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Home, 
  Bus, 
  Wrench, 
  CreditCard, 
  CalendarCheck, 
  Users, 
  ShieldCheck, 
  Building2 
} from "lucide-react";
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
  { href: "/leaves", label: "Outpass", icon: CalendarCheck },
];

const STAFF_TABS: TabItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/complaints", label: "Tasks", icon: Wrench },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/leaves", label: "Outpass", icon: CalendarCheck },
];

const ADMIN_TABS: TabItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/complaints", label: "Complaints", icon: Wrench },
  { href: "/fees", label: "Fees", icon: CreditCard },
  { href: "/bus", label: "Bus", icon: Bus },
  { href: "/leaves", label: "Outpass", icon: CalendarCheck },
];

const DEV_TABS: TabItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/system", label: "System", icon: ShieldCheck },
  { href: "/admin/registration", label: "Registration", icon: Building2 },
];

const TABS: Record<string, TabItem[]> = {
  STUDENT: STUDENT_TABS,
  STAFF: STAFF_TABS,
  ADMIN: ADMIN_TABS,
  SUPER_ADMIN: DEV_TABS,
};

export function BottomTabs() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;
  const tabs = TABS[user.role] ?? STUDENT_TABS;

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-lg md:max-w-xl px-2 py-1.5 liquid-glass rounded-full md:hidden flex items-center justify-around transition-all duration-300">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname?.startsWith(t.href + "/");
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] md:text-[11px] font-semibold transition-all relative overflow-hidden active:scale-95 " +
              (active ? "text-primary" : "text-muted hover:text-text hover:bg-surface-2/45")
            }
          >
            {active && (
              <motion.div 
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
              <Icon className={"h-5 w-5 " + (active ? "scale-105 text-primary" : "")} />
            </motion.div>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
