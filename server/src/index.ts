import { WebSocket, WebSocketServer } from 'ws';
import { HerdrConnector } from './herdrConnector.js';
import type { ClientMessage, ServerMessage } from './types.js';

const port = Number(process.env.PORT) || 4000;
const wss = new WebSocketServer({ port });
const connector = new HerdrConnector({ pollIntervalMs: 500 });

console.log(`[herdr-office-server] Starting Herdr Office backend on port ${port}...`);

function broadcast(msg: ServerMessage) {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Connect events from HerdrConnector to WebSocket broadcasts
connector.on('agent_added', (agent) => {
  console.log(`[herdr-office-server] Agent added: ${agent.agent} (${agent.paneId}) - ${agent.status}`);
  broadcast({
    type: 'agent_updated',
    agent,
    timestamp: Date.now(),
  });
});

connector.on('agent_updated', (agent) => {
  console.log(`[herdr-office-server] Agent status updated: ${agent.agent} (${agent.paneId}) -> ${agent.status}`);
  broadcast({
    type: 'agent_updated',
    agent,
    timestamp: Date.now(),
  });
});

connector.on('agent_removed', (paneId) => {
  console.log(`[herdr-office-server] Agent removed: ${paneId}`);
  broadcast({
    type: 'agent_removed',
    paneId,
    timestamp: Date.now(),
  });
});

connector.on('connection_change', ({ connected, error }) => {
  console.log(`[herdr-office-server] Herdr connection status: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
  broadcast({
    type: 'herdr_status',
    connected,
    error,
    timestamp: Date.now(),
  });
});

// Client connections
wss.on('connection', (ws) => {
  console.log('[herdr-office-server] Client connected to WebSocket');

  // Send initial state immediately
  const initialStateMsg: ServerMessage = {
    type: 'initial_state',
    agents: connector.getAgents(),
    timestamp: Date.now(),
  };
  ws.send(JSON.stringify(initialStateMsg));

  ws.on('message', async (raw) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());
      if (msg.type === 'focus_pane') {
        await connector.focusPane(msg.paneId);
      } else if (msg.type === 'refresh') {
        await connector.pollOnce();
      }
    } catch (err) {
      console.error('[herdr-office-server] Error processing client message:', err);
    }
  });

  ws.on('close', () => {
    console.log('[herdr-office-server] Client disconnected');
  });
});

// Start polling Herdr
connector.start();

console.log(`[herdr-office-server] WebSocket server live at ws://localhost:${port}`);
