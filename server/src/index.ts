import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { HerdrConnector } from './herdrConnector.js';
import type { ClientMessage, ServerMessage } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT) || 4000;
const clientDistPath = path.resolve(__dirname, '../../client/dist');

// MIME types for static assets
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Create HTTP server that can serve built client or redirect to Vite dev server
const httpServer = http.createServer((req, res) => {
  const urlPath = req.url?.split('?')[0] || '/';

  if (fs.existsSync(clientDistPath)) {
    let filePath = path.join(clientDistPath, urlPath === '/' ? 'index.html' : urlPath);

    // Single-page application fallback
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(clientDistPath, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // If client/dist is not built yet (or running purely in dev mode)
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Herdr Office Backend</title>
        <meta http-equiv="refresh" content="2;url=http://localhost:5173" />
        <style>
          body { font-family: system-ui, sans-serif; background: #09090b; color: #f4f4f5; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          a { color: #3b82f6; text-decoration: none; font-weight: bold; }
          .card { background: #18181b; padding: 32px; border-radius: 8px; border: 1px solid #27272a; text-align: center; max-width: 480px; }
          .badge { display: inline-block; padding: 4px 10px; background: rgba(16,185,129,0.2); color: #34d399; border-radius: 999px; font-size: 0.8rem; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">WebSocket Server Active (ws://localhost:${port})</div>
          <h2>🏢 Herdr Office</h2>
          <p>The interactive pixel-art web UI is running at:</p>
          <p><a href="http://localhost:5173" style="font-size: 1.25rem;">http://localhost:5173</a></p>
          <p style="color: #a1a1aa; font-size: 0.85rem;">Redirecting in 2 seconds...</p>
        </div>
      </body>
    </html>
  `);
});

const wss = new WebSocketServer({ server: httpServer });
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

httpServer.listen(port, () => {
  console.log(`[herdr-office-server] Server listening at http://localhost:${port}`);
  console.log(`[herdr-office-server] WebSocket endpoint: ws://localhost:${port}`);
});
