import { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import { promisify } from 'node:util';
import type {
  AgentMessageEvent,
  AgentMessagePayload,
  AgentStatus,
  AgentSyncInfo,
  HerdrAgent,
  WorkspaceSyncReport,
  WorkspaceSyncRequest,
} from './types.js';

const execFileAsync = promisify(execFile);

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]|\x1B\].*?(?:\x07|\x1B\\)/g, '');
}

export function extractTerminalDetails(text: string): {
  lastOutputSummary?: string;
  currentTask?: string;
  blockedReason?: string;
} {
  const clean = stripAnsi(text);
  const lines = clean
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (l.startsWith('──') || l.startsWith('==') || l.startsWith('--') || l.startsWith('───')) return false;
      if (l.startsWith('Elapsed ') || l.startsWith('Took ')) return false;
      if (l.startsWith('$ herdr agent') || l.startsWith('$ herdr pane')) return false;
      if (/\(timeout \d+s\)/.test(l)) return false;
      if (/↑\d+k?.*↓\d+k?/.test(l)) return false;
      if (
        l.includes('(auto)') &&
        (l.includes('gemini') || l.includes('claude') || l.includes('pi') || l.includes('medium') || l.includes('flash'))
      ) {
        return false;
      }
      return true;
    });

  if (lines.length === 0) {
    return {};
  }

  // Detect blocker
  let blockedReason: string | undefined;
  const blockerPatterns = [
    /(?:error|exception|failed|fatal):?\s*(.+)/i,
    /(?:cannot find|permission denied|eacces|enoent|command not found)/i,
    /(?:waiting for (?:user )?input|do you want to proceed|\(y\/n\)|\[y\/N\]|\?\s*$)/i,
    /(?:rejected|blocked|rate limit|quota exceeded)/i,
  ];

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    for (const pat of blockerPatterns) {
      if (pat.test(line)) {
        blockedReason = line.slice(0, 150);
        break;
      }
    }
    if (blockedReason) break;
  }

  // Detect current task
  let currentTask: string | undefined;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s*(Working|Thinking|Executing)/i.test(line)) {
      continue;
    }
    if (/^(bash|read|edit|write|create_goal|get_goal):/i.test(line)) {
      currentTask = line.slice(0, 120);
      break;
    }
    const isHeading =
      /^(#|\*\*|Task:)/i.test(line) ||
      (!line.endsWith('.') &&
        !line.endsWith(',') &&
        !/^(I'm|I am|This |We |Please |Note:)/i.test(line) &&
        /^[A-Z][a-zA-Z0-9\s\-:]{3,70}$/.test(line) &&
        /(?:Developing|Implementing|Investigating|Refining|Creating|Building|Testing|Reviewing|Fixing|Writing|Sync|Task|Status|Agent|Detailing|Defining)\b/i.test(
          line
        ));

    if (isHeading) {
      currentTask = line.replace(/[*#]/g, '').trim().slice(0, 120);
      break;
    }
    if (
      !currentTask &&
      line.length > 5 &&
      line.length < 80 &&
      !line.includes('{') &&
      !line.includes('}') &&
      !line.endsWith('.') &&
      /^[A-Z]/.test(line)
    ) {
      currentTask = line.slice(0, 120);
    }
  }

  // Last output summary
  let lastOutputSummary: string | undefined;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s*(Working|Thinking|Executing)/i.test(line)) {
      continue;
    }
    lastOutputSummary = line.slice(0, 150);
    break;
  }

  return { lastOutputSummary, currentTask, blockedReason };
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
  private activeGoal?: string;
  private meetingActive = false;
  private lastSyncReport: WorkspaceSyncReport | null = null;

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
            const details = extractTerminalDetails(cachedTerm.output);
            currentTask = details.currentTask || details.lastOutputSummary;
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
              const details = extractTerminalDetails(clean);
              currentTask = details.currentTask || details.lastOutputSummary;
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

  public async sendAgentMessage(payload: AgentMessagePayload): Promise<AgentMessageEvent> {
    if (this.agents.size === 0) {
      await this.pollOnce();
    }

    const findAgent = (idOrName: string): HerdrAgent | undefined => {
      const direct = this.agents.get(idOrName);
      if (direct) return direct;
      return Array.from(this.agents.values()).find(
        (a) => a.name === idOrName || a.paneId === idOrName || a.agent === idOrName
      );
    };

    const fromAgent = findAgent(payload.fromPaneId);
    const toAgent = findAgent(payload.toPaneId);

    const fromName = fromAgent?.name || fromAgent?.agent || payload.fromPaneId;
    const toName = toAgent?.name || toAgent?.agent || payload.toPaneId;
    const fromPaneId = fromAgent?.paneId || payload.fromPaneId;
    const toPaneId = toAgent?.paneId || payload.toPaneId;

    const taskTypePrefix = payload.taskType ? ` (${payload.taskType})` : '';
    const formattedMessage = `[From @${fromName}${taskTypePrefix}]: ${payload.message}`;

    const target = toPaneId || toAgent?.name || payload.toPaneId;
    let delivered = false;

    try {
      await execFileAsync('herdr', ['agent', 'prompt', target, formattedMessage], {
        timeout: 10000,
      });
      delivered = true;
    } catch (promptErr) {
      console.warn(`[HerdrConnector] herdr agent prompt failed on ${target}, attempting fallback:`, promptErr);
      try {
        await execFileAsync('herdr', ['pane', 'send-text', toPaneId, `${formattedMessage}\n`], {
          timeout: 5000,
        });
        delivered = true;
      } catch (paneErr) {
        console.error(`[HerdrConnector] pane send-text fallback also failed on ${toPaneId}:`, paneErr);
        delivered = false;
      }
    }

    const event: AgentMessageEvent = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      fromPaneId,
      fromName,
      toPaneId,
      toName,
      message: payload.message,
      status: delivered ? 'delivered' : 'failed',
    };

    this.terminalCache.delete(toPaneId);
    this.emit('agent_message', event);
    return event;
  }

  public async syncWorkspace(request?: WorkspaceSyncRequest): Promise<WorkspaceSyncReport> {
    const agents = await this.pollOnce();

    if (request?.goal !== undefined) {
      this.activeGoal = request.goal;
    }
    if (request?.action === 'standup') {
      this.meetingActive = true;
    } else if (request?.action === 'broadcast') {
      this.meetingActive = false;
    }

    if (request?.goal && request.action === 'broadcast') {
      const broadcastPrompt = `[Workspace Goal Update]: ${request.goal}`;
      await Promise.allSettled(
        agents.map(async (agent) => {
          const target = agent.paneId;
          try {
            await execFileAsync('herdr', ['agent', 'prompt', target, broadcastPrompt], {
              timeout: 8000,
            });
          } catch {
            try {
              await execFileAsync('herdr', ['pane', 'send-text', agent.paneId, `${broadcastPrompt}\n`], {
                timeout: 4000,
              });
            } catch {
              // ignore
            }
          }
        })
      );
    }

    const syncAgents: AgentSyncInfo[] = await Promise.all(
      agents.map(async (agent) => {
        let output = '';
        try {
          output = await this.getAgentOutput(agent.paneId);
        } catch {
          // ignore
        }

        const details = extractTerminalDetails(output);
        const currentTask = agent.currentTask || details.currentTask || details.lastOutputSummary;
        let blockedReason = details.blockedReason;
        if (agent.status === 'blocked' && !blockedReason) {
          blockedReason = details.lastOutputSummary || 'Agent is waiting for input or resolution';
        }

        return {
          paneId: agent.paneId,
          name: agent.name || agent.agent,
          status: agent.status,
          currentTask,
          lastOutputSummary: details.lastOutputSummary,
          blockedReason,
        };
      })
    );

    const report: WorkspaceSyncReport = {
      timestamp: Date.now(),
      activeGoal: this.activeGoal,
      meetingActive: this.meetingActive,
      agents: syncAgents,
    };

    this.lastSyncReport = report;
    this.emit('workspace_sync', report);
    return report;
  }

  public getWorkspaceSyncReport(): WorkspaceSyncReport | null {
    if (this.lastSyncReport) return this.lastSyncReport;
    const currentAgents = this.getAgents();
    if (currentAgents.length === 0) return null;
    return {
      timestamp: Date.now(),
      activeGoal: this.activeGoal,
      meetingActive: this.meetingActive,
      agents: currentAgents.map((a) => ({
        paneId: a.paneId,
        name: a.name || a.agent,
        status: a.status,
        currentTask: a.currentTask,
        lastOutputSummary: undefined,
        blockedReason: a.status === 'blocked' ? 'Agent in blocked state' : undefined,
      })),
    };
  }

  private summarizeTerminal(text: string): string | undefined {
    const details = extractTerminalDetails(text);
    return details.currentTask || details.lastOutputSummary;
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
