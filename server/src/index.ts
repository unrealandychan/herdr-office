import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT) || 4000;
const wss = new WebSocketServer({ port });

console.log(`[herdr-office-server] WebSocket server listening on ws://localhost:${port}`);

wss.on('connection', (ws) => {
  console.log('[herdr-office-server] Client connected');
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to herdr-office server' }));

  ws.on('close', () => {
    console.log('[herdr-office-server] Client disconnected');
  });
});
