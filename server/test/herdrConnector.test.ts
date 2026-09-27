import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  HerdrConnector,
  extractTerminalDetails,
  extractSessionInfo,
  readChunk,
} from '../src/herdrConnector.js';

describe('HerdrConnector', () => {
  it('instantiates with default poll interval and adapts to client count', () => {
    const connector = new HerdrConnector({ activePollIntervalMs: 1200, idlePollIntervalMs: 8000 });
    assert.equal(connector.getAgents().length, 0);
    assert.equal(connector.getConnected(), false);
    assert.equal(connector.getClientCount(), 0);
    // When 0 clients are connected, it should use idle poll interval
    assert.equal(connector.getEffectivePollInterval(), 8000);

    // When client connects, effective interval switches to active interval
    connector.setClientCount(1);
    assert.equal(connector.getClientCount(), 1);
    assert.equal(connector.getEffectivePollInterval(), 1200);

    // When all clients disconnect, reverts to idle interval
    connector.setClientCount(0);
    assert.equal(connector.getEffectivePollInterval(), 8000);
  });

  it('readChunk and extractSessionInfo buffer only chunk tail on large files', () => {
    const tmpDir = os.tmpdir();
    const testSessionFile = path.join(tmpDir, `test-session-${Date.now()}.jsonl`);

    try {
      // Create a simulated large session file (>70KB)
      const lines: string[] = [];
      lines.push(
        JSON.stringify({
          type: 'message',
          message: { role: 'user', content: 'Initial user prompt at head of file' },
        })
      );

      // Pad with intermediate messages to exceed 70KB
      const paddingMsg = JSON.stringify({
        type: 'message',
        message: { role: 'assistant', content: 'padding '.repeat(50) },
      });
      for (let i = 0; i < 200; i++) {
        lines.push(paddingMsg);
      }

      // Latest assistant task at tail
      lines.push(
        JSON.stringify({
          type: 'message',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'toolCall',
                name: 'edit',
                arguments: { path: 'server/src/herdrConnector.ts' },
              },
            ],
          },
        })
      );

      fs.writeFileSync(testSessionFile, lines.join('\n'), 'utf8');
      const stat = fs.statSync(testSessionFile);
      assert.ok(stat.size > 65536, `File size should exceed 64KB, got ${stat.size}`);

      // Test readChunk
      const tailChunk = readChunk(testSessionFile, { length: 1024 });
      assert.ok(tailChunk.length <= 1024);
      assert.ok(tailChunk.includes('edit'));

      // Test extractSessionInfo with tail buffering + head prompt fallback
      const sessionInfo = extractSessionInfo(testSessionFile);
      assert.equal(sessionInfo.prompt, 'Initial user prompt at head of file');
      assert.ok(sessionInfo.task?.startsWith('edit: server/src/herdrConnector.ts'));
    } finally {
      if (fs.existsSync(testSessionFile)) {
        fs.unlinkSync(testSessionFile);
      }
    }
  });

  it('extractTerminalDetails parses tasks, summaries, and blockers', () => {
    const raw = `
── ⠸ Working ──────────────────────────────────────────────────────────
Developing Agent Sync Logic

I'm now developing the synchronization mechanism.
Error: got status: INTERNAL. {"error":{"code":500,"message":"Internal error encountered."}}
~/projects/herdr-office (main)
↑65k ↓2.3k R85k CH70.2% $0.064 1.6%/1.0M (auto) gemini-3.8-flash • medium
    `;
    const details = extractTerminalDetails(raw);
    assert.ok(details.blockedReason);
    assert.ok(details.blockedReason.includes('INTERNAL'));
    assert.ok(details.currentTask);
    assert.equal(details.currentTask, 'Developing Agent Sync Logic');
    assert.ok(details.lastOutputSummary);
  });

  it('polls Herdr CLI and handles agents', async () => {
    const connector = new HerdrConnector();
    const agents = await connector.pollOnce();
    assert.ok(Array.isArray(agents));
    console.log(`Discovered ${agents.length} Herdr agents in test`);
    if (agents.length > 0) {
      const agent = agents[0];
      assert.ok(agent.paneId);
      assert.ok(agent.status);
      console.log(`First agent: ${agent.agent} (${agent.paneId})`);
      if (agent.currentPrompt) {
        console.log(`  Current prompt: ${agent.currentPrompt.slice(0, 50)}...`);
      }
      if (agent.currentTask) {
        console.log(`  Current task: ${agent.currentTask}`);
      }

      // Test getAgentOutput
      const output = await connector.getAgentOutput(agent.paneId);
      assert.equal(typeof output, 'string');
      console.log(`  Output preview (${output.length} chars): ${output.slice(0, 60).trim()}...`);
    }
  });

  it('syncWorkspace produces a WorkspaceSyncReport and tracks status', async () => {
    const connector = new HerdrConnector();
    const report = await connector.syncWorkspace({
      goal: 'Sync all agents for project release',
      action: 'sync_status',
    });

    assert.ok(report);
    assert.equal(typeof report.timestamp, 'number');
    assert.equal(report.activeGoal, 'Sync all agents for project release');
    assert.ok(Array.isArray(report.agents));
    if (report.agents.length > 0) {
      const agentInfo = report.agents[0];
      assert.ok(agentInfo.paneId);
      assert.ok(agentInfo.name);
      assert.ok(agentInfo.status);
    }

    const cachedReport = connector.getWorkspaceSyncReport();
    assert.deepEqual(cachedReport, report);
  });

  it('sendAgentMessage handles message event formatting and delivery attempts', async () => {
    const connector = new HerdrConnector();
    const event = await connector.sendAgentMessage({
      fromPaneId: 'test-src-mock',
      toPaneId: 'test-dst-mock',
      message: 'Hello from mock test',
      taskType: 'sync',
    });

    assert.ok(event.id);
    assert.equal(event.fromPaneId, 'test-src-mock');
    assert.equal(event.toPaneId, 'test-dst-mock');
    assert.equal(event.message, 'Hello from mock test');
    assert.ok(['delivered', 'failed'].includes(event.status));
  });
});
