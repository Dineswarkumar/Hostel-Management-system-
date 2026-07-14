import type { Leave } from "./types";

export const leavesService = {
  async list(userId: string): Promise<Leave[]> {
    const res = await fetch(`/api/leaves?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch leaves");
    return res.json();
  },

  async apply(input: {
    userId: string;
    userName: string;
    userRoom?: string;
    fromDate: string;
    toDate: string;
    reason: string;
  }): Promise<Leave> {
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to submit leave application");
    return res.json();
  },

  async updateStatus(
    id: string,
    status: "APPROVED" | "REJECTED" | "CANCELLED",
    approver?: { id: string; name: string }
  ): Promise<Leave> {
    const res = await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        approverId: approver?.id,
        approverName: approver?.name,
      }),
    });
    if (!res.ok) throw new Error("Failed to update leave status");
    return res.json();
  },
};
