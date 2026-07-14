import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { userUpdateSchema } from "@/lib/validation";
import { z } from "zod";

const userUpdateWithPassword = userUpdateSchema.extend({
  password: z.string().min(6).max(200).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request, ["ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, userUpdateWithPassword);
  if ("error" in v) return v.error;

  const data: Record<string, unknown> = {};
  if (v.data.name !== undefined) data.name = v.data.name;
  if (v.data.role !== undefined) data.role = v.data.role;
  if (v.data.roomNumber !== undefined) data.roomNumber = v.data.roomNumber || null;
  if (v.data.blockName !== undefined) data.blockName = v.data.blockName || null;
  if (v.data.phone !== undefined) data.phone = v.data.phone || null;
  if (v.data.active !== undefined) data.active = v.data.active;
  if (v.data.password) data.password = await bcrypt.hash(v.data.password, 10);

  const updated = await prisma.user.update({ where: { id: params.id }, data });
  const { password: _p, ...safe } = updated;
  return NextResponse.json(safe);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request, ["ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  if (params.id === auth.user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  // Soft delete would be better, but for now hard delete cascades are in place
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
