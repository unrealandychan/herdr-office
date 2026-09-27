import React, { useState } from 'react';
import type { AgentMessageEvent, HerdrAgent, WorkspaceSyncReport } from '../types';

interface WorkspaceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: HerdrAgent[];
  syncReport: WorkspaceSyncReport | null;
  recentMessages: AgentMessageEvent[];
  onBroadcastGoal: (goal: string) => void;
  onRefreshSync: () => void;
  onDelegateMessage: (fromPaneId: string, toPaneId: string, message: string) => void;
  onFocusPane: (paneId: string) => void;
}

export const WorkspaceSyncModal: React.FC<WorkspaceSyncModalProps> = ({
  isOpen,
  onClose,
  agents,
  syncReport,
  recentMessages,
  onBroadcastGoal,
  onRefreshSync,
  onFocusPane,
}) => {
  const [goalText, setGoalText] = useState(syncReport?.activeGoal || '');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'standup' | 'log'>('standup');

  if (!isOpen) return null;

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) return;
    onBroadcastGoal(goalText.trim());
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const statusColors = {
    working: '#10b981',
    idle: '#38bdf8',
    blocked: '#ef4444',
    done: '#fbbf24',
    unknown: '#94a3b8',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          border: '1.5px solid #334155',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🤝</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                All-Hands Workspace Sync & Standup
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Organize, synchronize, and broadcast unified missions across all active Herdr coding agents.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onRefreshSync}
              title="Refresh Standup Sync"
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ↻ Refresh
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1.4rem',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Workspace Goal Broadcast Banner */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <form onSubmit={handleBroadcast} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="Broadcast a unified mission/goal to all agents (e.g. 'Align types and run integration tests')..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: '#020617',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                backgroundColor: broadcastSent ? '#059669' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.2s',
              }}
            >
              {broadcastSent ? '✓ Broadcasted!' : '📢 Broadcast Goal'}
            </button>
          </form>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', backgroundColor: '#090d16' }}>
          <button
            onClick={() => setActiveTab('standup')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'standup' ? '2px solid #3b82f6' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === 'standup' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📋 Standup Board ({agents.length} Agents)
          </button>
          <button
            onClick={() => setActiveTab('log')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'log' ? '2px solid #3b82f6' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === 'log' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            💬 Real Inter-Agent Dispatch Log ({recentMessages.length})
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'standup' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {agents.map((agent) => {
                const syncInfo = syncReport?.agents.find((s) => s.paneId === agent.paneId);
                const currentTask = syncInfo?.currentTask || agent.currentTask || agent.currentPrompt;
                const statusColor = statusColors[agent.status] || '#94a3b8';

                return (
                  <div
                    key={agent.paneId}
                    style={{
                      backgroundColor: '#1e293b',
                      border: `1px solid ${agent.status === 'blocked' ? '#ef4444' : '#334155'}`,
                      borderRadius: '6px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                            boxShadow: `0 0 6px ${statusColor}`,
                          }}
                        />
                        <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                          {agent.name || agent.agent}
                        </strong>
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          color: statusColor,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {agent.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      Pane: <span style={{ color: '#cbd5e1' }}>{agent.paneId}</span> • Kind:{' '}
                      <span style={{ color: '#cbd5e1' }}>{agent.agent}</span>
                    </div>

                    {/* Active Task / Prompt */}
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: '0.74rem',
                        color: '#cbd5e1',
                        borderLeft: `2px solid ${statusColor}`,
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '2px', fontWeight: 600 }}>
                        CURRENT ACTIVITY
                      </div>
                      <div style={{ wordBreak: 'break-word', maxLines: 2 }}>
                        {currentTask || (agent.status === 'idle' ? 'Ready for next instruction' : 'Running command...')}
                      </div>
                    </div>

                    {/* Blocker alert if blocked */}
                    {syncInfo?.blockedReason && (
                      <div
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          fontSize: '0.72rem',
                          color: '#fca5a5',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        ⚠️ {syncInfo.blockedReason}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                      <button
                        onClick={() => onFocusPane(agent.paneId)}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          color: '#38bdf8',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Focus Terminal Pane
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.85rem' }}>
                  No inter-agent messages recorded yet. Select an agent to delegate a task or send instructions.
                </div>
              ) : (
                recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#1e293b',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>@{msg.fromName}</span>
                        <span>➔</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>@{msg.toName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            backgroundColor: msg.status === 'delivered' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: msg.status === 'delivered' ? '#34d399' : '#f87171',
                          }}
                        >
                          {msg.status.toUpperCase()}
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#f1f5f9', fontStyle: 'italic' }}>
                      "{msg.message}"
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#090d16',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Multi-Agent Synchronizer • Powered by Herdr Socket & CLI Integration
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '4px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close & Return to Desks
          </button>
        </div>
      </div>
    </div>
  );
};
