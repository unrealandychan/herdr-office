import React from 'react';
import type { HerdrAgent } from '../types';

interface AgentDrawerProps {
  agent: HerdrAgent | null;
  onClose: () => void;
  onFocusPane: (paneId: string) => void;
}

export const AgentDrawer: React.FC<AgentDrawerProps> = ({
  agent,
  onClose,
  onFocusPane,
}) => {
  if (!agent) return null;

  const statusColors: Record<string, string> = {
    working: '#10b981',
    idle: '#60a5fa',
    blocked: '#ef4444',
    done: '#8b5cf6',
    unknown: '#9ca3af',
  };

  return (
    <aside
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '320px',
        background: '#18181b',
        borderLeft: '1px solid #27272a',
        padding: '20px',
        color: '#f4f4f5',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Agent Details</h3>
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
        <span style={{ fontWeight: 600, fontSize: '1rem', textTransform: 'capitalize' }}>
          {agent.agent}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            background: '#27272a',
            color: statusColors[agent.status] || '#9ca3af',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {agent.status}
        </span>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <span style={{ color: '#71717a' }}>Pane ID: </span>
          <code style={{ color: '#e4e4e7', background: '#27272a', padding: '2px 4px', borderRadius: '3px' }}>
            {agent.paneId}
          </code>
        </div>
        <div>
          <span style={{ color: '#71717a' }}>Terminal: </span>
          <span>{agent.terminalTitle}</span>
        </div>
        <div>
          <span style={{ color: '#71717a' }}>Working Dir: </span>
          <span style={{ wordBreak: 'break-all' }}>{agent.cwd}</span>
        </div>
        {agent.sessionPath && (
          <div>
            <span style={{ color: '#71717a' }}>Session: </span>
            <span style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{agent.sessionPath}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => onFocusPane(agent.paneId)}
          style={{
            padding: '10px 16px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseOver={(e) => ((e.target as HTMLElement).style.background = '#2563eb')}
          onMouseOut={(e) => ((e.target as HTMLElement).style.background = '#3b82f6')}
        >
          Focus in Herdr
        </button>
      </div>
    </aside>
  );
};
