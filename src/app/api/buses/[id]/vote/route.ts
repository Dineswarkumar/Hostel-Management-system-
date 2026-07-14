import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSSE } from "@/lib/sse";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const busId = params.id;
    const { userId, type } = await request.json(); // type is "UP" | "DOWN"

    if (!busId || !userId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Wrap the voting operation in a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Find existing vote
      const existingVote = await tx.busVote.findUnique({
        where: {
          busId_userId: {
            busId,
            userId,
          },
        },
      });

      let newUserVote: "UP" | "DOWN" | null = null;

      if (existingVote) {
        if (existingVote.type === type) {
          // Double click same type: remove the vote
          await tx.busVote.delete({
            where: {
              id: existingVote.id,
            },
          });
          newUserVote = null;
        } else {
          // Click opposite type: update the vote
          await tx.busVote.update({
            where: {
              id: existingVote.id,
            },
            data: {
              type,
            },
          });
          newUserVote = type;
        }
      } else {
        // Create new vote
        await tx.busVote.create({
          data: {
            busId,
            userId,
            type,
          },
        });
        newUserVote = type;
      }

      // Recalculate upvotes / downvotes for the bus
      const upvotesCount = await tx.busVote.count({
        where: { busId, type: "UP" },
      });

      const downvotesCount = await tx.busVote.count({
        where: { busId, type: "DOWN" },
      });

      // Update the bus
      const updatedBus = await tx.bus.update({
        where: { id: busId },
        data: {
          upvotes: upvotesCount,
          downvotes: downvotesCount,
          updatedAt: new Date(),
        },
      });

      return { bus: updatedBus, userVote: newUserVote };
    });

    // Broadcast bus update (with new vote counts) in real-time
    broadcastSSE("UPDATE_BUS", result.bus);
    // Broadcast user specific vote to help trigger specific updates
    broadcastSSE("USER_VOTE_UPDATE", { busId, userId, userVote: result.userVote });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Vote bus error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
