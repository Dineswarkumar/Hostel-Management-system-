type SSEClient = {
  id: string; // userId or "anonymous"
  controller: ReadableStreamDefaultController;
};

const globalForSSE = global as unknown as { sseClients: Set<SSEClient> };

if (!globalForSSE.sseClients) {
  globalForSSE.sseClients = new Set();
}
export const sseClients = globalForSSE.sseClients;

export function addSSEClient(id: string, controller: ReadableStreamDefaultController) {
  sseClients.add({ id, controller });
}

export function removeSSEClient(controller: ReadableStreamDefaultController) {
  for (const client of sseClients) {
    if (client.controller === controller) {
      sseClients.delete(client);
      break;
    }
  }
}

interface BroadcastOptions {
  /** Only deliver to clients matching this userId. Omit for all. */
  toUserId?: string;
  /** Only deliver to clients NOT matching this userId (e.g. don't echo back to author). */
  excludeUserId?: string;
}

export function broadcastSSE(event: string, data: unknown, opts: BroadcastOptions = {}) {
  const encoder = new TextEncoder();
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(message);

  for (const client of sseClients) {
    if (opts.toUserId && client.id !== opts.toUserId) continue;
    if (opts.excludeUserId && client.id === opts.excludeUserId) continue;
    try {
      client.controller.enqueue(encoded);
    } catch {
      sseClients.delete(client);
    }
  }
}
