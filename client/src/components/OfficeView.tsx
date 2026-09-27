import React, { useEffect, useRef, useState } from 'react';
import { loadAssets, type LoadedAssets } from '../engine/assetLoader';
import { OfficeCanvasEngine } from '../engine/officeCanvas';
import { useHerdrWebSocket } from '../hooks/useHerdrWebSocket';
import { AgentDrawer } from './AgentDrawer';

export const OfficeView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<OfficeCanvasEngine | null>(null);
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [scale, setScale] = useState(3);
  const [selectedPaneId, setSelectedPaneId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { agents, connected, herdrConnected, focusPane, refresh } = useHerdrWebSocket();

  const selectedAgent = agents.find((a) => a.paneId === selectedPaneId) ?? null;

  // Load pixel assets on startup
  useEffect(() => {
    loadAssets()
      .then((loaded) => setAssets(loaded))
      .catch((err) => {
        console.error('Failed to load office assets:', err);
        setLoadError(String(err));
      });
  }, []);

  // Initialize Canvas 2D engine
  useEffect(() => {
    if (!canvasRef.current || !assets) return;

    const engine = new OfficeCanvasEngine({
      canvas: canvasRef.current,
      assets,
      scale,
      onSelectAgent: (agent) => setSelectedPaneId(agent ? agent.paneId : null),
    });

    engine.setAgents(agents);
    engine.start();
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  // Update scale when changed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setScale(scale);
    }
  }, [scale]);

  // Update agents when WebSocket pushes changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setAgents(agents);
    }
  }, [agents]);

  if (loadError) {
    return (
      <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>
        <h2>Error Loading Assets</h2>
        <p>{loadError}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#09090b', color: '#fafafa' }}>
      {/* Top Navbar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: '#18181b',
          borderBottom: '1px solid #27272a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>🏢</span>
          <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Herdr Office
          </h1>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: connected ? (herdrConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)') : 'rgba(239, 68, 68, 0.15)',
              color: connected ? (herdrConnected ? '#34d399' : '#facc15') : '#f87171',
              border: `1px solid ${connected ? (herdrConnected ? '#059669' : '#ca8a04') : '#dc2626'}`,
            }}
          >
            {connected ? (herdrConnected ? 'HERDR SYNCED' : 'HERDR IDLE') : 'SERVER OFFLINE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
            Active Agents: <strong style={{ color: '#fff' }}>{agents.length}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: '#71717a', marginRight: '4px' }}>Zoom:</span>
            {[2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: scale === s ? '#3b82f6' : '#27272a',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {s}×
              </button>
            ))}
          </div>

          <button
            onClick={refresh}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#27272a',
              color: '#e4e4e7',
              border: '1px solid #3f3f46',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'auto',
          background: '#09090b',
          position: 'relative',
        }}
      >
        {!assets ? (
          <div style={{ color: '#a1a1aa', fontSize: '1rem' }}>Loading office assets...</div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
              borderRadius: '4px',
              imageRendering: 'pixelated',
              cursor: 'pointer',
            }}
          />
        )}

        {/* Selected Agent Drawer */}
        <AgentDrawer
          agent={selectedAgent}
          onClose={() => setSelectedPaneId(null)}
          onFocusPane={focusPane}
        />
      </main>
    </div>
  );
};
