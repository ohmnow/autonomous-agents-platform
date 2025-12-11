'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'tool';
  message: string;
  timestamp: string;
  historical?: boolean;
}

interface UseBuildStreamOptions {
  buildId: string;
  enabled?: boolean;
}

interface UseBuildStreamReturn {
  logs: LogEntry[];
  isConnected: boolean;
  isLive: boolean;
  isComplete: boolean;
  error: string | null;
}

export function useBuildStream({
  buildId,
  enabled = true,
}: UseBuildStreamOptions): UseBuildStreamReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !buildId) return;

    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = () => {
      eventSource = new EventSource(`/api/builds/${buildId}/stream`);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('Connected to build stream:', buildId, data);
            setIsLive(data.isLive ?? false);
          } else if (data.type === 'log') {
            setLogs((prev) => {
              // Avoid duplicate logs
              if (prev.some((log) => log.id === data.id)) {
                return prev;
              }
              return [...prev, {
                id: data.id,
                level: data.level,
                message: data.message,
                timestamp: data.timestamp,
                historical: data.historical,
              }];
            });
          } else if (data.type === 'complete') {
            // Build is complete, no more logs coming
            setIsComplete(true);
            setIsLive(false);
            eventSource?.close();
          } else if (data.type === 'heartbeat') {
            // Connection is alive
          }
        } catch (e) {
          console.error('Error parsing SSE message:', e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);

        // Don't reconnect if build is complete
        if (isComplete) {
          eventSource?.close();
          return;
        }

        reconnectAttempts++;
        if (reconnectAttempts <= maxReconnectAttempts) {
          setError(`Connection lost. Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})...`);
          // Close and reconnect with exponential backoff
          eventSource?.close();
          setTimeout(connect, Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000));
        } else {
          setError('Connection lost. Please refresh the page.');
          eventSource?.close();
        }
      };
    };

    connect();

    return () => {
      eventSource?.close();
      setIsConnected(false);
    };
  }, [buildId, enabled, isComplete]);

  return { logs, isConnected, isLive, isComplete, error };
}
