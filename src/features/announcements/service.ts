/**
 * Announcements — types & service.
 * Service is swappable: mock now, real later.
 */

import { sleep } from "@/lib/utils";
import { config } from "@/lib/config";
import type { Role } from "@/features/auth/types";

export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  postedById: string;
  postedByName: string;
  targetRole?: Role;
  hostelId?: string;
  pinned: boolean;
  priority: Priority;
  expiresAt?: string;
  createdAt: string;
}

const STORE: Announcement[] = [
  {
    id: "an_1",
    title: "Water tank cleaning — Sunday 10 AM",
    body: "Water supply will be disrupted Sunday 10 AM – 2 PM across all blocks. Please store water in advance.",
    postedById: "u_admin_1",
    postedByName: "Priya Iyer",
    targetRole: undefined,
    pinned: true,
    priority: "HIGH",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "an_2",
    title: "Cricket trials — Friday 5 PM",
    body: "Inter-hostel cricket trials at the main ground. Bring your kit. All years welcome.",
    postedById: "u_staff_1",
    postedByName: "Ravi Kumar",
    targetRole: "STUDENT",
    pinned: false,
    priority: "NORMAL",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "an_3",
    title: "Fee due date extended to the 15th",
    body: "All students can pay the monthly fee by the 15th without late penalty. Use the Fees tab.",
    postedById: "u_admin_1",
    postedByName: "Priya Iyer",
    targetRole: "STUDENT",
    pinned: true,
    priority: "NORMAL",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "an_4",
    title: "Staff meeting — Monday 9 AM",
    body: "All maintenance and admin staff are requested to attend the Monday morning review.",
    postedById: "u_admin_1",
    postedByName: "Priya Iyer",
    targetRole: "STAFF",
    pinned: false,
    priority: "NORMAL",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const latency = () =>
  sleep(
    config.mockLatency.min +
      Math.random() * (config.mockLatency.max - config.mockLatency.min)
  );

export const announcementsService = {
  async list(filter?: {
    targetRole?: Role | "ALL";
    viewerRole: Role;
  }): Promise<Announcement[]> {
    if (config.useMockData) {
      await latency();
      return STORE.filter((a) => {
        if (a.targetRole && filter?.targetRole !== "ALL" && a.targetRole !== filter?.viewerRole)
          return false;
        if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
        return true;
      }).sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    const roleParam = filter?.viewerRole ? `?viewerRole=${filter.viewerRole}` : "";
    const res = await fetch(`/api/announcements${roleParam}`);
    if (!res.ok) throw new Error("Failed to fetch announcements");
    return res.json();
  },

  async create(input: {
    title: string;
    body: string;
    postedById: string;
    postedByName: string;
    targetRole?: Role;
    priority: Priority;
    pinned?: boolean;
    expiresAt?: string;
  }): Promise<Announcement> {
    if (config.useMockData) {
      await latency();
      const a: Announcement = {
        id: `an_${Date.now()}`,
        title: input.title,
        body: input.body,
        postedById: input.postedById,
        postedByName: input.postedByName,
        targetRole: input.targetRole,
        pinned: !!input.pinned,
        priority: input.priority,
        expiresAt: input.expiresAt,
        createdAt: new Date().toISOString(),
      };
      STORE.unshift(a);
      return a;
    }

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create announcement");
    return res.json();
  },

  async togglePin(id: string): Promise<Announcement | null> {
    if (config.useMockData) {
      await latency();
      const a = STORE.find((x) => x.id === id);
      if (!a) return null;
      a.pinned = !a.pinned;
      return a;
    }

    const res = await fetch("/api/announcements/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Failed to toggle pin status");
    return res.json();
  },

  async remove(id: string): Promise<boolean> {
    if (config.useMockData) {
      await latency();
      const i = STORE.findIndex((x) => x.id === id);
      if (i < 0) return false;
      STORE.splice(i, 1);
      return true;
    }

    const res = await fetch(`/api/announcements?id=${id}`, {
      method: "DELETE",
    });
    return res.ok;
  },
};
