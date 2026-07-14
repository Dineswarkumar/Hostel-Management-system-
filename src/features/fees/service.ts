/**
 * Fees — types & service.
 */

import { sleep } from "@/lib/utils";
import { config } from "@/lib/config";
import { getRoomType, type RoomTypeId } from "@/features/rooms/catalog";

export type FeeStatus = "PENDING" | "PAID" | "OVERDUE" | "FAILED";

export interface FeeInvoice {
  id: string;
  userId: string;
  roomType: RoomTypeId;
  month: string; // "2026-07"
  components: Array<{ name: string; amount: number }>;
  total: number;
  dueDate: string;
  status: FeeStatus;
  paidAt?: string;
  transactionId?: string;
}

function buildInvoice(
  id: string,
  userId: string,
  roomType: RoomTypeId,
  month: string,
  status: FeeStatus,
  dueDate: string,
  paidAt?: string
): FeeInvoice {
  const rt = getRoomType(roomType);
  const base = rt.basePricePerMonth;
  const mess = 1500;
  const maintenance = 500;
  return {
    id,
    userId,
    roomType,
    month,
    components: [
      { name: `Room (${rt.shortName})`, amount: base },
      { name: "Mess charges", amount: mess },
      { name: "Maintenance", amount: maintenance },
    ],
    total: base + mess + maintenance,
    dueDate,
    status,
    paidAt,
    transactionId: paidAt ? `txn_${id}_${Date.now()}` : undefined,
  };
}

const INVOICES: FeeInvoice[] = [
  buildInvoice("inv_2026_07", "u_student_1", "TWO_SEATER", "2026-07", "PENDING", "2026-07-15"),
  buildInvoice("inv_2026_06", "u_student_1", "TWO_SEATER", "2026-06", "PAID", "2026-06-10", "2026-06-05T10:00:00Z"),
  buildInvoice("inv_2026_05", "u_student_1", "TWO_SEATER", "2026-05", "PAID", "2026-05-10", "2026-05-08T10:00:00Z"),
  buildInvoice("inv_2026_04", "u_student_1", "TWO_SEATER", "2026-04", "PAID", "2026-04-10", "2026-04-09T10:00:00Z"),
];

const latency = () =>
  sleep(
    config.mockLatency.min +
      Math.random() * (config.mockLatency.max - config.mockLatency.min)
  );

export const feesService = {
  async listForUser(userId: string): Promise<FeeInvoice[]> {
    if (config.useMockData) {
      await latency();
      return INVOICES.filter((i) => i.userId === userId).sort((a, b) =>
        b.month.localeCompare(a.month)
      );
    }

    const res = await fetch(`/api/fees?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch invoices");
    return res.json();
  },

  async pay(invoiceId: string): Promise<FeeInvoice | null> {
    if (config.useMockData) {
      await latency();
      const inv = INVOICES.find((i) => i.id === invoiceId);
      if (!inv) return null;
      if (inv.status === "PAID") return inv;
      inv.status = "PAID";
      inv.paidAt = new Date().toISOString();
      inv.transactionId = `txn_${inv.id}_${Date.now()}`;
      return inv;
    }

    const res = await fetch(`/api/fees/${invoiceId}/pay`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to process payment");
    return res.json();
  },

  async getOutstanding(userId: string): Promise<FeeInvoice | null> {
    const list = await this.listForUser(userId);
    return list.find((i) => i.status === "PENDING") ?? null;
  },
};
