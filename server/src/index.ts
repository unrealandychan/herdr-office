import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { HerdrConnector } from './herdrConnector.js';
import type {
  AgentMessagePayload,
  ClientMessage,
  ServerMessage,
  WorkspaceSyncRequest,
} from './types.js';

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

function parseJsonBody<T = any>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body.trim() ? JSON.parse(body) : ({} as T));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Create HTTP server that can serve built client or redirect to Vite dev server
const httpServer = http.createServer(async (req, res) => {
  const urlPath = req.url?.split('?')[0] || '/';

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // REST API: POST /api/messages or /api/message
  if (req.method === 'POST' && (urlPath === '/api/messages' || urlPath === '/api/message')) {
    try {
      const payload = await parseJsonBody<AgentMessagePayload>(req);
      if (!payload || !payload.toPaneId || !payload.message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing toPaneId or message in payload' }));
        return;
      }
      const event = await connector.sendAgentMessage(payload);
      broadcast({
        type: 'agent_message',
        event,
        timestamp: Date.now(),
      });
      broadcast({
        type: 'agent_message_delivered',
        event,
        timestamp: Date.now(),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(event));
    } catch (err) {
      console.error('[herdr-office-server] Error in /api/messages:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

  // REST API: POST /api/sync
  if (req.method === 'POST' && urlPath === '/api/sync') {
    try {
      const body = await parseJsonBody<WorkspaceSyncRequest>(req);
      const report = await connector.syncWorkspace(body);
      broadcast({
        type: 'workspace_sync_report',
        report,
        timestamp: Date.now(),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(report));
    } catch (err) {
      console.error('[herdr-office-server] Error in POST /api/sync:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

  // REST API: GET /api/sync
  if (req.method === 'GET' && urlPath === '/api/sync') {
    try {
      const report = connector.getWorkspaceSyncReport() || (await connector.syncWorkspace());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(report));
    } catch (err) {
      console.error('[herdr-office-server] Error in GET /api/sync:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

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
const connector = new HerdrConnector();

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

connector.on('agent_message', (event) => {
  broadcast({
    type: 'agent_message',
    event,
    timestamp: Date.now(),
  });
});

connector.on('workspace_sync', (report) => {
  broadcast({
    type: 'workspace_sync_report',
    report,
    timestamp: Date.now(),
  });
});

// Client connections
wss.on('connection', (ws) => {
  console.log('[herdr-office-server] Client connected to WebSocket');
  connector.setClientCount(wss.clients.size);

  // Send initial state immediately
  const initialStateMsg: ServerMessage = {
    type: 'initial_state',
    agents: connector.getAgents(),
    timestamp: Date.now(),
  };
  ws.send(JSON.stringify(initialStateMsg));

  const initialSyncReport = connector.getWorkspaceSyncReport();
  if (initialSyncReport) {
    ws.send(
      JSON.stringify({
        type: 'workspace_sync_report',
        report: initialSyncReport,
        timestamp: Date.now(),
      })
    );
  }

  ws.on('message', async (raw) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());
      if (msg.type === 'focus_pane') {
        await connector.focusPane(msg.paneId);
      } else if (msg.type === 'refresh') {
        await connector.pollOnce();
      } else if (msg.type === 'prompt_agent') {
        const result = await connector.promptAgent(msg.paneId, msg.prompt);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'agent_prompt_result',
              paneId: msg.paneId,
              success: result.success,
              message: result.message,
              timestamp: Date.now(),
            })
          );
        }
      } else if (msg.type === 'interrupt_agent') {
        const result = await connector.interruptAgent(msg.paneId);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'agent_prompt_result',
              paneId: msg.paneId,
              success: result.success,
              message: result.message,
              timestamp: Date.now(),
            })
          );
        }
      } else if (msg.type === 'spawn_agent') {
        const result = await connector.spawnAgent({
          name: msg.name,
          kind: msg.kind,
          initialPrompt: msg.initialPrompt,
          cwd: msg.cwd,
        });
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'spawn_agent_result',
              success: result.success,
              paneId: result.paneId,
              name: result.name,
              error: result.error,
              timestamp: Date.now(),
            })
          );
        }
      } else if (msg.type === 'get_agent_output') {
        const output = await connector.getAgentOutput(msg.paneId);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'agent_output',
              paneId: msg.paneId,
              output,
              timestamp: Date.now(),
            })
          );
        }
      } else if (msg.type === 'agent_message' || msg.type === 'send_agent_message') {
        const event = await connector.sendAgentMessage(msg.payload);
        broadcast({
          type: 'agent_message',
          event,
          timestamp: Date.now(),
        });
        broadcast({
          type: 'agent_message_delivered',
          event,
          timestamp: Date.now(),
        });
      } else if (msg.type === 'sync_workspace' || msg.type === 'workspace_sync') {
        const report = await connector.syncWorkspace(msg.request);
        broadcast({
          type: 'workspace_sync_report',
          report,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('[herdr-office-server] Error processing client message:', err);
    }
  });

  ws.on('close', () => {
    console.log('[herdr-office-server] Client disconnected');
    connector.setClientCount(wss.clients.size);
  });
});

// Start polling Herdr
connector.start();

httpServer.listen(port, () => {
  console.log(`[herdr-office-server] Server listening at http://localhost:${port}`);
  console.log(`[herdr-office-server] WebSocket endpoint: ws://localhost:${port}`);
});

export { httpServer, wss, connector, broadcast };
