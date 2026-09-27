export type AgentStatus = 'idle' | 'working' | 'blocked' | 'done' | 'unknown';
export type HerdrAgentStatus = AgentStatus;

export interface HerdrAgent {
  paneId: string;
  agent: string;
  name?: string;
  status: AgentStatus;
  cwd: string;
  focused: boolean;
  workspaceId: string;
  tabId: string;
  terminalTitle: string;
  sessionPath?: string;
  currentPrompt?: string;
  currentTask?: string;
  recentOutput?: string;
  updatedAt: number;
}

export interface AgentMessagePayload {
  fromPaneId: string;
  toPaneId: string;
  message: string;
  taskType?: 'delegate' | 'query' | 'sync';
}

export interface AgentMessageEvent {
  id: string;
  timestamp: number;
  fromPaneId: string;
  fromName: string;
  toPaneId: string;
  toName: string;
  message: string;
  status: 'delivered' | 'failed';
}

export interface WorkspaceSyncRequest {
  goal?: string;
  action?: 'standup' | 'broadcast' | 'sync_status';
}

export interface AgentSyncInfo {
  paneId: string;
  name: string;
  status: HerdrAgentStatus;
  currentTask?: string;
  lastOutputSummary?: string;
  blockedReason?: string;
}

export interface WorkspaceSyncReport {
  timestamp: number;
  activeGoal?: string;
  meetingActive: boolean;
  agents: AgentSyncInfo[];
}

export type ServerMessage =
  | {
      type: 'initial_state';
      agents: HerdrAgent[];
      timestamp: number;
    }
  | {
      type: 'agent_updated';
      agent: HerdrAgent;
      timestamp: number;
    }
  | {
      type: 'agent_removed';
      paneId: string;
      timestamp: number;
    }
  | {
      type: 'herdr_status';
      connected: boolean;
      error?: string;
      timestamp: number;
    }
  | {
      type: 'agent_prompt_result';
      paneId: string;
      success: boolean;
      message?: string;
      timestamp: number;
    }
  | {
      type: 'spawn_agent_result';
      success: boolean;
      paneId?: string;
      name?: string;
      error?: string;
      timestamp: number;
    }
  | {
      type: 'agent_output';
      paneId: string;
      output: string;
      timestamp: number;
    }
  | {
      type: 'agent_message';
      event: AgentMessageEvent;
      timestamp: number;
    }
  | {
      type: 'agent_message_delivered';
      event: AgentMessageEvent;
      timestamp: number;
    }
  | {
      type: 'workspace_sync_report';
      report: WorkspaceSyncReport;
      timestamp: number;
    }
  | {
      type: 'sync_report';
      report: WorkspaceSyncReport;
      timestamp: number;
    };

export type ClientMessage =
  | { type: 'focus_pane'; paneId: string }
  | { type: 'refresh' }
  | { type: 'prompt_agent'; paneId: string; prompt: string }
  | { type: 'interrupt_agent'; paneId: string }
  | {
      type: 'spawn_agent';
      name?: string;
      kind?: string;
      initialPrompt?: string;
      cwd?: string;
    }
  | { type: 'get_agent_output'; paneId: string }
  | { type: 'send_agent_message'; payload: AgentMessagePayload }
  | { type: 'agent_message'; payload: AgentMessagePayload }
  | { type: 'sync_workspace'; request?: WorkspaceSyncRequest }
  | { type: 'workspace_sync'; request?: WorkspaceSyncRequest };

