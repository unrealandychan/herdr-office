import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HerdrConnector } from '../src/herdrConnector.js';

describe('HerdrConnector', () => {
  it('instantiates with default poll interval', () => {
    const connector = new HerdrConnector();
    assert.equal(connector.getAgents().length, 0);
    assert.equal(connector.getConnected(), false);
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
});
