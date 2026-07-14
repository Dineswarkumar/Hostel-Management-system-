type SSEClient = {
  id: string;
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

export function broadcastSSE(event: string, data: any) {
  const encoder = new TextEncoder();
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(message);

  for (const client of sseClients) {
    try {
      client.controller.enqueue(encoded);
    } catch (e) {
      // Stream might be closed
      sseClients.delete(client);
    }
  }
}
