import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HerdrConnector, extractTerminalDetails } from '../src/herdrConnector.js';

describe('HerdrConnector', () => {
  it('instantiates with default poll interval', () => {
    const connector = new HerdrConnector();
    assert.equal(connector.getAgents().length, 0);
    assert.equal(connector.getConnected(), false);
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

  it('sendAgentMessage resolves sender and receiver and returns AgentMessageEvent', async () => {
    const connector = new HerdrConnector();
    await connector.pollOnce();
    const agents = connector.getAgents();

    if (agents.length >= 2) {
      const from = agents[0];
      const to = agents[1];
      // Test message event format without crashing even if CLI command fails
      const event = await connector.sendAgentMessage({
        fromPaneId: from.paneId,
        toPaneId: to.paneId,
        message: 'Hello from test',
        taskType: 'sync',
      });

      assert.ok(event.id);
      assert.equal(event.fromPaneId, from.paneId);
      assert.equal(event.toPaneId, to.paneId);
      assert.equal(event.message, 'Hello from test');
      assert.ok(['delivered', 'failed'].includes(event.status));
    }
  });
});
