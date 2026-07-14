"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, ArrowRight, GraduationCap, Wrench, ShieldCheck, Code2, Check } from "lucide-react";
import { useAuth, type Role } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassSurface } from "@/components/glass/glass-surface";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const ROLES: Array<{ id: Role; label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "STUDENT", label: "Student", description: "Live in the hostel, use the app daily", icon: GraduationCap },
  { id: "STAFF", label: "Staff", description: "Maintenance, warden, housekeeping", icon: Wrench },
  { id: "ADMIN", label: "Administration", description: "Run the hostel day-to-day", icon: ShieldCheck },
];

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("STUDENT");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signUp({ name, email, password, role, phone });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const step1Valid = name.length > 1 && /\S+@\S+\.\S+/.test(email) && password.length >= 6;
  const step2Valid = !!role;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-6">
        <div className="flex justify-end mb-2">
          <ThemeToggle />
        </div>
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
          <span className="h-9 w-9 rounded-lg skeuo-btn grid place-items-center text-sm">H</span>
          HostelHub
        </Link>
        <h1 className="text-2xl font-bold mt-4">Create your account</h1>
        <p className="text-muted text-sm">Step {step} of 2</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-4 max-w-xs mx-auto">
        <div className={cn("flex-1 h-1.5 rounded-full transition-colors", step >= 1 ? "bg-primary" : "bg-border")} />
        <div className={cn("flex-1 h-1.5 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-border")} />
      </div>

      <GlassSurface intensity="strong" className="p-6">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hostelhub.in"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="pl-10"
                  required
                />
              </div>
              {password && password.length < 6 && (
                <p className="text-xs text-danger">Password must be at least 6 characters</p>
              )}
            </div>

            <Button
              type="button"
              variant="skeuo"
              size="lg"
              className="w-full"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-muted">Pick the role that best describes you.</p>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const selected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface hover:bg-surface-2/40"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl grid place-items-center transition-colors",
                        selected ? "skeuo-btn" : "bg-surface-2"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{r.label}</div>
                      <div className="text-xs text-muted">{r.description}</div>
                    </div>
                    {selected && (
                      <div className="h-6 w-6 rounded-full bg-primary grid place-items-center">
                        <Check className="h-3.5 w-3.5 text-primary-fg" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm border border-danger/30">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="neu" size="lg" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                variant="skeuo"
                size="lg"
                className="flex-1"
                loading={loading}
                disabled={!step2Valid}
                onClick={handleSubmit}
              >
                Create account
              </Button>
            </div>
          </motion.div>
        )}

        <p className="text-center text-sm text-muted mt-4">
          Already have one?{" "}
          <Link href="/signin" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </GlassSurface>
    </motion.div>
  );
}
