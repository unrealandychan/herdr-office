import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  AgentMessageEvent,
  AgentMessagePayload,
  ClientMessage,
  HerdrAgent,
  ServerMessage,
  WorkspaceSyncReport,
  WorkspaceSyncRequest,
} from '../types';

export interface UseHerdrWebSocketReturn {
  agents: HerdrAgent[];
  connected: boolean;
  herdrConnected: boolean;
  error: string | null;
  focusPane: (paneId: string) => void;
  refresh: () => void;
  promptAgent: (paneId: string, prompt: string) => void;
  interruptAgent: (paneId: string) => void;
  spawnAgent: (data: { name?: string; kind?: string; initialPrompt?: string; cwd?: string }) => void;
  fetchAgentOutput: (paneId: string) => void;
  sendAgentMessage: (payload: AgentMessagePayload) => void;
  syncWorkspace: (request?: WorkspaceSyncRequest) => void;
  syncReport: WorkspaceSyncReport | null;
  recentMessages: AgentMessageEvent[];
  agentOutputs: Record<string, string>;
  promptResult: { paneId: string; success: boolean; message?: string } | null;
  spawnResult: { success: boolean; paneId?: string; name?: string; error?: string } | null;
  clearResults: () => void;
}

export function useHerdrWebSocket(url = 'ws://localhost:4000'): UseHerdrWebSocketReturn {
  const [agents, setAgents] = useState<HerdrAgent[]>([]);
  const [connected, setConnected] = useState(false);
  const [herdrConnected, setHerdrConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentOutputs, setAgentOutputs] = useState<Record<string, string>>({});
  const [promptResult, setPromptResult] = useState<{ paneId: string; success: boolean; message?: string } | null>(null);
  const [spawnResult, setSpawnResult] = useState<{ success: boolean; paneId?: string; name?: string; error?: string } | null>(null);
  const [syncReport, setSyncReport] = useState<WorkspaceSyncReport | null>(null);
  const [recentMessages, setRecentMessages] = useState<AgentMessageEvent[]>([]);

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

  const promptAgent = useCallback((paneId: string, prompt: string) => {
    sendMessage({ type: 'prompt_agent', paneId, prompt });
  }, [sendMessage]);

  const interruptAgent = useCallback((paneId: string) => {
    sendMessage({ type: 'interrupt_agent', paneId });
  }, [sendMessage]);

  const spawnAgent = useCallback((data: { name?: string; kind?: string; initialPrompt?: string; cwd?: string }) => {
    sendMessage({ type: 'spawn_agent', ...data });
  }, [sendMessage]);

  const fetchAgentOutput = useCallback((paneId: string) => {
    sendMessage({ type: 'get_agent_output', paneId });
  }, [sendMessage]);

  const sendAgentMessage = useCallback((payload: AgentMessagePayload) => {
    sendMessage({ type: 'send_agent_message', payload });
  }, [sendMessage]);

  const syncWorkspace = useCallback((request?: WorkspaceSyncRequest) => {
    sendMessage({ type: 'sync_workspace', request });
  }, [sendMessage]);

  const clearResults = useCallback(() => {
    setPromptResult(null);
    setSpawnResult(null);
  }, []);

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
            } else if (data.type === 'agent_prompt_result') {
              setPromptResult({
                paneId: data.paneId,
                success: data.success,
                message: data.message,
              });
            } else if (data.type === 'spawn_agent_result') {
              setSpawnResult({
                success: data.success,
                paneId: data.paneId,
                name: data.name,
                error: data.error,
              });
            } else if (data.type === 'agent_output') {
              setAgentOutputs((prev) => ({
                ...prev,
                [data.paneId]: data.output,
              }));
            } else if (data.type === 'agent_message' || data.type === 'agent_message_delivered') {
              setRecentMessages((prev) => [data.event, ...prev.slice(0, 49)]);
            } else if (data.type === 'workspace_sync_report' || data.type === 'sync_report') {
              setSyncReport(data.report);
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
    promptAgent,
    interruptAgent,
    spawnAgent,
    fetchAgentOutput,
    sendAgentMessage,
    syncWorkspace,
    syncReport,
    recentMessages,
    agentOutputs,
    promptResult,
    spawnResult,
    clearResults,
  };
}
