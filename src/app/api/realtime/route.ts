import { NextRequest } from "next/server";
import { addSSEClient, removeSSEClient } from "@/lib/sse";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUserFromRequest(req);
  const userId = user?.id ?? "anonymous";

  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      addSSEClient(userId, controller);
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`: connected ${userId}\n\n`));
    },
    cancel() {
      if (controllerRef) removeSSEClient(controllerRef);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
