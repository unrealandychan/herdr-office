import { useEffect, useRef, useState, useCallback } from 'react';
import type { ClientMessage, HerdrAgent, ServerMessage } from '../types';

export interface UseHerdrWebSocketReturn {
  agents: HerdrAgent[];
  connected: boolean;
  herdrConnected: boolean;
  error: string | null;
  focusPane: (paneId: string) => void;
  refresh: () => void;
}

export function useHerdrWebSocket(url = 'ws://localhost:4000'): UseHerdrWebSocketReturn {
  const [agents, setAgents] = useState<HerdrAgent[]>([]);
  const [connected, setConnected] = useState(false);
  const [herdrConnected, setHerdrConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const focusPane = useCallback((paneId: string) => {
    sendMessage({ type: 'focus_pane', paneId });
  }, [sendMessage]);

  const refresh = useCallback(() => {
    sendMessage({ type: 'refresh' });
  }, [sendMessage]);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;

    function connect() {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data: ServerMessage = JSON.parse(event.data);
            if (data.type === 'initial_state') {
              setAgents(data.agents);
            } else if (data.type === 'agent_updated') {
              setAgents((prev) => {
                const idx = prev.findIndex((a) => a.paneId === data.agent.paneId);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = data.agent;
                  return copy;
                }
                return [...prev, data.agent];
              });
            } else if (data.type === 'agent_removed') {
              setAgents((prev) => prev.filter((a) => a.paneId !== data.paneId));
            } else if (data.type === 'herdr_status') {
              setHerdrConnected(data.connected);
              if (data.error) setError(data.error);
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setConnected(false);
          reconnectTimer = setTimeout(connect, 2000);
        };

        ws.onerror = (e) => {
          console.warn('WebSocket connection error:', e);
          ws.close();
        };
      } catch {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [url]);

  return {
    agents,
    connected,
    herdrConnected,
    error,
    focusPane,
    refresh,
  };
}
