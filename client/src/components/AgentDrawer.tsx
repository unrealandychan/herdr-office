import React, { useState, useEffect } from 'react';
import type { HerdrAgent } from '../types';

interface AgentDrawerProps {
  agent: HerdrAgent | null;
  onClose: () => void;
  onFocusPane: (paneId: string) => void;
  onPromptAgent: (paneId: string, prompt: string) => void;
  onInterruptAgent: (paneId: string) => void;
  onFetchOutput: (paneId: string) => void;
  terminalOutput?: string;
  promptResult: { paneId: string; success: boolean; message?: string } | null;
}

export const AgentDrawer: React.FC<AgentDrawerProps> = ({
  agent,
  onClose,
  onFocusPane,
  onPromptAgent,
  onInterruptAgent,
  onFetchOutput,
  terminalOutput,
  promptResult,
}) => {
  const [prevPaneId, setPrevPaneId] = useState<string | null>(null);
  const [steerPrompt, setSteerPrompt] = useState('');
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'steer' | 'terminal'>('steer');

  const isSending = Boolean(sentAt && (!promptResult || promptResult.paneId !== agent?.paneId));

  // Reset state when active agent switches
  if (agent && agent.paneId !== prevPaneId) {
    setPrevPaneId(agent.paneId);
    setSteerPrompt('');
    setSentAt(null);
  }

  // Fetch output when agent changes or when prompt succeeds
  useEffect(() => {
    if (agent?.paneId) {
      onFetchOutput(agent.paneId);
    }
  }, [agent?.paneId, onFetchOutput, promptResult]);

  if (!agent) return null;

  const statusColors: Record<string, string> = {
    working: '#10b981',
    idle: '#60a5fa',
    blocked: '#ef4444',
    done: '#8b5cf6',
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

  return (
    <aside
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '420px',
        maxWidth: '90vw',
        background: '#141417',
        borderLeft: '1px solid #27272a',
        padding: '20px',
        color: '#f4f4f5',
        boxShadow: '-6px 0 24px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
      }}
    >
      {/* Drawer Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: statusColors[agent.status] || '#9ca3af',
            }}
          />
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
            {agent.name || agent.agent}
          </h3>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              background: '#27272a',
              color: statusColors[agent.status] || '#9ca3af',
              textTransform: 'uppercase',
              fontWeight: 700,
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
            color: '#a1a1aa',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* 1. CURRENT ASSIGNED PROMPT & TASK */}
      <div
        style={{
          background: '#1c1c21',
          border: '1px solid #2e2e36',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Current Assigned Prompt / Task
          </span>
          {agent.currentPrompt && (
            <button
              onClick={handleCopyPrompt}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {copiedPrompt ? '✓ Copied' : '📋 Copy'}
            </button>
          )}
        </div>

        <div
          style={{
            fontSize: '0.85rem',
            color: '#e4e4e7',
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            maxHeight: '120px',
            overflowY: 'auto',
            background: '#121215',
            padding: '8px 10px',
            borderRadius: '5px',
            border: '1px solid #27272a',
            fontFamily: agent.currentPrompt ? 'system-ui, sans-serif' : 'monospace',
          }}
        >
          {agent.currentPrompt || 'No initial prompt detected for this session yet.'}
        </div>

        {/* Live Active Activity / Thought */}
        {agent.currentTask && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.8rem' }}>💭</span>
            <div style={{ fontSize: '0.78rem', color: '#38bdf8', lineHeight: 1.4 }}>
              <strong>In Progress:</strong> {agent.currentTask}
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Steer Agent vs Live Terminal */}
      <div style={{ display: 'flex', borderBottom: '1px solid #27272a', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('steer')}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'steer' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'steer' ? '#fff' : '#a1a1aa',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          🎯 Steer Working Agent
        </button>
        <button
          onClick={() => {
            setActiveTab('terminal');
            onFetchOutput(agent.paneId);
          }}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'terminal' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'terminal' ? '#fff' : '#a1a1aa',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          💻 Terminal Output
        </button>
      </div>

      {/* TAB CONTENT: STEER AGENT */}
      {activeTab === 'steer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#a1a1aa', marginBottom: '6px' }}>
              Prompt instruction or guidance to steer this agent:
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
              placeholder="e.g. Focus on fixing the tests first, or stop here and explain..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                background: '#09090b',
                border: '1px solid #3f3f46',
                color: '#fafafa',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Quick Action Steering Chips */}
          <div>
            <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block', marginBottom: '6px' }}>
              Quick Steering Commands:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickSteer('Continue with the current task and report findings.')}
                disabled={isSending}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: '#27272a',
                  color: '#e4e4e7',
                  border: '1px solid #3f3f46',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                ▶️ Continue
              </button>
              <button
                type="button"
                onClick={() => handleQuickSteer('Please pause and summarize your progress and next steps.')}
                disabled={isSending}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: '#27272a',
                  color: '#e4e4e7',
                  border: '1px solid #3f3f46',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                📋 Summarize Status
              </button>
              <button
                type="button"
                onClick={() => onInterruptAgent(agent.paneId)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid #dc2626',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                🛑 Interrupt (Ctrl+C)
              </button>
            </div>
          </div>

          {/* Steer Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Ctrl + Enter to send</span>
            <button
              onClick={() => handleSendPrompt()}
              disabled={isSending || !steerPrompt.trim()}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                background: isSending ? '#2563eb' : steerPrompt.trim() ? '#3b82f6' : '#27272a',
                color: steerPrompt.trim() ? '#ffffff' : '#71717a',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: isSending ? 'wait' : steerPrompt.trim() ? 'pointer' : 'default',
              }}
            >
              {isSending ? 'Sending Prompt...' : 'Prompt / Steer Agent'}
            </button>
          </div>

          {promptResult && promptResult.paneId === agent.paneId && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: promptResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: promptResult.success ? '#34d399' : '#f87171',
                fontSize: '0.78rem',
                border: `1px solid ${promptResult.success ? '#059669' : '#dc2626'}`,
              }}
            >
              {promptResult.success ? '✓ Instruction sent to agent successfully!' : `⚠️ ${promptResult.message}`}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TERMINAL LOGS */}
      {activeTab === 'terminal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>Recent Terminal Stream</span>
            <button
              onClick={() => onFetchOutput(agent.paneId)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: '#27272a',
                color: '#e4e4e7',
                border: '1px solid #3f3f46',
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
              maxHeight: '300px',
              overflowY: 'auto',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '0.72rem',
              lineHeight: 1.35,
              color: '#d4d4d8',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}
          >
            {terminalOutput || 'Loading terminal output...'}
          </pre>
        </div>
      )}

      {/* Agent Technical Metadata */}
      <div
        style={{
          marginTop: 'auto',
          fontSize: '0.78rem',
          color: '#71717a',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          borderTop: '1px solid #27272a',
          paddingTop: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Pane: <code style={{ color: '#e4e4e7', background: '#27272a', padding: '1px 4px', borderRadius: '3px' }}>{agent.paneId}</code></span>
          <span>Tab: <code style={{ color: '#e4e4e7', background: '#27272a', padding: '1px 4px', borderRadius: '3px' }}>{agent.tabId}</code></span>
        </div>
        <div style={{ wordBreak: 'break-all' }}>
          <span>Path: </span>
          <span style={{ color: '#a1a1aa' }}>{agent.cwd}</span>
        </div>

        <button
          onClick={() => onFocusPane(agent.paneId)}
          style={{
            marginTop: '8px',
            padding: '10px 16px',
            background: '#27272a',
            color: '#ffffff',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Focus in Herdr Multiplexer
        </button>
      </div>
    </aside>
  );
};
