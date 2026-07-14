/**
 * Central user & role types — used by every feature.
 * When backend is wired, this is the shape the API returns.
 */

export type Role = "STUDENT" | "STAFF" | "ADMIN" | "SUPER_ADMIN";

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  STAFF: "Staff",
  ADMIN: "Administration",
  SUPER_ADMIN: "Developer",
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  hostelId?: string;
  roomId?: string;
  roomNumber?: string;
  blockName?: string;
  avatarUrl?: string;
  parentPhone?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}
