import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";
import { requireAuth } from "@/lib/auth";
import { validateBody } from "@/lib/api";
import { busVoteSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request, ["STUDENT"]);
  if ("error" in auth) return auth.error;

  const v = await validateBody(request, busVoteSchema);
  if ("error" in v) return v.error;

  if (v.data.userId !== auth.user.id) {
    return NextResponse.json({ error: "userId does not match session" }, { status: 403 });
  }

  const busId = params.id;
  const userId = auth.user.id;
  const type = v.data.type;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.busVote.findUnique({
      where: { busId_userId: { busId, userId } },
    });

    let newUserVote: "UP" | "DOWN" | null = null;

    if (existing) {
      if (existing.type === type) {
        await tx.busVote.delete({ where: { id: existing.id } });
        newUserVote = null;
      } else {
        await tx.busVote.update({ where: { id: existing.id }, data: { type } });
        newUserVote = type;
      }
    } else {
      await tx.busVote.create({ data: { busId, userId, type } });
      newUserVote = type;
    }

    const [upvotes, downvotes] = await Promise.all([
      tx.busVote.count({ where: { busId, type: "UP" } }),
      tx.busVote.count({ where: { busId, type: "DOWN" } }),
    ]);

    const updatedBus = await tx.bus.update({
      where: { id: busId },
      data: { upvotes, downvotes, updatedAt: new Date() },
    });

    return { bus: updatedBus, userVote: newUserVote };
  });

  broadcastSSE("UPDATE_BUS", result.bus);
  broadcastSSE("USER_VOTE_UPDATE", { busId, userId, userVote: result.userVote });
  return NextResponse.json(result);
}
