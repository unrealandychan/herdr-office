import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadAssets, type LoadedAssets } from '../engine/assetLoader';
import { OfficeCanvasEngine } from '../engine/officeCanvas';
import { useHerdrWebSocket } from '../hooks/useHerdrWebSocket';
import { AgentDrawer } from './AgentDrawer';
import { SpawnAgentModal } from './SpawnAgentModal';
import { WorkspaceSyncModal } from './WorkspaceSyncModal';

export const OfficeView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<OfficeCanvasEngine | null>(null);
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [scale, setScale] = useState(1.25);
  const [selectedPaneId, setSelectedPaneId] = useState<string | null>(null);
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [spawnRequestedAt, setSpawnRequestedAt] = useState<number | null>(null);
  const [recentSpeech, setRecentSpeech] = useState<{ from: string; to: string; text: string } | null>(null);
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
    sendAgentMessage,
    syncWorkspace,
    syncReport,
    recentMessages,
    agentOutputs,
    promptResult,
    spawnResult,
    clearResults,
  } = useHerdrWebSocket();

  const isSpawning = Boolean(spawnRequestedAt && !spawnResult);

  const selectedAgent = agents.find((a) => a.paneId === selectedPaneId) ?? null;

  // Handle spawn result
  useEffect(() => {
    if (spawnResult) {
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
        console.error('Failed to load modern office assets:', err);
        setLoadError(String(err));
      });
  }, []);

  const handleAgentSpoke = useCallback((fromName: string, toName: string, text: string) => {
    setRecentSpeech({ from: fromName, to: toName, text });
    setTimeout(() => setRecentSpeech(null), 5000);
  }, []);

  // Initialize Canvas 2D engine
  useEffect(() => {
    if (!canvasRef.current || !assets) return;

    const engine = new OfficeCanvasEngine({
      canvas: canvasRef.current,
      assets,
      scale,
      onSelectAgent: (agent) => setSelectedPaneId(agent ? agent.paneId : null),
      onAgentSpoke: handleAgentSpoke,
    });

    engine.setAgents(agents);
    engine.start();
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, handleAgentSpoke]);

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
    setSpawnRequestedAt(Date.now());
    spawnAgent(data);
  };

  const handleSendAgentMessage = (fromPaneId: string, toPaneId: string, text: string) => {
    // 1. Deliver real inter-agent message via Herdr backend
    sendAgentMessage({ fromPaneId, toPaneId, message: text, taskType: 'delegate' });

    // 2. Animate agent delivering message on canvas
    if (engineRef.current) {
      engineRef.current.sendAgentMessage(fromPaneId, toPaneId, text);
    }
  };

  const handleOpenStandup = () => {
    setIsSyncModalOpen(true);
    syncWorkspace({ action: 'standup' });
    if (engineRef.current) {
      engineRef.current.setMeetingActive(true);
    }
  };

  const handleCloseStandup = () => {
    setIsSyncModalOpen(false);
    if (engineRef.current) {
      engineRef.current.setMeetingActive(false);
    }
  };

  const handleBroadcastGoal = (goal: string) => {
    syncWorkspace({ action: 'broadcast', goal });
  };

  if (loadError) {
    return (
      <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>
        <h2>Error Loading Office Assets</h2>
        <p>{loadError}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#04060d',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Navbar Styled in Modern Tech Slate Banner */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 18px',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1.5px solid #334155',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🏢</span>
          <div>
            <h1
              style={{
                fontSize: '1.05rem',
                margin: 0,
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              HERDR OFFICE
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background: '#1e3a8a',
                  color: '#60a5fa',
                  border: '1px solid #3b82f6',
                  fontWeight: 700,
                }}
              >
                2.5D SIMULATION
              </span>
            </h1>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: connected ? (herdrConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)') : 'rgba(239, 68, 68, 0.2)',
              color: connected ? (herdrConnected ? '#34d399' : '#fbbf24') : '#f87171',
              border: `1px solid ${connected ? (herdrConnected ? '#10b981' : '#ca8a04') : '#dc2626'}`,
            }}
          >
            {connected ? (herdrConnected ? 'TEAM SYNCED' : 'HERDR IDLE') : 'OFFLINE'}
          </span>
        </div>

        {/* Quick Party Member Task Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', maxWidth: '45vw', padding: '2px 4px' }}>
          {agents.map((a) => {
            const isSelected = a.paneId === selectedPaneId;
            const statusColor =
              a.status === 'working'
                ? '#34d399'
                : a.status === 'blocked'
                  ? '#ef4444'
                  : a.status === 'done'
                    ? '#fbbf24'
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
                  borderRadius: '3px',
                  border: `1.5px solid ${isSelected ? '#fbbf24' : 'rgba(255,255,255,0.25)'}`,
                  background: isSelected ? 'rgba(12, 34, 156, 0.6)' : 'rgba(2, 6, 32, 0.6)',
                  color: '#f8fafc',
                  fontSize: '0.74rem',
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
                    boxShadow: `0 0 6px ${statusColor}`,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontWeight: 700, color: isSelected ? '#38bdf8' : '#ffffff' }}>{a.name || a.agent}</span>
                {a.status === 'working' && (
                  <span style={{ color: '#38bdf8', fontSize: '0.68rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.currentTask ? `• ${a.currentTask}` : '• Coding'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Controls: Standup / Sync All, Spawn Agent, Scale, Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenStandup}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              background: 'linear-gradient(180deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: '1px solid #10b981',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
            }}
          >
            <span>🤝</span>
            <span>All-Hands Standup</span>
          </button>

          <button
            onClick={() => setIsSpawnModalOpen(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: '1px solid #3b82f6',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
            }}
          >
            <span>+</span>
            <span>Spawn Agent</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginRight: '2px' }}>Scale:</span>
            {[1, 1.25, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: scale === s ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                  color: scale === s ? '#000000' : '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
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
              padding: '4px 8px',
              borderRadius: '3px',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              fontSize: '0.75rem',
              fontWeight: 600,
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
          overflow: 'auto',
          background: '#080d1a',
          position: 'relative',
          padding: '16px',
        }}
      >
        {!assets ? (
          <div style={{ margin: 'auto', color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⠋</span>
            Loading 2.5D simulation assets...
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              margin: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 24px rgba(56, 189, 248, 0.12)',
              borderRadius: '6px',
              border: '1px solid #1e293b',
              imageRendering: 'pixelated',
              cursor: 'pointer',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        )}

        {/* Live Conversation Floating Banner */}
        {recentSpeech && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, #0c229c 0%, #020630 100%)',
              border: '2px solid #ffffff',
              borderRadius: '4px',
              padding: '10px 18px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '560px',
              zIndex: 50,
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>💬</span>
            <div style={{ fontSize: '0.84rem', color: '#ffffff' }}>
              <strong style={{ color: '#fbbf24' }}>{recentSpeech.from}</strong> spoke to{' '}
              <strong style={{ color: '#67e8f9' }}>{recentSpeech.to}</strong>:
              <div style={{ fontStyle: 'italic', marginTop: '2px', color: '#e2e8f0' }}>"{recentSpeech.text}"</div>
            </div>
          </div>
        )}

        {/* Selected Agent Drawer */}
        <AgentDrawer
          agent={selectedAgent}
          allAgents={agents}
          onClose={() => setSelectedPaneId(null)}
          onFocusPane={focusPane}
          onPromptAgent={promptAgent}
          onInterruptAgent={interruptAgent}
          onFetchOutput={fetchAgentOutput}
          onSendAgentMessage={handleSendAgentMessage}
          terminalOutput={selectedPaneId ? agentOutputs[selectedPaneId] : undefined}
          promptResult={promptResult}
        />

        {/* Spawn Agent Modal */}
        <SpawnAgentModal
          isOpen={isSpawnModalOpen}
          onClose={() => setIsSpawnModalOpen(false)}
          onSpawn={handleSpawnSubmit}
          isSpawning={isSpawning}
          spawnError={spawnResult && !spawnResult.success ? spawnResult.error : null}
        />

        {/* All-Hands Standup & Sync Modal */}
        <WorkspaceSyncModal
          isOpen={isSyncModalOpen}
          onClose={handleCloseStandup}
          agents={agents}
          syncReport={syncReport}
          recentMessages={recentMessages}
          onBroadcastGoal={handleBroadcastGoal}
          onRefreshSync={() => syncWorkspace({ action: 'standup' })}
          onDelegateMessage={handleSendAgentMessage}
          onFocusPane={focusPane}
        />
      </main>
    </div>
  );
};
