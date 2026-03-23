import { realtimeEmitter, RealtimeEvent } from '@/lib/api/services/realtime.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events endpoint for real-time updates
 * Clients connect via EventSource and receive events as they occur
 */
export async function GET(request: Request): Promise<Response> {
  const encoder = new TextEncoder();

  // Get optional service filter from query params
  const url = new URL(request.url);
  const serviceFilter = url.searchParams.get('service');
  const environmentFilter = url.searchParams.get('environment');

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectEvent = `event: connected\ndata: ${JSON.stringify({ 
        message: 'Connected to realtime updates',
        timestamp: new Date().toISOString(),
        filters: { service: serviceFilter, environment: environmentFilter }
      })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({ 
            timestamp: new Date().toISOString(),
            clients: realtimeEmitter.getClientCount()
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch {
          // Connection closed, cleanup will happen below
        }
      }, 30000);

      // Register client to receive events
      const handleEvent = (event: RealtimeEvent) => {
        // Apply filters if specified
        if (serviceFilter && event.data.service !== serviceFilter) {
          return;
        }
        if (environmentFilter && event.data.environment !== environmentFilter) {
          return;
        }

        try {
          const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify({
            ...event.data,
            timestamp: event.timestamp.toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
        } catch {
          // Connection closed
        }
      };

      // Add client and get cleanup function
      const removeClient = realtimeEmitter.addClient(handleEvent);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        removeClient();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
