import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "STAFF" | "ADMIN" | "SUPER_ADMIN";
}

const COOKIE_NAME = "hostelhub_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Create a session for a user and set the cookie.
 * Token format: `session_<userId>_<timestamp>` — opaque to clients, parsable server-side.
 */
export function createSession(user: SessionUser): string {
  const token = `session_${user.id}_${Date.now()}`;
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return token;
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

/**
 * Read the current user from the session cookie.
 * Returns null if no cookie or user no longer exists.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return userFromToken(token);
}

/**
 * For route handlers that receive a Request (e.g. /api/*) we can't use next/headers
 * cookies() reliably in all runtimes. This version reads from the cookie header.
 */
export async function getCurrentUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return userFromToken(token);
}

async function userFromToken(token: string): Promise<SessionUser | null> {
  // Token format: session_<userId>_<timestamp>
  const match = /^session_([A-Za-z0-9_-]+)_\d+$/.exec(token);
  if (!match) return null;
  const userId = match[1];
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser["role"],
  };
}

export const SESSION_COOKIE = COOKIE_NAME;

/**
 * Helper to enforce auth + optional role on API routes.
 * Returns either a user (proceed) or a NextResponse (send this back).
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: Array<SessionUser["role"]>
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const user = await getCurrentUserFromRequest(req);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user };
}
