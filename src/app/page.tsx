"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Vote,
  CreditCard,
  Wrench,
  Bus,
  Bell,
  Users,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ROOM_TYPES } from "@/features/rooms/catalog";
import { formatINR } from "@/lib/utils";
import { config } from "@/lib/config";

const FEATURES = [
  {
    icon: Bell,
    title: "Smart announcements",
    body: "Pinned, role-targeted notices with push and email. No more lost WhatsApp messages.",
  },
  {
    icon: Wrench,
    title: "Complaints that get fixed",
    body: "Raise in 30 seconds. Staff assigned, status tracked live, rate after resolution.",
  },
  {
    icon: Vote,
    title: "Bus voting & requests",
    body: "Students vote on routes, request new ones, see live counts. Real data drives the schedule.",
  },
  {
    icon: CreditCard,
    title: "Fee payments, zero friction",
    body: "UPI, cards, netbanking via Razorpay. Auto-receipts, ledger, reminders.",
  },
  {
    icon: UtensilsIcon,
    title: "Mess menu + ratings",
    body: "Daily menu, dish catalog, emoji ratings. The mess actually listens.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Four shells, one codebase. Students, staff, administration, developer.",
  },
];

const ROLES = [
  {
    role: "Student",
    desc: "Pay fees, raise complaints, vote buses, see announcements, rate the mess.",
    accent: "from-primary to-accent",
  },
  {
    role: "Staff",
    desc: "View assigned tickets, mark work done, log visitors, file inspection reports.",
    accent: "from-success to-primary",
  },
  {
    role: "Administration",
    desc: "Manage users, post announcements, add bus routes, approve leaves, view reports.",
    accent: "from-accent to-warning",
  },
  {
    role: "Developer",
    desc: "Super-admin panel: feature flags, role matrix, audit log, system health.",
    accent: "from-warning to-danger",
  },
];

function UtensilsIcon(props: { className?: string }) {
  // Tiny inline re-export to avoid an extra import
  return (
    <svg
      className={props.className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-30">
        <div className="glass-strong border-b">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-2 font-bold text-lg">
              <span className="h-8 w-8 rounded-lg skeuo-btn grid place-items-center text-sm">D</span>
              <span>{config.appName}</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-muted hover:text-text">Features</a>
              <a href="#rooms" className="text-muted hover:text-text">Rooms</a>
              <a href="#roles" className="text-muted hover:text-text">Roles</a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/signin"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/signup"><Button variant="skeuo" size="sm">Get started</Button></Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container pt-16 pb-24 md:pt-24 md:pb-32 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <Badge tone="primary" className="mb-6">
            <Sparkles className="h-3 w-3" /> v0.1 — Frontend preview
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Hostel management,
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Quick Tech
            </span>
          </h1>
          <p className="text-muted text-lg md:text-xl mt-6 leading-relaxed">
            Fees, complaints, bus schedules, mess menu, announcements — all in one
            fast, glassy, mobile-first app. Built for students, staff, and administration.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/signup">
              <Button size="lg" variant="skeuo" className="min-w-[200px]">
                Try the demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="lg" variant="neu">
                I have an account
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted mt-4">
            Demo accounts on the sign-in page — no credit card needed.
          </p>
        </motion.div>

      </section>

      {/* Features */}
      <section id="features" className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Everything a hostel needs</h2>
          <p className="text-muted mt-2">One app, four roles, zero spreadsheets.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <GlassSurface intensity="default" className="p-6 h-full hover:border-primary/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                  <div className="h-10 w-10 rounded-xl skeuo-btn grid place-items-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{f.body}</p>
                </GlassSurface>
              </motion.div>
            );
          })}
        </div>
      </section>
      {/* Room types */}
      <section id="rooms" className="container py-16">
        <div className="text-center mb-12">
          <Badge tone="accent" className="mb-3">5 room types</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Pick what fits</h2>
          <p className="text-muted mt-2">From budget 4-seaters to private deluxe suites.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROOM_TYPES.map((rt) => (
            <GlassSurface key={rt.id} intensity="default" className="p-6 flex flex-col hover:border-primary/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{rt.emoji}</div>
                {rt.badge && (
                  <Badge tone={rt.badge === "premium" ? "accent" : rt.badge === "value" ? "success" : "primary"}>
                    {rt.badge}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg">{rt.name}</h3>
              <p className="text-sm text-muted mt-1 flex-1">{rt.description}</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold">{formatINR(rt.basePricePerMonth)}</div>
                  <div className="text-xs text-muted">per month · {rt.capacity} {rt.capacity === 1 ? "person" : "people"}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </div>
            </GlassSurface>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Four roles, one platform</h2>
          <p className="text-muted mt-2">Each user type gets a tailored dashboard and permissions.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map((r) => (
            <GlassSurface key={r.role} intensity="default" className="p-6 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:-translate-y-1.5 transition-all duration-300">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${r.accent} grid place-items-center mb-3`}>
                <Users className="h-5 w-5 text-white drop-shadow" />
              </div>
              <h3 className="font-semibold text-lg">{r.role}</h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">{r.desc}</p>
            </GlassSurface>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <GlassSurface intensity="strong" className="p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to try it?</h2>
          <p className="text-muted mt-2 mb-6">Jump into the demo — four roles, full UI, no signup friction.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup"><Button size="lg" variant="skeuo">Create account <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/signin"><Button size="lg" variant="neu">Sign in</Button></Link>
          </div>
        </GlassSurface>
      </section>

      <footer className="container py-12 text-center border-t border-border/50 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-semibold text-text">
            HostelHub Portal
          </div>
          <p className="text-xs text-muted max-w-sm">
            Built with ❤️ by <a href="https://github.com/Dineswarkumar" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Dineswara Kumar</a>, a B-Tech student at <span className="font-medium text-text">IIIT Nagpur</span>.
          </p>
        </div>
        <div className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} HostelHub · All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function PreviewCard({
  title,
  value,
  badge,
  tone,
}: {
  title: string;
  value: string;
  badge: string;
  tone: "primary" | "accent" | "success" | "warning" | "danger";
}) {
  return (
    <div className="glass-subtle rounded-2xl p-4">
      <div className="text-xs text-muted">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <Badge tone={tone} className="mt-2">{badge}</Badge>
    </div>
  );
}

function PreviewRoute({ time, route }: { time: string; route: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/40">
      <div className="text-xs font-mono text-primary font-semibold w-12">{time}</div>
      <div className="text-sm flex-1">{route}</div>
    </div>
  );
}
