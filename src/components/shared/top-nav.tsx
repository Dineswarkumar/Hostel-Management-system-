"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  CalendarCheck, 
  UtensilsCrossed, 
  Users, 
  Building2, 
  ShieldCheck, 
  Bus, 
  Wrench, 
  CreditCard 
} from "lucide-react";
import { useAuth, ROLE_LABEL } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";

const CENTER_TABS: Record<string, Array<{ href: string; label: string }>> = {
  STUDENT: [
    { href: "/dashboard", label: "Home" },
    { href: "/bus", label: "Bus" },
    { href: "/complaints", label: "Complaints" },
    { href: "/fees", label: "Fees" },
    { href: "/leaves", label: "Outpass" },
  ],
  STAFF: [
    { href: "/dashboard", label: "Home" },
    { href: "/complaints", label: "Tasks" },
    { href: "/admin/attendance", label: "Attendance" },
    { href: "/leaves", label: "Outpass" },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Home" },
    { href: "/complaints", label: "Complaints" },
    { href: "/admin/attendance", label: "Attendance" },
    { href: "/fees", label: "Fees" },
    { href: "/bus", label: "Bus" },
    { href: "/leaves", label: "Outpass" },
  ],
  SUPER_ADMIN: [
    { href: "/dashboard", label: "Home" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/system", label: "System" },
    { href: "/admin/registration", label: "Registration" },
  ],
};

export function TopNav() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  if (!user) return null;

  const centerTabs = CENTER_TABS[user.role] ?? CENTER_TABS.STUDENT;

  // Handle dropdown open on hover for PC, with delay to prevent flickering
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setMenuOpen(false);
    }, 150);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Define dropdown menu items based on role
  const renderRoleDropdownItems = () => {
    const handleItemClick = () => setMenuOpen(false);

    switch (user.role) {
      case "STUDENT":
        return (
          <>
            <Link
              href="/account"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <UserIcon className="h-4 w-4 text-primary" /> Profile
            </Link>
            <Link
              href="/account/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <Settings className="h-4 w-4 text-primary" /> Settings
            </Link>
            <Link
              href="/mess"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <UtensilsCrossed className="h-4 w-4 text-primary" /> Mess
            </Link>
          </>
        );

      case "STAFF":
        return (
          <>
            <Link
              href="/account"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <UserIcon className="h-4 w-4 text-primary" /> Profile
            </Link>
            <Link
              href="/account/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <Settings className="h-4 w-4 text-primary" /> Settings
            </Link>
          </>
        );

      case "ADMIN":
        // Admin primary taskbar: Home, Complains, Fees, Bus, Outpass.
        // Remaining admin actions in profile dropdown: Profile, Settings, Users, Registration, System
        return (
          <>
            <Link
              href="/account"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <UserIcon className="h-4 w-4 text-primary" /> Profile
            </Link>
            <Link
              href="/account/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <Settings className="h-4 w-4 text-primary" /> Settings
            </Link>
            <div className="border-t border-border/20 my-1.5" />
            <Link
              href="/admin/users"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <Users className="h-4 w-4 text-accent" /> Users Directory
            </Link>
            <Link
              href="/admin/registration"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <Building2 className="h-4 w-4 text-accent" /> Registration
            </Link>
          </>
        );

      case "SUPER_ADMIN":
        // Developer primary taskbar: Home, Users, System, Registration.
        // Remaining developer actions in profile dropdown: Profile, Settings, Mess, Bus, Complaints, Outpass, Fees
        return (
          <>
            <Link
              href="/account"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <UserIcon className="h-4 w-4 text-primary" /> Profile
            </Link>
            <Link
              href="/account/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <Settings className="h-4 w-4 text-primary" /> Settings
            </Link>
            <div className="border-t border-border/20 my-1.5" />
            <Link
              href="/mess"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <UtensilsCrossed className="h-4 w-4 text-accent" /> Mess Details
            </Link>
            <Link
              href="/bus"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <Bus className="h-4 w-4 text-accent" /> Bus Services
            </Link>
            <Link
              href="/complaints"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <Wrench className="h-4 w-4 text-accent" /> Complaints
            </Link>
            <Link
              href="/leaves"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <CalendarCheck className="h-4 w-4 text-accent" /> Outpass & Leaves
            </Link>
            <Link
              href="/fees"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:backdrop-blur-sm transition-all duration-200"
              onClick={handleItemClick}
            >
              <CreditCard className="h-4 w-4 text-accent" /> Fees Ledger
            </Link>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 p-4 pb-0 w-full max-w-7xl mx-auto">
      <div className="liquid-glass rounded-full transition-all duration-300">
        <div className="px-6 md:px-8 flex items-center justify-between h-16">
          
          {/* Logo & Home Link */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <motion.div 
              whileHover={{ scale: 1.08 }} 
              whileTap={{ scale: 0.95 }}
              className="h-8 w-8 rounded-lg skeuo-btn grid place-items-center text-sm"
            >
              H
            </motion.div>
            <span className="hidden sm:inline bg-gradient-to-r from-text via-text/90 to-text/70 bg-clip-text text-transparent">
              HostelHub
            </span>
          </Link>

          {/* Desktop Navigation Links (PC center only) */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-2/40 p-1 rounded-full border border-border/15">
            {centerTabs.map((it) => {
              const active = pathname === it.href || pathname?.startsWith(it.href + "/");
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all relative overflow-hidden active:scale-95 " +
                    (active ? "text-primary bg-primary/10" : "text-muted hover:text-text hover:bg-surface-2/30")
                  }
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Navigation Panel */}
          <div className="flex items-center gap-3">
            <Badge tone="primary" className="text-xs py-0.5 px-2.5">
              {ROLE_LABEL[user.role]}
            </Badge>

            <div className="flex items-center gap-1 bg-surface-2/40 p-1 rounded-xl border border-border/15">
              {/* Dark Mode Icon */}
              <ThemeToggle />

              {/* Notification / Announcement Bell */}
              <Link href="/announcements" title="Announcements">
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-surface-2/70 text-muted hover:text-text" aria-label="Notifications">
                    <Bell className="h-4.5 w-4.5" />
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Profile Avatar Hover Menu */}
            <div 
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <motion.button
                onClick={toggleMenu}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold text-sm grid place-items-center border border-white/20 shadow-md focus:outline-none"
                aria-label="Account menu"
              >
                {user.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    {/* Invisible backdrop for tablet/mobile click dismissal */}
                    <div 
                      className="fixed inset-0 z-30 md:hidden"
                      onClick={() => setMenuOpen(false)}
                    />
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-40 w-60 liquid-glass rounded-2xl p-2 shadow-xl animate-scale-in"
                    >
                      <div className="p-3 border-b border-border/20 mb-1.5">
                        <div className="font-semibold text-sm truncate text-text">{user.name}</div>
                        <div className="text-[11px] text-muted truncate mt-0.5">{user.email}</div>
                      </div>

                      <div className="space-y-0.5">
                        {renderRoleDropdownItems()}
                      </div>

                      <div className="border-t border-border/20 my-1.5" />
                      
                      <button
                        onClick={async () => {
                          setMenuOpen(false);
                          await signOut();
                          window.location.href = "/";
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-danger/10 hover:backdrop-blur-sm text-danger font-medium transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
