# Herdr Office: Divide-and-Conquer Roadmap

This roadmap breaks down the development of `herdr-office` into distinct, parallelizable milestones and tasks.

---

## Milestone 1: Foundation & Project Scaffolding (Current)
- [x] Create public repository `unrealandychan/herdr-office`
- [x] Initialize npm monorepo with `client` (React + Vite + TS) and `server` (Node + TS + ws)
- [x] Document System Architecture (`docs/ARCHITECTURE.md`)
- [x] Document Custom Artwork Pipeline (`docs/ART_PIPELINE.md`)
- [ ] Publish divide-and-conquer GitHub issues on `unrealandychan/herdr-office`

---

## Milestone 2: Custom Pixel Art Assets Pipeline
- **Issue: Baseline Office Tileset Creation**
  - Implement floor tiles (wood, carpet, linoleum), wall boundaries, and office doors.
  - Export 16×16 tiles with metadata manifest.
- **Issue: Office Furniture Sprites**
  - Desks (monitors, keyboards, cable details).
  - Chairs with multi-angle rotation.
  - Breakroom accessories (coffee maker, plants, water cooler).
- **Issue: Animated Character Spritesheets**
  - Multi-direction walk cycle (down, up, left, right).
  - Typing animation (hands at keyboard with glowing monitor).
  - Idle breathing / thinking animation.
  - Status alert expressions (blocked question mark, task done celebration).
- **Issue: Character Palette Variations**
  - Generate distinct hair, clothing, and accessory colors to differentiate concurrent agents (e.g. Pi vs Claude vs Codex).

---

## Milestone 3: Herdr Integration & Real-Time Backend
- **Issue: Herdr CLI & Socket Connector**
  - Implement robust poller/listener targeting `herdr agent list` and `herdr pane list`.
  - Parse agent lifecycle statuses: `idle`, `working`, `blocked`, `done`, `unknown`.
- **Issue: WebSocket Event Streaming & Agent Registry**
  - Manage active agent registry with unique pane IDs.
  - Broadcast real-time delta events (`agent_added`, `agent_updated`, `agent_removed`) to connected UI clients.
- **Issue: Interactive Agent Control Bridge**
  - Allow web UI to send commands back (e.g., focus agent pane, prompt input).

---

## Milestone 4: Canvas 2D Pixel Office Engine
- **Issue: 2D Grid & Tilemap Renderer**
  - Implement pixel-perfect Canvas 2D tilemap renderer with zoom & pan support.
  - Depth sorting (Y-sorting) for furniture and characters.
- **Issue: Agent State Machine & Animation Controller**
  - Map agent backend status to visual animations (walking, typing, resting, blocked).
  - Smooth tile-to-tile movement interpolation.
- **Issue: A* Pathfinding & Seat Assignment**
  - Desk allocation engine: automatically assign vacant desks to new agents.
  - Pathfinding from office entrance to assigned chair.

---

## Milestone 5: UI Overlays, Status Indicators & Sound
- **Issue: Speech Bubbles & Agent Status Badges**
  - Render speech bubbles over characters when blocked or awaiting user confirmation.
  - Terminal title and tool activity tags above agents.
- **Issue: Agent Detail Modal & Quick Terminal View**
  - Clicking on a character opens a popover showing cwd, session id, logs, and current task.
- **Issue: Retro 8-bit Sound Effects**
  - Optional retro audio cues on task completion, agent arrival, or blocked alerts.

---

## Milestone 6: Office Layout Editor & Customization
- **Issue: In-Game Office Editor Mode**
  - Grid painter to place custom tiles, desks, and decor.
  - Export/import office layout JSON.
