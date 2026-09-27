# 🏢 Herdr Office

> **A playful, retro pixel-art office simulator and agent orchestrator for [Herdr](https://herdr.dev).**

Turn your AI coding agents running in Herdr workspaces and panes into animated pixel-art characters working in a retro office. Watch them walk to their desks, type when running commands or editing code, read when searching, and raise alert bubbles when blocked or awaiting input.

Inspired by [pixel-agents](https://github.com/pixel-agents-hq/pixel-agents), tailored specifically for **Herdr** multi-agent terminal sessions with 100% custom pixel art.

---

## ✨ Features

- **Live Herdr Agent Tracking**: Automatically discovers active agents in Herdr panes (`pi`, `claude`, `codex`, etc.).
- **Dynamic Character Animation**: Characters walk to desks, type when `working`, relax when `idle`, and raise visual alerts when `blocked`.
- **Custom Pixel Art Engine**: Pure HTML5 Canvas 2D rendering at retro 16×16 tile resolution with integer scaling.
- **WebSocket Streaming**: Lightweight backend synchronizer that streams agent state diffs in real-time.
- **Modular & Extensible**: Fully documented asset pipeline and manifest format for easy custom sprite additions.

---

## 🏗️ Architecture & Documentation

- [System Architecture](docs/ARCHITECTURE.md) — Component breakdown, state machine mapping, and communication protocols.
- [Custom Artwork Pipeline](docs/ART_PIPELINE.md) — Sprite specifications, grid standards, animation sequences, and manifest format.
- [Divide-and-Conquer Roadmap](docs/ROADMAP.md) — Planned milestones and parallel development tracks.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- [Herdr](https://herdr.dev) running with active agent sessions

### Running the App

```bash
# Clone the repository
git clone https://github.com/unrealandychan/herdr-office.git
cd herdr-office

# Install dependencies
npm install

# Start both backend server and frontend client concurrently
npm run dev
```

- Web UI will be live at: `http://localhost:5173`
- Backend WebSocket server runs at: `ws://localhost:4000`

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Run backend and frontend concurrently in development mode |
| `npm run build` | Typecheck and build production bundles for both client and server |
| `npm test` | Run unit tests for client and backend connector |
| `npm run test:e2e` | Run live end-to-end integration test against running Herdr session |
| `npm run lint` | Run linter across codebase |
| `npm run art:generate` | Procedurally regenerate pixel art tiles, spritesheets, and manifest |

---

## 🗺️ Divide-and-Conquer Issues & Milestones

The roadmap is tracked via GitHub Issues on [`unrealandychan/herdr-office`](https://github.com/unrealandychan/herdr-office/issues):
- **Art Track**: #1 (Tileset), #2 (Character spritesheet), #3 (Furniture pack), #4 (Palette generator)
- **Backend Track**: #5 (Herdr CLI/socket poller), #6 (WebSocket synchronizer), #7 (Agent control API)
- **Engine Track**: #8 (Canvas 2D renderer), #9 (Y-sort entity state machine), #10 (A* pathfinding)
- **UI Track**: #11 (Speech bubbles & alerts), #12 (Agent inspector drawer)

---

## 📜 License

MIT License.
