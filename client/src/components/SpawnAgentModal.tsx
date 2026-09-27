import React, { useState } from 'react';

interface SpawnAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpawn: (data: { name: string; kind: string; initialPrompt?: string; cwd?: string }) => void;
  isSpawning: boolean;
  spawnError?: string | null;
}

const AGENT_KINDS = [
  { id: 'pi', label: 'Pi Agent (Default)', badge: 'π', desc: 'Minimal coding agent with harness & extensions' },
  { id: 'claude', label: 'Claude Code', badge: 'C', desc: 'Anthropic Claude Code CLI' },
  { id: 'codex', label: 'Codex / OpenAI', badge: 'Ω', desc: 'OpenAI Codex / GPT coding assistant' },
  { id: 'gemini', label: 'Gemini CLI', badge: 'G', desc: 'Google Gemini coding model' },
  { id: 'cursor', label: 'Cursor Agent', badge: '⚡', desc: 'Cursor command line orchestrator' },
];

export const SpawnAgentModal: React.FC<SpawnAgentModalProps> = ({
  isOpen,
  onClose,
  onSpawn,
  isSpawning,
  spawnError,
}) => {
  const [kind, setKind] = useState('pi'); // Default is Pi Agent!
  const [name, setName] = useState(() => `pi-worker-${Date.now().toString().slice(-4)}`);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [cwd, setCwd] = useState('');

  if (!isOpen) return null;

  const handleKindChange = (newKind: string) => {
    setKind(newKind);
    setName((prev) => {
      const suffix = prev.replace(/^[a-z]+-worker-/, '');
      return `${newKind}-worker-${suffix || '1'}`;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSpawn({
      name: name.trim().toLowerCase(),
      kind,
      initialPrompt: initialPrompt.trim() ? initialPrompt.trim() : undefined,
      cwd: cwd.trim() ? cwd.trim() : undefined,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSpawning) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: '10px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#f4f4f5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #27272a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#202024',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>✨</span>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Spawn New Agent</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSpawning}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '1.2rem',
              cursor: isSpawning ? 'not-allowed' : 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {spawnError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}
            >
              ⚠️ {spawnError}
            </div>
          )}

          {/* Select Agent Kind */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '8px' }}>
              Agent Type (Default: Pi Agent)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {AGENT_KINDS.map((k) => {
                const isSelected = kind === k.id;
                return (
                  <button
                    type="button"
                    key={k.id}
                    onClick={() => handleKindChange(k.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isSelected ? '#3b82f6' : '#27272a'}`,
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : '#1f1f23',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '4px',
                          background: isSelected ? '#3b82f6' : '#3f3f46',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                        }}
                      >
                        {k.badge}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isSelected ? '#fff' : '#d4d4d8' }}>
                        {k.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>{k.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Unique Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
              Agent Identifier Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. pi-worker-1"
              required
              pattern="[a-z][a-z0-9_-]{0,31}"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                background: '#09090b',
                border: '1px solid #3f3f46',
                color: '#fafafa',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px', display: 'block' }}>
              Must start with letter, lowercase alphanumeric, dashes or underscores (1-32 chars).
            </span>
          </div>

          {/* Optional Initial Task / Prompt */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
              Initial Prompt / Task (Optional)
            </label>
            <textarea
              rows={3}
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="e.g. Review the codebase and list all pending improvements..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                background: '#09090b',
                border: '1px solid #3f3f46',
                color: '#fafafa',
                fontSize: '0.88rem',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Optional Working Directory */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
              Working Directory (Leave empty for project root)
            </label>
            <input
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="e.g. /home/arch/projects/herdr-office"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#09090b',
                border: '1px solid #3f3f46',
                color: '#fafafa',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSpawning}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#27272a',
                color: '#e4e4e7',
                border: '1px solid #3f3f46',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: isSpawning ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSpawning}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                background: isSpawning ? '#2563eb' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: isSpawning ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSpawning ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⠋</span>
                  Launching {kind.toUpperCase()}...
                </>
              ) : (
                `Launch ${kind.toUpperCase()} Agent`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
