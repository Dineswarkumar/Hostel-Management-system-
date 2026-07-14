import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { announcementPinSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["STAFF", "ADMIN", "SUPER_ADMIN"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, announcementPinSchema);
  if ("error" in v) return v.error;

  const updated = await prisma.announcement.update({
    where: { id: v.data.id },
    data: { pinned: v.data.pinned },
  });
  broadcastSSE("UPDATE_ANNOUNCEMENT", updated);
  return NextResponse.json(updated);
}
