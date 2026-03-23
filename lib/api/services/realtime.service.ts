import { EventEmitter } from 'events';

// Event types for real-time updates
export type RealtimeEventType = 
  | 'new_error' 
  | 'error_updated' 
  | 'alert_triggered'
  | 'alert_updated';

export interface RealtimeEvent {
  type: RealtimeEventType;
  timestamp: Date;
  data: {
    id?: string;
    groupId?: string;
    message?: string;
    service?: string;
    environment?: string;
    severity?: string;
    status?: string;
    occurrenceCount?: number;
    [key: string]: unknown;
  };
}

// Global event emitter for real-time updates
// This is a singleton that persists across requests in development
// In production with serverless, use a pub/sub service like Redis or Pusher
class RealtimeEventEmitter extends EventEmitter {
  private static instance: RealtimeEventEmitter;
  private clients: Set<(event: RealtimeEvent) => void>;

  private constructor() {
    super();
    this.clients = new Set();
    this.setMaxListeners(1000); // Allow many concurrent connections
  }

  static getInstance(): RealtimeEventEmitter {
    if (!RealtimeEventEmitter.instance) {
      RealtimeEventEmitter.instance = new RealtimeEventEmitter();
    }
    return RealtimeEventEmitter.instance;
  }

  /**
   * Register a client to receive events
   */
  addClient(callback: (event: RealtimeEvent) => void): () => void {
    this.clients.add(callback);
    return () => {
      this.clients.delete(callback);
    };
  }

  /**
   * Broadcast an event to all connected clients
   */
  broadcast(event: RealtimeEvent): void {
    this.clients.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[Realtime] Error broadcasting to client:', error);
      }
    });
    
    // Also emit as a standard event for internal listeners
    this.emit(event.type, event);
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

// Export singleton instance
export const realtimeEmitter = RealtimeEventEmitter.getInstance();

/**
 * Helper to emit new error event
 */
export function emitNewError(data: {
  id: string;
  groupId: string;
  message: string;
  service: string;
  environment: string;
  level: string;
  occurrenceCount: number;
}): void {
  realtimeEmitter.broadcast({
    type: 'new_error',
    timestamp: new Date(),
    data,
  });
}

/**
 * Helper to emit error updated event
 */
export function emitErrorUpdated(data: {
  id: string;
  groupId: string;
  status?: string;
  occurrenceCount?: number;
  service: string;
}): void {
  realtimeEmitter.broadcast({
    type: 'error_updated',
    timestamp: new Date(),
    data,
  });
}

/**
 * Helper to emit alert triggered event
 */
export function emitAlertTriggered(data: {
  id: string;
  title: string;
  message: string;
  severity: string;
  service: string;
  type: string;
}): void {
  realtimeEmitter.broadcast({
    type: 'alert_triggered',
    timestamp: new Date(),
    data,
  });
}

/**
 * Helper to emit alert updated event
 */
export function emitAlertUpdated(data: {
  id: string;
  status: string;
  service: string;
}): void {
  realtimeEmitter.broadcast({
    type: 'alert_updated',
    timestamp: new Date(),
    data,
  });
}
