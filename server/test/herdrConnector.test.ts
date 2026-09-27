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
  });
});
