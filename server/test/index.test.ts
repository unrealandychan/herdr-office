import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { connector, httpServer, wss } from '../src/index.js';

describe('Server REST and WebSocket APIs', () => {
  const baseUrl = 'http://localhost:4000';
  const wsUrl = 'ws://localhost:4000';

  after(() => {
    connector.stop();
    for (const client of wss.clients) {
      client.terminate();
    }
    wss.close();
    httpServer.close();
  });

  it('GET /api/sync returns a WorkspaceSyncReport', async () => {
    const res = await fetch(`${baseUrl}/api/sync`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data);
    assert.equal(typeof data.timestamp, 'number');
    assert.ok(Array.isArray(data.agents));
  });

  it('POST /api/sync updates activeGoal and action', async () => {
    const res = await fetch(`${baseUrl}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'Sprint Review Goal',
        action: 'standup',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data);
    assert.equal(data.activeGoal, 'Sprint Review Goal');
    assert.equal(data.meetingActive, true);
    assert.ok(Array.isArray(data.agents));
  });

  it('POST /api/messages delivers an inter-agent message', async () => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromPaneId: 'agent-1',
        toPaneId: 'agent-2',
        message: 'Hello teammate',
        taskType: 'query',
      }),
    });
    assert.equal(res.status, 200);
    const event = await res.json();
    assert.ok(event.id);
    assert.equal(event.fromPaneId, 'agent-1');
    assert.equal(event.toPaneId, 'agent-2');
    assert.equal(event.message, 'Hello teammate');
    assert.ok(['delivered', 'failed'].includes(event.status));
  });

  it('WebSocket handles agent_message and sync_workspace broadcasts', async () => {
    const ws = new WebSocket(wsUrl);
    const receivedMessages: any[] = [];

    ws.on('message', (raw) => {
      try {
        receivedMessages.push(JSON.parse(raw.toString()));
      } catch {
        // ignore
      }
    });

    await new Promise<void>((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    const waitForMessage = async (predicate: (m: any) => boolean, timeoutMs = 4000) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (receivedMessages.some(predicate)) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    };

    const hasInitial = await waitForMessage((m) => m.type === 'initial_state');
    assert.ok(hasInitial, 'Should receive initial_state');

    // Send inter-agent message via WebSocket
    ws.send(
      JSON.stringify({
        type: 'agent_message',
        payload: {
          fromPaneId: 'test-src',
          toPaneId: 'test-dst',
          message: 'WS ping',
        },
      })
    );

    // Send workspace sync via WebSocket
    ws.send(
      JSON.stringify({
        type: 'sync_workspace',
        request: {
          goal: 'WS Sync Test Goal',
          action: 'sync_status',
        },
      })
    );

    const hasDelivered = await waitForMessage(
      (m) => m.type === 'agent_message' || m.type === 'agent_message_delivered'
    );
    assert.ok(hasDelivered, 'Should receive agent_message broadcast');

    const hasReport = await waitForMessage(
      (m) => m.type === 'workspace_sync_report' && m.report?.activeGoal === 'WS Sync Test Goal'
    );
    assert.ok(hasReport, 'Should receive workspace_sync_report broadcast');

    ws.close();
  });
});
