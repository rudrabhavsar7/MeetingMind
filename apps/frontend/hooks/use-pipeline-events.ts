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
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<PipelineEvent | null>(null);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000;

  useEffect(() => {
    if (!enabled || !workspaceId || !meetingId) return;

    let cancelled = false;

    function connect() {
      if (cancelled) return;

      try {
        const token = getAccessToken();
        const wsUrl = `${API_BASE_URL.replace("http", "ws")}${API_V1_PREFIX}/workspaces/${workspaceId}/meetings/${meetingId}/pipeline-events${token ? `?token=${token}` : ""}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
          onConnected?.();
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const data: PipelineEvent = JSON.parse(event.data);
            setLastEvent(data);
            setEvents((prev) => [...prev.slice(-99), data]);
            onEvent?.(data);
          } catch {
            // Ignore malformed messages
          }
        };

        ws.onclose = () => {
          if (cancelled) return;
          setIsConnected(false);
          onDisconnected?.();

          if (!cancelled && reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current += 1;
            reconnectTimeoutRef.current = setTimeout(connect, Math.min(delay, 30000));
          }
        };

        ws.onerror = () => {
          if (cancelled) return;
          setError("WebSocket connection error");
        };
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to connect");
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [workspaceId, meetingId, enabled, onEvent, onConnected, onDisconnected]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
  }, []);

  return { isConnected, lastEvent, events, error, reconnect };
}
