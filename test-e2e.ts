import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

async function runE2ETest() {
  console.log('[E2E Test] Starting herdr-office server on port 4001 for test...');

  const serverProc = spawn('node', ['server/dist/index.js'], {
    env: { ...process.env, PORT: '4001' },
    stdio: 'pipe',
  });

  serverProc.stdout.on('data', (d) => console.log(`[Server] ${d.toString().trim()}`));
  serverProc.stderr.on('data', (d) => console.error(`[Server Error] ${d.toString().trim()}`));

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('[E2E Test] Connecting WebSocket client to ws://localhost:4001 ...');
  const ws = new WebSocket('ws://localhost:4001');

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for initial_state')), 5000);

    ws.on('open', () => {
      console.log('[E2E Test] WebSocket connected successfully');
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        console.log(`[E2E Test] Received WebSocket message of type: ${msg.type}`);
        if (msg.type === 'initial_state') {
          console.log(`[E2E Test] Initial state agents received: ${msg.agents.length}`);
          assert.ok(Array.isArray(msg.agents), 'agents must be an array');
          for (const a of msg.agents) {
            console.log(`  - Agent: ${a.agent} | Pane: ${a.paneId} | Status: ${a.status} | Title: ${a.terminalTitle}`);
            assert.ok(a.paneId, 'paneId required');
            assert.ok(a.status, 'status required');
          }
          clearTimeout(timer);
          ws.close();
          resolve();
        }
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  serverProc.kill();
  console.log('[E2E Test] PASS: Live Herdr session streamed successfully over WebSocket!');
}

runE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[E2E Test] FAIL:', err);
    process.exit(1);
  });
