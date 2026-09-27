# Herdr Office: System Architecture

`herdr-office` is a visual, animated pixel-art office simulator and agent orchestrator built on top of [Herdr](https://herdr.dev). Each active AI agent running inside a Herdr workspace/pane is embodied as an animated pixel-art character sitting at a desk, typing while active, reading while searching/planning, and displaying status bubbles when blocked or finished.

---

## 1. High-Level Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Herdr Environment                    │
│                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │   Agent Pane (pi)     │  │  Agent Pane (claude)  │  │
│  │   status: "working"   │  │   status: "blocked"   │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  │
│              │                          │              │
│              └────────────┬─────────────┘              │
│                           ▼                            │
│                 Herdr Unix Domain Socket               │
│               (/path/to/herdr.sock / CLI)              │
└───────────────────────────┬────────────────────────────┘
                            │
               Polling / Socket Event Stream
                            ▼
┌────────────────────────────────────────────────────────┐
│             herdr-office Backend Server                │
│                 (Node.js + TypeScript)                 │
│                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │   Herdr Connector     │  │   State Synchronizer  │  │
│  │  (CLI & Socket query) │─▶│   (Diff & Lifecycle)  │  │
│  └───────────────────────┘  └───────────┬───────────┘  │
│                                         ▼              │
│                             WebSocket Event Server     │
│                              (ws://localhost:4000)     │
└─────────────────────────────────────────┬──────────────┘
                                          │
                        WebSocket (JSON Event Stream)
                                          ▼
┌────────────────────────────────────────────────────────┐
│             herdr-office Frontend Client               │
│             (React 19 + TypeScript + Vite)             │
│                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │  WebSocket Client Hook│─▶│   Agent State Store   │  │
│  └───────────────────────┘  └───────────┬───────────┘  │
│                                         ▼              │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Canvas 2D Game & Office Engine        │  │
│  │  - Tilemap Layer (Floors, Walls, Rugs)           │  │
│  │  - Furniture Layer (Desks, Chairs, Monitors)     │  │
│  │  - Character State Machine (A*, Pathfinding)     │  │
│  │  - Speech Bubble & Notification Overlay          │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 Herdr Connector & State Poller (`server/src/herdr/`)
- Interacts with Herdr via either:
  1. `herdr.sock` UNIX domain socket JSON-RPC / API protocol.
  2. Fallback CLI execution (`herdr agent list`, `herdr pane list`, `herdr status`).
- Periodically polls or subscribes to Herdr agent states at configurable intervals (default: 500ms).
- Detects new agents appearing, status transitions, agent pane focus, and agent session termination.

### 2.2 Herdr Agent State Machine Mapping
Herdr reports five distinct agent states:
- `idle`: Agent has completed its turn and is waiting for user prompt.
- `working`: Agent is actively reading, editing, running commands, or generating tokens.
- `blocked`: Agent is waiting for user confirmation (e.g. tool approval, questionnaire, permission prompt).
- `done`: Agent finished its objective or task.
- `unknown`: Agent is running in a pane but its state is unclassified.

These map to visual behaviors in `herdr-office`:

| Herdr Status | Visual Character Behavior | Bubble / Indicator |
|---|---|---|
| `idle` | Sitting relaxed at desk, occasional blinking/stretching | None |
| `working` | Hunched forward, typing rapidly on keyboard; terminal screen glows | Code / Sparks animation |
| `blocked` | Hands off keyboard, looking around | Red exclamation or question bubble (`?` / `!`) |
| `done` | Triumphant pose / coffee sipping | Green checkmark (`✓`) |
| `unknown` | Sitting idle at desk | Gray ellipsis (`...`) |
| *New Agent* | Spawns at office entrance door, walks to assigned desk | Footsteps |
| *Terminated* | Stands up, walks to exit door, disappears | Wave / fade |

### 2.3 WebSocket Message Protocol (`client` ↔ `server`)
All messages are JSON objects adhering to the following schema:

```typescript
export type AgentStatus = 'idle' | 'working' | 'blocked' | 'done' | 'unknown';

export interface HerdrAgentInfo {
  paneId: string;
  agent: string;          // e.g. "pi", "claude", "codex"
  status: AgentStatus;
  cwd: string;
  focused: boolean;
  workspaceId: string;
  tabId: string;
  terminalTitle: string;
}

export type ServerMessage =
  | { type: 'initial_state'; agents: HerdrAgentInfo[]; timestamp: number }
  | { type: 'agent_updated'; agent: HerdrAgentInfo; timestamp: number }
  | { type: 'agent_removed'; paneId: string; timestamp: number }
  | { type: 'status_error'; error: string; timestamp: number };

export type ClientMessage =
  | { type: 'focus_agent'; paneId: string }
  | { type: 'refresh_state' };
```

---

## 3. Canvas 2D Office Engine (`client/src/engine/`)

### 3.1 Rendering Pipeline
The frontend uses standard HTML5 Canvas 2D with `imageRendering: pixelated` for crisp retro rendering:
1. **Background Layer**: Office floor tiles (16×16 standard grid, scaled by 2× or 3×).
2. **Structure Layer**: Office walls, windows, doors, dividers.
3. **Furniture Layer (Back)**: Desks, chairs, side tables, monitors facing away.
4. **Entity Layer (Y-Sorted)**: Characters and walking agents, sorted by `Y` position for natural isometric depth overlap.
5. **Furniture Layer (Front)**: Foreground desk edges, coffee cups, foreground monitors.
6. **Overlay Layer**: Speech bubbles, status icons, name tags (`π - arch`), selection highlights.

### 3.2 Pathfinding & Desk Assignment
- The office grid is divided into cells: `walkable`, `blocked`, and `interaction` (e.g., chair cell).
- When a new Herdr agent is detected, an available desk/chair is assigned to the agent.
- A* (A-Star) pathfinding finds the shortest path from the office entrance to the assigned chair.
- While walking, the character executes the directional 4-frame walk cycle.
- Once seated, the character enters the state determined by `agent_status`.

---

## 4. Technology Stack Justification
- **Frontend**: React 19 + Vite + Canvas 2D. No heavy 3D engine needed; 2D canvas gives 60+ FPS performance with minimal CPU and memory overhead.
- **Backend**: Node.js + TypeScript + `ws`. Lightweight daemon with zero native binary compilation required, easily runnable on any developer machine alongside Herdr.
- **Inter-process Communication**: Non-invasive CLI/socket inspection to prevent interfering with running coding sessions.
