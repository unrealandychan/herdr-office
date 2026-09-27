import { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { promisify } from 'node:util';
import type { AgentStatus, HerdrAgent } from './types.js';

const execFileAsync = promisify(execFile);

export interface HerdrCliAgentResponse {
  id?: string;
  type?: string;
  result?: {
    agents?: Array<{
      pane_id: string;
      agent: string;
      agent_status?: string;
      cwd?: string;
      focused?: boolean;
      workspace_id?: string;
      tab_id?: string;
      terminal_title?: string;
      terminal_title_stripped?: string;
      agent_session?: {
        value?: string;
      };
    }>;
  };
}

export class HerdrConnector extends EventEmitter {
  private pollIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private agents = new Map<string, HerdrAgent>();
  private isConnected = false;

  constructor(options: { pollIntervalMs?: number } = {}) {
    super();
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
  }

  public getAgents(): HerdrAgent[] {
    return Array.from(this.agents.values());
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.poll();
  }

  public stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public async pollOnce(): Promise<HerdrAgent[]> {
    try {
      const { stdout } = await execFileAsync('herdr', ['agent', 'list'], {
        timeout: 2000,
      });

      const parsed: HerdrCliAgentResponse = JSON.parse(stdout.trim());
      const rawAgents = parsed.result?.agents ?? [];

      const currentPaneIds = new Set<string>();
      const updatedAgents: HerdrAgent[] = [];
      const now = Date.now();

      for (const raw of rawAgents) {
        currentPaneIds.add(raw.pane_id);
        const status: AgentStatus = this.normalizeStatus(raw.agent_status);

        const agent: HerdrAgent = {
          paneId: raw.pane_id,
          agent: raw.agent || 'agent',
          status,
          cwd: raw.cwd || process.cwd(),
          focused: Boolean(raw.focused),
          workspaceId: raw.workspace_id || 'default',
          tabId: raw.tab_id || 'default',
          terminalTitle: raw.terminal_title_stripped || raw.terminal_title || raw.agent || 'terminal',
          sessionPath: raw.agent_session?.value,
          updatedAt: now,
        };

        const existing = this.agents.get(raw.pane_id);
        if (!existing) {
          this.agents.set(raw.pane_id, agent);
          this.emit('agent_added', agent);
          updatedAgents.push(agent);
        } else if (
          existing.status !== agent.status ||
          existing.focused !== agent.focused ||
          existing.terminalTitle !== agent.terminalTitle
        ) {
          this.agents.set(raw.pane_id, agent);
          this.emit('agent_updated', agent);
          updatedAgents.push(agent);
        }
      }

      // Check for removed agents
      for (const [paneId] of this.agents) {
        if (!currentPaneIds.has(paneId)) {
          this.agents.delete(paneId);
          this.emit('agent_removed', paneId);
        }
      }

      if (!this.isConnected) {
        this.isConnected = true;
        this.emit('connection_change', { connected: true });
      }

      return Array.from(this.agents.values());
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (this.isConnected) {
        this.isConnected = false;
        this.emit('connection_change', { connected: false, error: errMsg });
      }
      return Array.from(this.agents.values());
    }
  }

  public async focusPane(paneId: string): Promise<void> {
    try {
      await execFileAsync('herdr', ['pane', 'focus', '--pane', paneId], {
        timeout: 2000,
      });
    } catch (err) {
      console.error(`Failed to focus pane ${paneId}:`, err);
      throw err;
    }
  }

  private poll = async (): Promise<void> => {
    if (!this.running) return;
    await this.pollOnce();
    if (this.running) {
      this.timer = setTimeout(this.poll, this.pollIntervalMs);
    }
  };

  private normalizeStatus(status?: string): AgentStatus {
    switch (status) {
      case 'idle':
      case 'working':
      case 'blocked':
      case 'done':
        return status;
      default:
        return 'unknown';
    }
  }
}
