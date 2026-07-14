"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth, authService, ROLE_LABEL, type Role } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function SignInPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [shake, setShake] = React.useState(false);

  // If already signed in, send to dashboard
  React.useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo1234");
  };

  const demos = authService.demoAccounts();
  const demosByRole: Record<Role, typeof demos> = {
    STUDENT: [],
    STAFF: [],
    ADMIN: [],
    SUPER_ADMIN: [],
  };
  demos.forEach((d) => demosByRole[d.role].push(d));

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
        <h1 className="text-2xl font-bold mt-4">Welcome back</h1>
        <p className="text-muted text-sm">Sign in to your account</p>
      </div>

      <GlassSurface intensity="strong" className={"p-6 " + (shake ? "animate-shake" : "")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 text-danger text-sm border border-danger/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                id="email"
                type="email"
                placeholder="you@hostelhub.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                autoComplete="email"
                invalid={!!error}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-xs text-primary hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                autoComplete="current-password"
                invalid={!!error}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="skeuo" size="lg" loading={loading} className="w-full">
            Sign in <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-center text-sm text-muted">
            New here?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </GlassSurface>

      {/* Demo accounts */}
      <div className="mt-6">
        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          Demo accounts
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {demos.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => fillDemo(d.email)}
              className="glass-subtle rounded-xl p-3 text-left hover:bg-surface-2/60 transition-colors"
            >
              <Badge tone="primary" className="mb-1">{ROLE_LABEL[d.role]}</Badge>
              <div className="text-xs font-medium truncate">{d.name}</div>
              <div className="text-xs text-muted truncate">{d.email}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted text-center mt-3">
          Click a card to autofill · password: <code className="text-text">demo1234</code>
        </p>
      </div>
    </motion.div>
  );
}
