import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { busSchema, busStatusSchema } from "@/lib/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

const busUpdateSchema = busSchema.partial().extend({ id: z.string().min(1), status: busStatusSchema.shape.status.optional() });

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const buses = await prisma.bus.findMany({ orderBy: { createdAt: "desc" } });

  // Enrich with the current user's vote (one round-trip)
  const votes = await prisma.busVote.findMany({ where: { userId: auth.user.id } });
  const votesMap = new Map(votes.map((v) => [v.busId, v.type]));

  const enriched = buses.map((b) => ({
    ...b,
    userVote: votesMap.get(b.id) ?? null,
  }));
  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, busSchema);
  if ("error" in v) return v.error;

  const bus = await prisma.bus.create({
    data: {
      name: v.data.name.trim(),
      time: v.data.time.trim(),
      description: v.data.description.trim(),
      status: "SCHEDULED",
      createdById: auth.user.id,
      createdByName: auth.user.name,
    },
  });
  broadcastSSE("NEW_BUS", bus);
  return NextResponse.json(bus);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, busUpdateSchema);
  if ("error" in v) return v.error;

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (v.data.name !== undefined) data.name = v.data.name.trim();
  if (v.data.time !== undefined) data.time = v.data.time.trim();
  if (v.data.description !== undefined) data.description = v.data.description.trim();
  if (v.data.status !== undefined) data.status = v.data.status;

  const updated = await prisma.bus.update({ where: { id: v.data.id }, data });
  broadcastSSE("UPDATE_BUS", updated);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  await prisma.bus.delete({ where: { id } });
  broadcastSSE("DELETE_BUS", { id });
  return NextResponse.json({ success: true });
}
