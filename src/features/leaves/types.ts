export interface Leave {
  id: string;
  userId: string;
  userName: string;
  userRoom?: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approverId?: string;
  approverName?: string;
  createdAt: string;
  updatedAt: string;
  userPhone?: string;
  userEmail?: string;
}
