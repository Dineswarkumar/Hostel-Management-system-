/**
 * Bus — simplified model.
 * Each bus entry is: name, time, description, status.
 * Admin creates + updates status. Students vote yes/no.
 * Everyone can view.
 */

import { sleep } from "@/lib/utils";
import { config } from "@/lib/config";

export type BusStatus = "SCHEDULED" | "RUNNING" | "LEFT" | "CANCELLED" | "DELAYED";

export interface Bus {
  id: string;
  name: string;
  time: string; // "07:30" — 24h, displayed via formatTime
  description: string;
  status: BusStatus;
  upvotes: number;
  downvotes: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

/** Per-user vote record. Tracked in module memory (mock). */
const userVotes = new Map<string, Map<string, "UP" | "DOWN">>();
function voteKey(userId: string, busId: string) {
  return `${userId}::${busId}`;
}

const STORE: Bus[] = [
  {
    id: "bus_1",
    name: "City Center",
    time: "07:30",
    description: "Pickup and drop between hostel gate and City Center bus stand.",
    status: "RUNNING",
    upvotes: 248,
    downvotes: 12,
    createdById: "u_admin_1",
    createdByName: "Priya Iyer",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "bus_2",
    name: "Railway Station",
    time: "06:45",
    description: "Pickup and drop between hostel gate and Railway Station main entrance.",
    status: "LEFT",
    upvotes: 195,
    downvotes: 28,
    createdById: "u_admin_1",
    createdByName: "Priya Iyer",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "bus_3",
    name: "Airport Express",
    time: "14:00",
    description: "Weekend airport shuttle. Friday and Sunday only.",
    status: "SCHEDULED",
    upvotes: 87,
    downvotes: 5,
    createdById: "u_admin_1",
    createdByName: "Priya Iyer",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "bus_4",
    name: "Engineering College",
    time: "08:00",
    description: "Pickup and drop for project work / weekend group studies.",
    status: "CANCELLED",
    upvotes: 32,
    downvotes: 64,
    createdById: "u_admin_1",
    createdByName: "Priya Iyer",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const latency = () =>
  sleep(
    config.mockLatency.min +
      Math.random() * (config.mockLatency.max - config.mockLatency.min)
  );

const clientVotesCache = new Map<string, "UP" | "DOWN">();

export const busService = {
  async list(userId?: string): Promise<Bus[]> {
    if (config.useMockData) {
      await latency();
      return [...STORE].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const query = userId ? `?userId=${userId}` : "";
    const res = await fetch(`/api/buses${query}`);
    if (!res.ok) throw new Error("Failed to fetch buses");
    const data = await res.json();

    // Cache the user's vote status returned from the server
    data.forEach((b: any) => {
      if (b.userVote) {
        clientVotesCache.set(b.id, b.userVote);
      } else {
        clientVotesCache.delete(b.id);
      }
    });

    return data;
  },

  async get(id: string): Promise<Bus | null> {
    if (config.useMockData) {
      await latency();
      return STORE.find((b) => b.id === id) ?? null;
    }

    const res = await fetch(`/api/buses`);
    if (!res.ok) return null;
    const list: Bus[] = await res.json();
    return list.find((b) => b.id === id) ?? null;
  },

  async create(input: {
    name: string;
    time: string;
    description: string;
    createdById: string;
    createdByName: string;
  }): Promise<Bus> {
    if (config.useMockData) {
      await latency();
      const b: Bus = {
        id: `bus_${Date.now()}`,
        name: input.name.trim(),
        time: input.time.trim(),
        description: input.description.trim(),
        status: "SCHEDULED",
        upvotes: 0,
        downvotes: 0,
        createdById: input.createdById,
        createdByName: input.createdByName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      STORE.unshift(b);
      return b;
    }

    const res = await fetch("/api/buses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create bus");
    return res.json();
  },

  async updateStatus(id: string, status: BusStatus): Promise<Bus | null> {
    if (config.useMockData) {
      await latency();
      const b = STORE.find((x) => x.id === id);
      if (!b) return null;
      b.status = status;
      b.updatedAt = new Date().toISOString();
      return b;
    }

    const res = await fetch("/api/buses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) throw new Error("Failed to update bus status");
    return res.json();
  },

  async update(
    id: string,
    data: { name: string; time: string; description: string }
  ): Promise<Bus | null> {
    if (config.useMockData) {
      await latency();
      const b = STORE.find((x) => x.id === id);
      if (!b) return null;
      b.name = data.name.trim();
      b.time = data.time.trim();
      b.description = data.description.trim();
      b.updatedAt = new Date().toISOString();
      return b;
    }

    const res = await fetch("/api/buses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error("Failed to update bus");
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

    const res = await fetch(`/api/buses?id=${id}`, {
      method: "DELETE",
    });
    return res.ok;
  },

  async vote(
    id: string,
    userId: string,
    type: "UP" | "DOWN"
  ): Promise<{ bus: Bus | null; userVote: "UP" | "DOWN" | null }> {
    if (config.useMockData) {
      await sleep(80);
      const b = STORE.find((x) => x.id === id);
      if (!b) return { bus: null, userVote: null };
      const k = voteKey(userId, id);
      let userMap = userVotes.get(userId);
      if (!userMap) {
        userMap = new Map();
        userVotes.set(userId, userMap);
      }
      const previous = userMap.get(id) ?? null;

      // Decrement previous count if any
      if (previous === "UP") b.upvotes = Math.max(0, b.upvotes - 1);
      if (previous === "DOWN") b.downvotes = Math.max(0, b.downvotes - 1);

      // Apply new vote
      if (previous === type) {
        userMap.delete(id);
      } else {
        userMap.set(id, type);
        if (type === "UP") b.upvotes += 1;
        else b.downvotes += 1;
      }

      b.updatedAt = new Date().toISOString();
      return { bus: b, userVote: userMap.get(id) ?? null };
    }

    const res = await fetch(`/api/buses/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type }),
    });
    if (!res.ok) throw new Error("Failed to submit vote");
    const data = await res.json();

    if (data.userVote) {
      clientVotesCache.set(id, data.userVote);
    } else {
      clientVotesCache.delete(id);
    }

    return data;
  },

  getUserVote(userId: string, busId: string): "UP" | "DOWN" | null {
    if (config.useMockData) {
      return userVotes.get(userId)?.get(busId) ?? null;
    }
    return clientVotesCache.get(busId) ?? null;
  },
};

export const BUS_STATUS_LABEL: Record<BusStatus, string> = {
  SCHEDULED: "Scheduled",
  RUNNING: "Running",
  LEFT: "Left",
  CANCELLED: "Cancelled",
  DELAYED: "Delayed",
};

export const BUS_STATUS_TONE: Record<BusStatus, "primary" | "success" | "default" | "danger" | "warning"> = {
  SCHEDULED: "primary",
  RUNNING: "success",
  LEFT: "default",
  CANCELLED: "danger",
  DELAYED: "warning",
};

export const BUS_STATUS_ORDER: BusStatus[] = ["SCHEDULED", "RUNNING", "DELAYED", "LEFT", "CANCELLED"];
