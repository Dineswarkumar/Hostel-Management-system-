"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User as UserIcon, LogOut, Settings, CalendarCheck } from "lucide-react";
import { useAuth, ROLE_LABEL } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS: Record<string, Array<{ href: string; label: string }>> = {
  STUDENT: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/announcements", label: "Announcements" },
    { href: "/complaints", label: "Complaints" },
    { href: "/leaves", label: "Leaves" },
    { href: "/bus", label: "Bus" },
    { href: "/mess", label: "Mess" },
    { href: "/fees", label: "Fees" },
  ],
  STAFF: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/announcements", label: "Announcements" },
    { href: "/complaints", label: "Tasks" },
    { href: "/leaves", label: "Leaves" },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/announcements", label: "Announcements" },
    { href: "/complaints", label: "Complaints" },
    { href: "/leaves", label: "Leaves" },
    { href: "/bus", label: "Bus" },
    { href: "/mess", label: "Mess" },
    { href: "/fees", label: "Fees" },
    { href: "/admin/users", label: "Users" },
  ],
  SUPER_ADMIN: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/announcements", label: "Announcements" },
    { href: "/admin/users", label: "Users" },
    { href: "/fees", label: "Fees" },
    { href: "/admin/system", label: "System" },
  ],
};

export function TopNav() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  if (!user) return null;
  const items = NAV_ITEMS[user.role] ?? [];

  return (
    <header className="sticky top-0 z-40">
      <div className="glass-strong border-b">
        <div className="container flex items-center gap-4 h-16">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <span className="h-8 w-8 rounded-lg skeuo-btn grid place-items-center text-sm">H</span>
            <span className="hidden sm:inline">HostelHub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 flex-1 ml-2">
            {items.map((it) => {
              const active = pathname === it.href || pathname?.startsWith(it.href + "/");
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                    (active
                      ? "bg-primary/15 text-primary"
                      : "text-muted hover:text-text hover:bg-surface-2/50")
                  }
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Badge tone="primary" className="hidden sm:inline-flex">
              {ROLE_LABEL[user.role]}
            </Badge>
            <ThemeToggle />
            <Link href="/announcements" title="Announcements">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="neu-sm h-10 w-10 rounded-full grid place-items-center text-sm font-semibold"
                aria-label="Account menu"
              >
                {user.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-40 w-56 glass-strong rounded-2xl p-2 animate-scale-in">
                    <div className="p-3 border-b border-border/50 mb-1">
                      <div className="font-medium text-sm truncate">{user.name}</div>
                      <div className="text-xs text-muted truncate">{user.email}</div>
                    </div>
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface-2/60"
                      onClick={() => setMenuOpen(false)}
                    >
                      <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                    <Link
                      href="/leaves"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface-2/60"
                      onClick={() => setMenuOpen(false)}
                    >
                      <CalendarCheck className="h-4 w-4" /> Outpass & Leaves
                    </Link>
                    <Link
                      href="/account/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface-2/60"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await signOut();
                        window.location.href = "/";
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-danger/15 text-danger"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
