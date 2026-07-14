/**
 * Complaints — types & service.
 */

import { sleep } from "@/lib/utils";
import { config } from "@/lib/config";

export type ComplaintCategory =
  | "ELECTRICAL"
  | "PLUMBING"
  | "WIFI"
  | "FURNITURE"
  | "CLEANING"
  | "OTHER";

export type ComplaintStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Complaint {
  id: string; // e.g. "C-2489"
  userId: string;
  userName: string;
  userRoom?: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  photos: string[];
  priority: Priority;
  status: ComplaintStatus;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  rating?: number; // 1-5, post-resolution
  userPhone?: string;
  userEmail?: string;
}

let counter = 2489;
const STORE: Complaint[] = [
  {
    id: `C-${counter++}`,
    userId: "u_student_1",
    userName: "Aarav Sharma",
    userRoom: "204 / Block B",
    category: "WIFI",
    title: "WiFi drops in room 204",
    description: "Router in 2nd floor keeps disconnecting every 10 minutes. Affecting online classes.",
    photos: [],
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedToId: "u_staff_1",
    assignedToName: "Ravi Kumar",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: `C-${counter++}`,
    userId: "u_student_1",
    userName: "Aarav Sharma",
    userRoom: "204 / Block B",
    category: "PLUMBING",
    title: "Leaking tap in common bathroom",
    description: "Cold-water tap on the 2nd floor common bathroom drips constantly.",
    photos: [],
    priority: "NORMAL",
    status: "RESOLVED",
    assignedToId: "u_staff_1",
    assignedToName: "Ravi Kumar",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    rating: 5,
  },
  {
    id: `C-${counter++}`,
    userId: "u_student_1",
    userName: "Aarav Sharma",
    userRoom: "204 / Block B",
    category: "ELECTRICAL",
    title: "Tube light flickering",
    description: "Tube light in room 204 flickers when AC is on. Probably loose connection.",
    photos: [],
    priority: "NORMAL",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

const latency = () =>
  sleep(
    config.mockLatency.min +
      Math.random() * (config.mockLatency.max - config.mockLatency.min)
  );

export const complaintsService = {
  async list(filter?: {
    userId?: string;
    status?: ComplaintStatus;
    assignedToId?: string;
  }): Promise<Complaint[]> {
    if (config.useMockData) {
      await latency();
      return STORE.filter((c) => {
        if (filter?.userId && c.userId !== filter.userId) return false;
        if (filter?.status && c.status !== filter.status) return false;
        if (filter?.assignedToId && c.assignedToId !== filter.assignedToId) return false;
        return true;
      }).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const params = new URLSearchParams();
    if (filter?.userId) params.append("userId", filter.userId);
    if (filter?.status) params.append("status", filter.status);
    if (filter?.assignedToId) params.append("assignedToId", filter.assignedToId);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`/api/complaints${query}`);
    if (!res.ok) throw new Error("Failed to fetch complaints");
    return res.json();
  },

  async create(input: {
    userId: string;
    userName: string;
    userRoom?: string;
    category: ComplaintCategory;
    title: string;
    description: string;
    priority: Priority;
    photos?: string[];
  }): Promise<Complaint> {
    if (config.useMockData) {
      await latency();
      const c: Complaint = {
        id: `C-${counter++}`,
        userId: input.userId,
        userName: input.userName,
        userRoom: input.userRoom,
        category: input.category,
        title: input.title,
        description: input.description,
        photos: input.photos ?? [],
        priority: input.priority,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      STORE.unshift(c);
      return c;
    }

    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create complaint");
    return res.json();
  },

  async updateStatus(
    id: string,
    status: ComplaintStatus,
    assignedTo?: { id: string; name: string }
  ): Promise<Complaint | null> {
    if (config.useMockData) {
      await latency();
      const c = STORE.find((x) => x.id === id);
      if (!c) return null;
      c.status = status;
      c.updatedAt = new Date().toISOString();
      if (assignedTo) {
        c.assignedToId = assignedTo.id;
        c.assignedToName = assignedTo.name;
        if (status === "ASSIGNED" || status === "IN_PROGRESS") {
          c.status = status === "ASSIGNED" ? "ASSIGNED" : c.status;
        }
      }
      if (status === "RESOLVED" || status === "CLOSED") {
        c.resolvedAt = new Date().toISOString();
      }
      return c;
    }

    const res = await fetch(`/api/complaints/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, assignedTo }),
    });
    if (!res.ok) throw new Error("Failed to update complaint status");
    return res.json();
  },

  async rate(id: string, rating: number): Promise<Complaint | null> {
    if (config.useMockData) {
      await latency();
      const c = STORE.find((x) => x.id === id);
      if (!c) return null;
      c.rating = rating;
      return c;
    }

    const res = await fetch(`/api/complaints/${id}/rate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    if (!res.ok) throw new Error("Failed to rate complaint");
    return res.json();
  },
};

export const CATEGORY_LABEL: Record<ComplaintCategory, string> = {
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  WIFI: "WiFi",
  FURNITURE: "Furniture",
  CLEANING: "Cleaning",
  OTHER: "Other",
};

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
