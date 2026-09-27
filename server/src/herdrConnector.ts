import { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import { promisify } from 'node:util';
import type { AgentStatus, HerdrAgent } from './types.js';

const execFileAsync = promisify(execFile);

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]|\x1B\].*?(?:\x07|\x1B\\)/g, '');
}

function extractSessionInfo(sessionPath: string): { prompt?: string; task?: string } {
  try {
    if (!fs.existsSync(sessionPath)) return {};
    const content = fs.readFileSync(sessionPath, 'utf8');
    const lines = content.trim().split('\n');
    let prompt: string | undefined;
    let task: string | undefined;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'message' && parsed.message) {
          if (!prompt && parsed.message.role === 'user') {
            const c = parsed.message.content;
            if (Array.isArray(c)) {
              const textObj = c.find((item: { type: string; text?: string }) => item.type === 'text');
              if (textObj && textObj.text) prompt = textObj.text;
            } else if (typeof c === 'string') {
              prompt = c;
            }
          }
          if (!task && parsed.message.role === 'assistant') {
            const c = parsed.message.content;
            if (Array.isArray(c)) {
              for (let j = c.length - 1; j >= 0; j--) {
                const item = c[j];
                if (item.type === 'toolCall') {
                  const args = item.arguments
                    ? Object.values(item.arguments)
                        .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
                        .join(' ')
                    : '';
                  task = `${item.name}: ${args}`.slice(0, 100);
                  break;
                } else if (item.type === 'thinking' && item.thinking) {
                  const firstLine = item.thinking.split('\n').find((l: string) => l.trim().length > 0) || '';
                  task = firstLine.replace(/[*_#]/g, '').trim().slice(0, 100);
                  break;
                } else if (item.type === 'text' && item.text) {
                  const firstLine = item.text.split('\n').find((l: string) => l.trim().length > 0) || '';
                  task = firstLine.trim().slice(0, 100);
                  break;
                }
              }
            }
          }
        }
      } catch {
        // Ignore JSON parse errors for incomplete lines
      }
      if (prompt && task) break;
    }
    return { prompt, task };
  } catch {
    return {};
  }
}

export interface HerdrCliAgentResponse {
  id?: string;
  type?: string;
  result?: {
    agents?: Array<{
      pane_id: string;
      agent: string;
      name?: string;
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
  private sessionCache = new Map<string, { mtime: number; prompt?: string; task?: string }>();
  private terminalCache = new Map<string, { time: number; output: string }>();

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

        let currentPrompt: string | undefined;
        let currentTask: string | undefined;

        // Try extracting prompt and task from session path
        const sessionPath = raw.agent_session?.value;
        if (sessionPath) {
          try {
            if (fs.existsSync(sessionPath)) {
              const stat = fs.statSync(sessionPath);
              const cached = this.sessionCache.get(sessionPath);
              if (cached && cached.mtime === stat.mtimeMs) {
                currentPrompt = cached.prompt;
                currentTask = cached.task;
              } else {
                const info = extractSessionInfo(sessionPath);
                currentPrompt = info.prompt;
                currentTask = info.task;
                this.sessionCache.set(sessionPath, {
                  mtime: stat.mtimeMs,
                  prompt: info.prompt,
                  task: info.task,
                });
              }
            }
          } catch {
            // Ignore session read errors
          }
        }

        // Fallback for currentTask from terminal output if missing or working
        if (!currentTask && (status === 'working' || status === 'blocked')) {
          const cachedTerm = this.terminalCache.get(raw.pane_id);
          if (cachedTerm && now - cachedTerm.time < 3000) {
            currentTask = this.summarizeTerminal(cachedTerm.output);
          } else {
            // Read terminal async without blocking long
            try {
              const { stdout: termOut } = await execFileAsync(
                'herdr',
                ['agent', 'read', raw.pane_id, '--lines', '20'],
                { timeout: 1500 }
              );
              const clean = stripAnsi(termOut);
              this.terminalCache.set(raw.pane_id, { time: now, output: clean });
              currentTask = this.summarizeTerminal(clean);
            } catch {
              // Ignore terminal read failure
            }
          }
        }

        const agent: HerdrAgent = {
          paneId: raw.pane_id,
          agent: raw.agent || 'agent',
          name: raw.name || raw.agent || 'agent',
          status,
          cwd: raw.cwd || process.cwd(),
          focused: Boolean(raw.focused),
          workspaceId: raw.workspace_id || 'default',
          tabId: raw.tab_id || 'default',
          terminalTitle: raw.terminal_title_stripped || raw.terminal_title || raw.agent || 'terminal',
          sessionPath,
          currentPrompt,
          currentTask,
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
          existing.terminalTitle !== agent.terminalTitle ||
          existing.currentTask !== agent.currentTask ||
          existing.currentPrompt !== agent.currentPrompt
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
          this.terminalCache.delete(paneId);
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

  public async promptAgent(paneId: string, prompt: string): Promise<{ success: boolean; message?: string }> {
    try {
      // First try standard agent prompt
      const { stdout } = await execFileAsync('herdr', ['agent', 'prompt', paneId, prompt], {
        timeout: 10000,
      });
      // Invalidate cache and poll
      this.terminalCache.delete(paneId);
      await this.pollOnce();
      return { success: true, message: stdout.trim() };
    } catch (err: unknown) {
      console.warn(`herdr agent prompt failed on ${paneId}, attempting fallback...`, err);
      try {
        // Fallback: send text directly to pane
        await execFileAsync('herdr', ['pane', 'send-text', paneId, `${prompt}\n`], {
          timeout: 5000,
        });
        this.terminalCache.delete(paneId);
        await this.pollOnce();
        return { success: true, message: 'Delivered directly to terminal pane' };
      } catch (fallbackErr: unknown) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        return { success: false, message: msg };
      }
    }
  }

  public async interruptAgent(paneId: string): Promise<{ success: boolean; message?: string }> {
    try {
      try {
        await execFileAsync('herdr', ['agent', 'send-keys', paneId, 'c-c'], { timeout: 3000 });
      } catch {
        await execFileAsync('herdr', ['pane', 'send-keys', paneId, 'c-c'], { timeout: 3000 });
      }
      this.terminalCache.delete(paneId);
      await this.pollOnce();
      return { success: true, message: 'Sent Ctrl+C interrupt' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: msg };
    }
  }

  public async spawnAgent(options: {
    name?: string;
    kind?: string;
    initialPrompt?: string;
    cwd?: string;
  }): Promise<{ success: boolean; paneId?: string; name?: string; error?: string }> {
    try {
      const kind = options.kind || 'pi';
      let name = options.name?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (!name || !/^[a-z]/.test(name)) {
        name = `${kind}-agent-${Math.floor(100 + Math.random() * 900)}`;
      }
      name = name.slice(0, 32);

      const cwd = options.cwd || process.cwd();

      // 1. Create a new tab
      const { stdout: tabStdout } = await execFileAsync(
        'herdr',
        ['tab', 'create', '--cwd', cwd, '--label', name, '--no-focus'],
        { timeout: 5000 }
      );

      const tabJson = JSON.parse(tabStdout.trim());
      const paneId = tabJson?.result?.root_pane?.pane_id;
      if (!paneId) {
        throw new Error('Failed to obtain new pane ID from tab create');
      }

      // 2. Start the interactive agent in that pane
      await execFileAsync(
        'herdr',
        ['agent', 'start', name, '--kind', kind, '--pane', paneId, '--timeout', '35000'],
        { timeout: 40000 }
      );

      // 3. If an initial prompt was provided, submit it
      if (options.initialPrompt && options.initialPrompt.trim()) {
        try {
          await execFileAsync('herdr', ['agent', 'prompt', name, options.initialPrompt.trim()], {
            timeout: 10000,
          });
        } catch (promptErr) {
          console.warn(`Initial prompt submission warning for ${name}:`, promptErr);
        }
      }

      await this.pollOnce();
      return { success: true, paneId, name };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to spawn agent:', err);
      return { success: false, error: msg };
    }
  }

  public async getAgentOutput(paneId: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync('herdr', ['agent', 'read', paneId, '--lines', '60'], {
        timeout: 3000,
      });
      return stripAnsi(stdout);
    } catch {
      try {
        const { stdout } = await execFileAsync('herdr', ['pane', 'read', paneId, '--lines', '60'], {
          timeout: 3000,
        });
        return stripAnsi(stdout);
      } catch (err) {
        return `Failed to read terminal output: ${err}`;
      }
    }
  }

  private summarizeTerminal(text: string): string | undefined {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('──') && !l.startsWith('Elapsed'));
    if (lines.length === 0) return undefined;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('Working') || line.includes('auto') || line.includes('gemini') || line.includes('claude')) {
        continue;
      }
      return line.slice(0, 100);
    }
    return lines[lines.length - 1].slice(0, 100);
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
