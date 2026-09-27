export type AgentStatus = 'idle' | 'working' | 'blocked' | 'done' | 'unknown';

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
  | { type: 'get_agent_output'; paneId: string };
