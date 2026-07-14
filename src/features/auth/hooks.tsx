"use client";

import * as React from "react";
import { authService } from "./service";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    role: User["role"];
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Hydrate from storage and listen for changes
  React.useEffect(() => {
    const sync = () => {
      const session = authService.readSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    sync();
    window.addEventListener("hostelhub:auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hostelhub:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        const s = await authService.signIn(email, password);
        setUser(s.user);
      },
      async signUp(input) {
        const s = await authService.signUp(input);
        setUser(s.user);
      },
      async signOut() {
        await authService.signOut();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
