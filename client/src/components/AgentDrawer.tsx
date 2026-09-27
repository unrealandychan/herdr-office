import React, { useState, useEffect } from 'react';
import type { HerdrAgent } from '../types';

interface AgentDrawerProps {
  agent: HerdrAgent | null;
  allAgents: HerdrAgent[];
  onClose: () => void;
  onFocusPane: (paneId: string) => void;
  onPromptAgent: (paneId: string, prompt: string) => void;
  onInterruptAgent: (paneId: string) => void;
  onFetchOutput: (paneId: string) => void;
  onSendAgentMessage?: (fromPaneId: string, toPaneId: string, text: string) => void;
  terminalOutput?: string;
  promptResult: { paneId: string; success: boolean; message?: string } | null;
}

export const AgentDrawer: React.FC<AgentDrawerProps> = ({
  agent,
  allAgents,
  onClose,
  onFocusPane,
  onPromptAgent,
  onInterruptAgent,
  onFetchOutput,
  onSendAgentMessage,
  terminalOutput,
  promptResult,
}) => {
  const [prevPaneId, setPrevPaneId] = useState<string | null>(null);
  const [steerPrompt, setSteerPrompt] = useState('');
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'steer' | 'collab' | 'terminal'>('steer');

  // Collab messaging state
  const otherAgents = allAgents.filter((a) => a.paneId !== agent?.paneId);
  const [recipientPaneId, setRecipientPaneId] = useState<string>(otherAgents[0]?.paneId || '');
  const [collabText, setCollabText] = useState('');
  const [msgSentNotice, setMsgSentNotice] = useState<string | null>(null);

  const isSending = Boolean(sentAt && (!promptResult || promptResult.paneId !== agent?.paneId));

  // Reset state when active agent switches
  if (agent && agent.paneId !== prevPaneId) {
    setPrevPaneId(agent.paneId);
    setSteerPrompt('');
    setSentAt(null);
    if (otherAgents.length > 0 && (!recipientPaneId || recipientPaneId === agent.paneId)) {
      setRecipientPaneId(otherAgents[0].paneId);
    }
  }

  // Fetch output when agent changes or when prompt succeeds
  useEffect(() => {
    if (agent?.paneId) {
      onFetchOutput(agent.paneId);
    }
  }, [agent?.paneId, onFetchOutput, promptResult]);

  if (!agent) return null;

  const statusColors: Record<string, string> = {
    working: '#34d399',
    idle: '#60a5fa',
    blocked: '#ef4444',
    done: '#fbbf24',
    unknown: '#9ca3af',
  };

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!steerPrompt.trim() || isSending) return;
    setSentAt(Date.now());
    onPromptAgent(agent.paneId, steerPrompt.trim());
  };

  const handleQuickSteer = (text: string) => {
    setSteerPrompt(text);
    setSentAt(Date.now());
    onPromptAgent(agent.paneId, text);
  };

  const handleCopyPrompt = () => {
    if (agent.currentPrompt) {
      navigator.clipboard.writeText(agent.currentPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleDispatchCollab = () => {
    if (!recipientPaneId || !onSendAgentMessage) return;
    const textToSend = collabText.trim() || 'Could you review my current pull request?';
    onSendAgentMessage(agent.paneId, recipientPaneId, textToSend);

    const partner = allAgents.find((a) => a.paneId === recipientPaneId);
    setMsgSentNotice(`Dispatched ${agent.name || agent.agent} to walk over and talk to ${partner?.name || partner?.agent}!`);
    setCollabText('');
    setTimeout(() => setMsgSentNotice(null), 4000);
  };

  return (
    <aside
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '430px',
        maxWidth: '92vw',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 60%, #020617 100%)',
        borderLeft: '1.5px solid #334155',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
        padding: '20px',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
      }}
    >
      {/* Header Styled like Modern Tech Drawer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.06)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: statusColors[agent.status] || '#9ca3af',
              boxShadow: `0 0 8px ${statusColors[agent.status] || '#9ca3af'}`,
            }}
          />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
            【 {agent.name?.toUpperCase() || agent.agent.toUpperCase()} 】
          </h3>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '0.72rem',
              background: '#040d3a',
              color: statusColors[agent.status] || '#9ca3af',
              textTransform: 'uppercase',
              fontWeight: 700,
              border: `1px solid ${statusColors[agent.status] || '#9ca3af'}`,
            }}
          >
            {agent.status}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#cbd5e1',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* 1. CURRENT ASSIGNED PROMPT & ACTIVE SPELLCRAFT */}
      <div
        style={{
          background: 'rgba(2, 6, 40, 0.7)',
          border: '1.5px solid #ffffff',
          borderRadius: '4px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📋 Assigned Task / User Prompt
          </span>
          {agent.currentPrompt && (
            <button
              onClick={handleCopyPrompt}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#93c5fd',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {copiedPrompt ? '✓ Copied' : '📋 Copy'}
            </button>
          )}
        </div>

        <div
          style={{
            fontSize: '0.84rem',
            color: '#f8fafc',
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            maxHeight: '110px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {agent.currentPrompt || 'No quest prompt assigned to this party member yet.'}
        </div>

        {/* Live Active Spell / Tool Call */}
        {agent.currentTask && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.85rem' }}>✨</span>
            <div style={{ fontSize: '0.8rem', color: '#67e8f9', lineHeight: 1.4 }}>
              <strong>Working on:</strong> {agent.currentTask}
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation Styled like Classic FF Menu */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid rgba(255,255,255,0.3)', gap: '4px' }}>
        <button
          onClick={() => setActiveTab('steer')}
          style={{
            padding: '8px 12px',
            background: activeTab === 'steer' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'steer' ? '2.5px solid #fbbf24' : '2.5px solid transparent',
            color: activeTab === 'steer' ? '#ffffff' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          🎯 Steer
        </button>

        <button
          onClick={() => setActiveTab('collab')}
          style={{
            padding: '8px 12px',
            background: activeTab === 'collab' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'collab' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            color: activeTab === 'collab' ? '#ffffff' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          💬 Delegate & Sync
        </button>

        <button
          onClick={() => {
            setActiveTab('terminal');
            onFetchOutput(agent.paneId);
          }}
          style={{
            padding: '8px 12px',
            background: activeTab === 'terminal' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'terminal' ? '2.5px solid #fbbf24' : '2.5px solid transparent',
            color: activeTab === 'terminal' ? '#ffffff' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          💻 Log
        </button>
      </div>

      {/* TAB 1: STEER AGENT */}
      {activeTab === 'steer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>
              Submit command or instruction to steer this active agent:
            </label>
            <textarea
              rows={4}
              value={steerPrompt}
              onChange={(e) => setSteerPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  handleSendPrompt();
                }
              }}
              placeholder="e.g. Focus on unit tests first, or explain current approach..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Quick Action Commands */}
          <div>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Command Shortcuts:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickSteer('Continue with current task.')}
                disabled={isSending}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                }}
              >
                ▶️ Continue
              </button>
              <button
                type="button"
                onClick={() => handleQuickSteer('Please pause and summarize progress.')}
                disabled={isSending}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                }}
              >
                📋 Summarize
              </button>
              <button
                type="button"
                onClick={() => onInterruptAgent(agent.paneId)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  border: '1px solid #ef4444',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                }}
              >
                🛑 Interrupt (Ctrl+C)
              </button>
            </div>
          </div>

          {/* Submit Steer Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Ctrl + Enter to send</span>
            <button
              onClick={() => handleSendPrompt()}
              disabled={isSending || !steerPrompt.trim()}
              style={{
                padding: '8px 18px',
                borderRadius: '4px',
                background: isSending ? '#1d4ed8' : steerPrompt.trim() ? '#2563eb' : 'rgba(255,255,255,0.1)',
                color: steerPrompt.trim() ? '#ffffff' : '#94a3b8',
                border: '1px solid #ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isSending ? 'wait' : steerPrompt.trim() ? 'pointer' : 'default',
              }}
            >
              {isSending ? 'Transmitting...' : 'Steer Agent'}
            </button>
          </div>

          {promptResult && promptResult.paneId === agent.paneId && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                background: promptResult.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: promptResult.success ? '#6ee7b7' : '#fca5a5',
                fontSize: '0.78rem',
                border: `1px solid ${promptResult.success ? '#10b981' : '#ef4444'}`,
              }}
            >
              {promptResult.success ? '✓ Command delivered to agent terminal!' : `⚠️ ${promptResult.message}`}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DELEGATE & SYNC WITH COLLEAGUE AGENT */}
      {activeTab === 'collab' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>
              Choose Colleague Agent to Dispatch Message:
            </label>
            {otherAgents.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: '#fbbf24', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                No other agents in the office right now. Spawn another agent via the top bar to collaborate!
              </div>
            ) : (
              <select
                value={recipientPaneId}
                onChange={(e) => setRecipientPaneId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                {otherAgents.map((a) => (
                  <option key={a.paneId} value={a.paneId}>
                    {a.name || a.agent} ({a.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>
              Real Prompt / Task to Deliver to Colleague:
            </label>
            <input
              type="text"
              value={collabText}
              onChange={(e) => setCollabText(e.target.value)}
              placeholder="e.g. Can you review the latest diff, or run tests?"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '4px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Quick preset dialogue chips */}
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Quick Delegation Presets:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                'Can you inspect my recent commits and run tests?',
                'All unit tests pass! Ready to deploy.',
                'Let us coordinate our tasks for the next release.',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCollabText(preset)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '0.73rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDispatchCollab}
            disabled={!recipientPaneId}
            style={{
              padding: '10px 16px',
              borderRadius: '4px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: recipientPaneId ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
            }}
          >
            <span>🚶</span>
            <span>Dispatch & Deliver via Herdr</span>
          </button>

          {msgSentNotice && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontSize: '0.78rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ✓ {msgSentNotice}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TERMINAL LOGS */}
      {activeTab === 'terminal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#93c5fd' }}>Terminal Stream Preview</span>
            <button
              onClick={() => onFetchOutput(agent.paneId)}
              style={{
                padding: '4px 8px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              ↻ Refresh
            </button>
          </div>
          <pre
            style={{
              flex: 1,
              minHeight: '200px',
              maxHeight: '280px',
              overflowY: 'auto',
              background: '#020412',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '10px',
              fontSize: '0.72rem',
              lineHeight: 1.35,
              color: '#e2e8f0',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}
          >
            {terminalOutput || 'Loading terminal stream...'}
          </pre>
        </div>
      )}

      {/* Bottom Technical Status */}
      <div
        style={{
          marginTop: 'auto',
          fontSize: '0.78rem',
          color: '#94a3b8',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          paddingTop: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Pane: <code style={{ color: '#fff', background: '#020626', padding: '1px 4px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.2)' }}>{agent.paneId}</code></span>
          <span>Tab: <code style={{ color: '#fff', background: '#020626', padding: '1px 4px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.2)' }}>{agent.tabId}</code></span>
        </div>

        <button
          onClick={() => onFocusPane(agent.paneId)}
          style={{
            marginTop: '6px',
            padding: '9px 16px',
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            border: '1.5px solid #ffffff',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          Focus in Herdr Multiplexer
        </button>
      </div>
    </aside>
  );
};
