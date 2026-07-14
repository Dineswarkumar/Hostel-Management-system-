import { z } from "zod";

/**
 * Centralized Zod schemas. Use on every API route body.
 */

export const signInSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
});

export const signUpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
  phone: z.string().max(30).optional(),
  role: z.enum(["STUDENT", "STAFF", "ADMIN", "SUPER_ADMIN"]),
});

export const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  postedById: z.string().min(1),
  postedByName: z.string().min(1).max(100),
  targetRole: z.enum(["STUDENT", "STAFF", "ADMIN", "SUPER_ADMIN"]).nullable().optional(),
  pinned: z.boolean().optional().default(false),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

export const announcementPinSchema = z.object({
  id: z.string().min(1),
  pinned: z.boolean(),
});

export const complaintSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1).max(100),
  userRoom: z.string().max(100).optional(),
  category: z.enum(["ELECTRICAL", "PLUMBING", "WIFI", "FURNITURE", "CLEANING", "OTHER"]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  photos: z.array(z.string()).max(4).default([]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

export const complaintStatusSchema = z.object({
  status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  assignedToId: z.string().optional(),
  assignedToName: z.string().max(100).optional(),
});

export const complaintRateSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const busSchema = z.object({
  name: z.string().min(1).max(100),
  time: z.string().regex(/^\d{1,2}:\d{2}$/, "Time must be HH:MM"),
  description: z.string().min(1).max(1000),
});

export const busStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "RUNNING", "LEFT", "CANCELLED", "DELAYED"]),
});

export const busVoteSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["UP", "DOWN"]),
});

export const feeInvoiceSchema = z.object({
  userId: z.string().min(1),
  roomType: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
  components: z.array(z.object({ name: z.string(), amount: z.number() })),
  total: z.number().int().min(0),
  dueDate: z.string(),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "FAILED"]),
});

export const paymentOrderSchema = z.object({
  invoiceId: z.string().min(1),
});

export const paymentVerifySchema = z.object({
  invoiceId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const leaveSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1).max(100),
  userRoom: z.string().max(100).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1).max(1000),
});

export const leaveStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]),
  approverId: z.string().optional(),
  approverName: z.string().max(100).optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).optional(),
  parentPhone: z.string().max(30).optional(),
});

export const userCreateSchema = signUpSchema.extend({
  roomNumber: z.string().max(20).optional(),
  blockName: z.string().max(50).optional(),
  parentPhone: z.string().max(30).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["STUDENT", "STAFF", "ADMIN", "SUPER_ADMIN"]).optional(),
  roomNumber: z.string().max(20).optional(),
  blockName: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  active: z.boolean().optional(),
});
