"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { API_BASE_URL, API_V1_PREFIX } from "@/lib/constants";
import { getAccessToken } from "@/lib/api";

export type PipelineEventType =
  | "connected"
  | "heartbeat"
  | "transcription_started"
  | "transcription_progress"
  | "transcription_completed"
  | "transcription_failed"
  | "summarization_started"
  | "summarization_completed"
  | "summarization_failed"
  | "embedding_started"
  | "embedding_completed"
  | "embedding_failed"
  | "meeting_completed"
  | "meeting_failed";

export interface PipelineEvent {
  type: PipelineEventType;
  meeting_id: string;
  message?: string;
  progress?: number;
  [key: string]: unknown;
}

interface UsePipelineEventsOptions {
  workspaceId: string;
  meetingId: string;
  onEvent?: (event: PipelineEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  enabled?: boolean;
}

interface UsePipelineEventsReturn {
  isConnected: boolean;
  lastEvent: PipelineEvent | null;
  events: PipelineEvent[];
  error: string | null;
  reconnect: () => void;
}

export function usePipelineEvents({
  workspaceId,
  meetingId,
  onEvent,
  onConnected,
  onDisconnected,
  enabled = true,
}: UsePipelineEventsOptions): UsePipelineEventsReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const callbacksRef = useRef({ onEvent, onConnected, onDisconnected });
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<PipelineEvent | null>(null);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  callbacksRef.current = { onEvent, onConnected, onDisconnected };

  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000;

  const connectRef = useRef<() => void>(() => {});

  connectRef.current = () => {
    if (!enabled || !workspaceId || !meetingId) return;

    try {
      const token = getAccessToken();
      const wsUrl = `${API_BASE_URL.replace("http", "ws")}${API_V1_PREFIX}/workspaces/${workspaceId}/meetings/${meetingId}/pipeline-events${token ? `?token=${token}` : ""}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        callbacksRef.current.onConnected?.();
      };

      ws.onmessage = (event) => {
        try {
          const data: PipelineEvent = JSON.parse(event.data);
          setLastEvent(data);
          setEvents((prev) => [...prev.slice(-99), data]);
          callbacksRef.current.onEvent?.(data);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        callbacksRef.current.onDisconnected?.();

        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connectRef.current, Math.min(delay, 30000));
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  };

  const connect = useCallback(() => {
    connectRef.current();
  }, []);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    connectRef.current();
  }, []);

  useEffect(() => {
    connectRef.current();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [workspaceId, meetingId, enabled]);

  return { isConnected, lastEvent, events, error, reconnect };
}
