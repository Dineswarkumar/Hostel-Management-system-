import { sleep } from "@/lib/utils";
import { config } from "@/lib/config";
import type { Role, User, AuthSession } from "./types";

/**
 * Mock user store. Swappable — when backend lands, replace
 * this with a real service that calls /api/auth/*.
 */
const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: "u_student_1",
    name: "Aarav Sharma",
    email: "student@hostelhub.in",
    phone: "+91 98765 43210",
    role: "STUDENT",
    hostelId: "h_main",
    roomId: "r_204",
    roomNumber: "204",
    blockName: "Block B",
    parentPhone: "+91 99887 76655",
    createdAt: "2026-01-15T10:00:00Z",
    password: "demo1234",
  },
  {
    id: "u_staff_1",
    name: "Ravi Kumar",
    email: "staff@hostelhub.in",
    phone: "+91 98765 12345",
    role: "STAFF",
    hostelId: "h_main",
    createdAt: "2025-08-10T10:00:00Z",
    password: "demo1234",
  },
  {
    id: "u_admin_1",
    name: "Priya Iyer",
    email: "admin@hostelhub.in",
    phone: "+91 91234 56789",
    role: "ADMIN",
    hostelId: "h_main",
    createdAt: "2024-06-01T10:00:00Z",
    password: "demo1234",
  },
  {
    id: "u_super_1",
    name: "Dinesh K",
    email: "dev@hostelhub.in",
    role: "SUPER_ADMIN",
    createdAt: "2024-01-01T10:00:00Z",
    password: "demo1234",
  },
];

const STORAGE_KEY = "hostelhub.session";

function persistSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Notify listeners in the same tab
  window.dispatchEvent(new CustomEvent("hostelhub:auth"));
}

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

const latency = () =>
  sleep(
    config.mockLatency.min +
      Math.random() * (config.mockLatency.max - config.mockLatency.min)
  );

export const authService = {
  async signIn(email: string, password: string): Promise<AuthSession> {
    if (config.useMockData) {
      await latency();
      const found = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!found) {
        throw new Error("Invalid email or password");
      }
      const { password: _pw, ...user } = found;
      const session: AuthSession = { user, token: `mock_${user.id}_${Date.now()}` };
      persistSession(session);
      return session;
    }

    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to sign in");
    }

    const session: AuthSession = await res.json();
    persistSession(session);
    return session;
  },

  async signUp(input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    phone?: string;
  }): Promise<AuthSession> {
    if (config.useMockData) {
      await latency();
      if (MOCK_USERS.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        throw new Error("An account with this email already exists");
      }
      const user: User = {
        id: `u_${Date.now()}`,
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        createdAt: new Date().toISOString(),
      };
      MOCK_USERS.push({ ...user, password: input.password });
      const session: AuthSession = { user, token: `mock_${user.id}_${Date.now()}` };
      persistSession(session);
      return session;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to sign up");
    }

    const session: AuthSession = await res.json();
    persistSession(session);
    return session;
  },

  async signOut(): Promise<void> {
    if (config.useMockData) {
      await sleep(100);
      persistSession(null);
      return;
    }

    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (e) {
      console.error("Signout error:", e);
    }
    persistSession(null);
  },

  /** Synchronous read from localStorage — used in initial load. */
  readSession,

  /** Demo accounts for the signin screen. */
  demoAccounts() {
    return MOCK_USERS.map(({ password: _p, ...u }) => u);
  },
};
