export type AgentStatus = 'idle' | 'working' | 'blocked' | 'done' | 'unknown';

export interface HerdrAgent {
  paneId: string;
  agent: string;
  status: AgentStatus;
  cwd: string;
  focused: boolean;
  workspaceId: string;
  tabId: string;
  terminalTitle: string;
  sessionPath?: string;
  updatedAt: number;
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
    };

export type ClientMessage =
  | { type: 'focus_pane'; paneId: string }
  | { type: 'refresh' };
