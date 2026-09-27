import React, { useEffect, useRef, useState } from 'react';
import { loadAssets, type LoadedAssets } from '../engine/assetLoader';
import { OfficeCanvasEngine } from '../engine/officeCanvas';
import { useHerdrWebSocket } from '../hooks/useHerdrWebSocket';
import { AgentDrawer } from './AgentDrawer';
import { SpawnAgentModal } from './SpawnAgentModal';

export const OfficeView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<OfficeCanvasEngine | null>(null);
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [scale, setScale] = useState(2); // 2x default for 32-bit high-res retro!
  const [selectedPaneId, setSelectedPaneId] = useState<string | null>(null);
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [isSpawning, setIsSpawning] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    agents,
    connected,
    herdrConnected,
    focusPane,
    refresh,
    promptAgent,
    interruptAgent,
    spawnAgent,
    fetchAgentOutput,
    agentOutputs,
    promptResult,
    spawnResult,
    clearResults,
  } = useHerdrWebSocket();

  const selectedAgent = agents.find((a) => a.paneId === selectedPaneId) ?? null;

  // Handle spawn result
  useEffect(() => {
    if (spawnResult) {
      setIsSpawning(false);
      if (spawnResult.success) {
        setIsSpawnModalOpen(false);
        if (spawnResult.paneId) {
          setSelectedPaneId(spawnResult.paneId);
        }
        clearResults();
      }
    }
  }, [spawnResult, clearResults]);

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

  // Sync selectedPaneId into engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSelectedPaneId(selectedPaneId);
    }
  }, [selectedPaneId]);

  const handleSpawnSubmit = (data: { name: string; kind: string; initialPrompt?: string; cwd?: string }) => {
    setIsSpawning(true);
    spawnAgent(data);
  };

  if (loadError) {
    return (
      <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>
        <h2>Error Loading Assets</h2>
        <p>{loadError}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Navbar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: '#141417',
          borderBottom: '1px solid #27272a',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>🏢</span>
          <div>
            <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Herdr Office
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: '#27272a', color: '#a1a1aa', fontWeight: 600 }}>
                32-BIT RETRO
              </span>
            </h1>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: connected ? (herdrConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)') : 'rgba(239, 68, 68, 0.15)',
              color: connected ? (herdrConnected ? '#34d399' : '#facc15') : '#f87171',
              border: `1px solid ${connected ? (herdrConnected ? '#059669' : '#ca8a04') : '#dc2626'}`,
            }}
          >
            {connected ? (herdrConnected ? 'HERDR SYNCED' : 'HERDR IDLE') : 'SERVER OFFLINE'}
          </span>
        </div>

        {/* Quick Agent Task Bar (Requirement 1: Know which agent is doing what) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', maxWidth: '50vw', padding: '2px 4px' }}>
          {agents.map((a) => {
            const isSelected = a.paneId === selectedPaneId;
            const statusColor =
              a.status === 'working'
                ? '#10b981'
                : a.status === 'blocked'
                  ? '#ef4444'
                  : a.status === 'done'
                    ? '#8b5cf6'
                    : '#60a5fa';

            return (
              <button
                key={a.paneId}
                onClick={() => setSelectedPaneId(a.paneId)}
                title={a.currentTask || a.currentPrompt || `${a.name || a.agent} (${a.status})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isSelected ? '#3b82f6' : '#27272a'}`,
                  background: isSelected ? 'rgba(59, 130, 246, 0.2)' : '#1c1c21',
                  color: '#f4f4f5',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: statusColor,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontWeight: 600 }}>{a.name || a.agent}</span>
                {a.status === 'working' && (
                  <span style={{ color: '#38bdf8', fontSize: '0.7rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.currentTask ? `• ${a.currentTask}` : '• Working'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Controls: Spawn Agent, Zoom, Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Spawn Agent Button (Requirement 3) */}
          <button
            onClick={() => setIsSpawnModalOpen(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            }}
          >
            <span>✨</span>
            <span>+ Spawn Agent</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#71717a', marginRight: '2px' }}>Scale:</span>
            {[1.5, 2, 2.5, 3].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                style={{
                  padding: '3px 7px',
                  borderRadius: '4px',
                  background: scale === s ? '#3b82f6' : '#27272a',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.72rem',
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
            title="Refresh agents"
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              background: '#27272a',
              color: '#e4e4e7',
              border: '1px solid #3f3f46',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ↻
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
          padding: '20px',
        }}
      >
        {!assets ? (
          <div style={{ color: '#a1a1aa', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⠋</span>
            Loading 32-bit retro office assets...
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
              borderRadius: '6px',
              imageRendering: 'pixelated',
              cursor: 'pointer',
            }}
          />
        )}

        {/* Selected Agent Drawer (Requirement 1 & 2: View Prompt/Tasks and Steer) */}
        <AgentDrawer
          agent={selectedAgent}
          onClose={() => setSelectedPaneId(null)}
          onFocusPane={focusPane}
          onPromptAgent={promptAgent}
          onInterruptAgent={interruptAgent}
          onFetchOutput={fetchAgentOutput}
          terminalOutput={selectedPaneId ? agentOutputs[selectedPaneId] : undefined}
          promptResult={promptResult}
        />

        {/* Spawn Agent Modal (Requirement 3: Create and prompt new Agent) */}
        <SpawnAgentModal
          isOpen={isSpawnModalOpen}
          onClose={() => setIsSpawnModalOpen(false)}
          onSpawn={handleSpawnSubmit}
          isSpawning={isSpawning}
          spawnError={spawnResult && !spawnResult.success ? spawnResult.error : null}
        />
      </main>
    </div>
  );
};
