"use client";

import { useEffect, useRef, useCallback, useState } from 'react';

export type RealtimeEventType = 
  | 'new_error' 
  | 'error_updated' 
  | 'alert_triggered'
  | 'alert_updated'
  | 'connected'
  | 'heartbeat';

export interface RealtimeEventData {
  id?: string;
  groupId?: string;
  message?: string;
  service?: string;
  environment?: string;
  severity?: string;
  status?: string;
  occurrenceCount?: number;
  timestamp?: string;
  [key: string]: unknown;
}

export interface UseRealtimeOptions {
  /** Filter events by service */
  service?: string;
  /** Filter events by environment */
  environment?: string;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in ms */
  reconnectDelay?: number;
  /** Maximum reconnect attempts */
  maxReconnectAttempts?: number;
  /** Event handlers */
  onNewError?: (data: RealtimeEventData) => void;
  onErrorUpdated?: (data: RealtimeEventData) => void;
  onAlertTriggered?: (data: RealtimeEventData) => void;
  onAlertUpdated?: (data: RealtimeEventData) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
}

export interface UseRealtimeReturn {
  /** Whether the connection is active */
  isConnected: boolean;
  /** Connection error if any */
  error: Event | null;
  /** Last received event */
  lastEvent: { type: RealtimeEventType; data: RealtimeEventData } | null;
  /** Manually reconnect */
  reconnect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    service,
    environment,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 10,
    onNewError,
    onErrorUpdated,
    onAlertTriggered,
    onAlertUpdated,
    onConnected,
    onDisconnected,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const [lastEvent, setLastEvent] = useState<{ type: RealtimeEventType; data: RealtimeEventData } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Build URL with filters
    const params = new URLSearchParams();
    if (service) params.set('service', service);
    if (environment) params.set('environment', environment);
    
    const url = `/api/realtime${params.toString() ? `?${params.toString()}` : ''}`;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new EventSource connection
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Handle connection open
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    // Handle connection error
    eventSource.onerror = (e) => {
      setIsConnected(false);
      setError(e);
      onError?.(e);
      onDisconnected?.();

      // Auto reconnect
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay * Math.min(reconnectAttemptsRef.current, 5));
      }
    };

    // Handle connected event
    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
      onConnected?.();
    });

    // Handle heartbeat
    eventSource.addEventListener('heartbeat', () => {
      // Connection is alive
    });

    // Handle new_error event
    eventSource.addEventListener('new_error', (e) => {
      const data = JSON.parse(e.data) as RealtimeEventData;
      setLastEvent({ type: 'new_error', data });
      onNewError?.(data);
    });

    // Handle error_updated event
    eventSource.addEventListener('error_updated', (e) => {
      const data = JSON.parse(e.data) as RealtimeEventData;
      setLastEvent({ type: 'error_updated', data });
      onErrorUpdated?.(data);
    });

    // Handle alert_triggered event
    eventSource.addEventListener('alert_triggered', (e) => {
      const data = JSON.parse(e.data) as RealtimeEventData;
      setLastEvent({ type: 'alert_triggered', data });
      onAlertTriggered?.(data);
    });

    // Handle alert_updated event
    eventSource.addEventListener('alert_updated', (e) => {
      const data = JSON.parse(e.data) as RealtimeEventData;
      setLastEvent({ type: 'alert_updated', data });
      onAlertUpdated?.(data);
    });
  }, [
    service,
    environment,
    autoReconnect,
    reconnectDelay,
    maxReconnectAttempts,
    onNewError,
    onErrorUpdated,
    onAlertTriggered,
    onAlertUpdated,
    onConnected,
    onDisconnected,
    onError,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    onDisconnected?.();
  }, [onDisconnected]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    error,
    lastEvent,
    reconnect,
    disconnect,
  };
}
