# Herdr Office: Custom Artwork Pipeline Specification

This document details the visual style, specifications, sprite sheets, tile grids, and asset pipeline for `herdr-office`. All visual assets are designed to be custom, modular, and loadable via JSON manifests.

---

## 1. Visual Style & Pixel Art Standards

- **Perspective**: 2.5D Top-Down Orthogonal (3/4 angle, standard classic RPG perspective).
- **Base Tile Grid**: **16 × 16 pixels** per floor tile.
- **Render Scale**: Rendered at **2×** (32×32 screen pixels) or **3×** (48×48 screen pixels) with CSS `image-rendering: pixelated;` to preserve crisp edges without bilinear smoothing.
- **Color Palette**: Curated retro color palette inspired by 16-bit palettes (e.g., Pico-8 / Endesga 32 / Solarized Warm), maintaining clear contrast between background floors, desks, and characters.

---

## 2. Character Sprite Specifications

### 2.1 Dimensions & Alignment
- **Frame Size**: **16 pixels wide × 24 pixels tall** (or 16 × 32 with top headgear/accessories).
- **Collision Box / Ground Footprint**: 16 × 16 pixels at the base.
- **Anchor Point (Origin)**: `(8, 20)` (feet center for depth sorting and pathfinding).

### 2.2 Directional Orientations
Characters support 4 directions:
1. `down` (facing camera / south)
2. `up` (facing away / north, typical when working at a north-facing desk)
3. `left` (facing west)
4. `right` (facing east)

### 2.3 Animation Sequences & Frames

| Animation | Frame Count | Frame Duration | Description |
|---|---|---|---|
| `idle_down` | 2 frames | 600ms | Gentle breathing / eye blink |
| `idle_up` | 2 frames | 600ms | Resting shoulders while facing desk |
| `walk_down` | 4 frames | 150ms | 4-step walk cycle facing down |
| `walk_up` | 4 frames | 150ms | 4-step walk cycle facing up |
| `walk_left` | 4 frames | 150ms | 4-step walk cycle facing left |
| `walk_right` | 4 frames | 150ms | 4-step walk cycle facing right |
| `type_up` | 4 frames | 100ms | Fast alternating hands on keyboard |
| `type_down` | 4 frames | 100ms | Hands visible moving on desk |
| `blocked` | 2 frames | 300ms | Hands raised / looking around in perplexity |
| `celebrate` | 4 frames | 180ms | Hands up in air, celebrating task completion |

---

## 3. Environment & Furniture Specifications

### 3.1 Floor Tiles (16 × 16)
- **Wood Flooring**: Warm oak planks with subtle 1px line separations.
- **Office Carpet**: Slate blue, charcoal gray, and forest green loop textures.
- **Ceramic / Linoleum**: Kitchen / breakroom white/gray checkboard.

### 3.2 Wall Tiles (16 × 24 or 16 × 32)
- Back walls (rendered behind characters) with baseboards and optional wall decor (clocks, posters, windows).
- Wall corners and side walls for room boundaries.

### 3.3 Office Furniture (Grid Multiples)
- **Workstation Desk** (32 × 24 pixels, 2×1.5 tiles):
  - Wooden / metal desktop surface.
  - Multi-monitor setup (1-2 monitors glowing when active).
  - Keyboard and mouse pad.
- **Ergonomic Chair** (16 × 16 pixels, 1×1 tile):
  - Swivel base with backrest.
  - Directional frames (facing north, south, east, west).
- **Coffee Machine & Breakroom Counter** (32 × 32 pixels):
  - Brewing coffee pot with steam animation.
- **Potted Plants / Ficus** (16 × 24 pixels):
  - Decorative greenery to add life to the office.
- **Whiteboard / Kanban Board** (32 × 24 pixels):
  - Sticky notes on board.

---

## 4. Asset Manifest Schema (`manifest.json`)

All sprite sheets and tilesets are registered through an asset manifest JSON:

```json
{
  "name": "default-office-pack",
  "version": "1.0.0",
  "tileSize": 16,
  "spritesheets": {
    "characters": {
      "path": "/assets/characters/agent_sprites.png",
      "frameWidth": 16,
      "frameHeight": 24,
      "animations": {
        "idle_down": { "row": 0, "frames": [0, 1], "frameRate": 2 },
        "idle_up": { "row": 1, "frames": [0, 1], "frameRate": 2 },
        "walk_down": { "row": 2, "frames": [0, 1, 2, 3], "frameRate": 6 },
        "walk_up": { "row": 3, "frames": [0, 1, 2, 3], "frameRate": 6 },
        "walk_side": { "row": 4, "frames": [0, 1, 2, 3], "frameRate": 6 },
        "type_up": { "row": 5, "frames": [0, 1, 2, 3], "frameRate": 8 }
      }
    },
    "tileset": {
      "path": "/assets/tiles/office_tiles.png",
      "tiles": {
        "floor_wood": { "x": 0, "y": 0, "w": 16, "h": 16 },
        "floor_carpet": { "x": 16, "y": 0, "w": 16, "h": 16 },
        "wall_top": { "x": 32, "y": 0, "w": 16, "h": 24 },
        "desk": { "x": 48, "y": 0, "w": 32, "h": 24 },
        "chair": { "x": 80, "y": 0, "w": 16, "h": 16 }
      }
    }
  }
}
```

---

## 5. Asset Generation Workflow & Tooling

To ensure 100% custom, reproducible art without licensing encumbrance:
1. **Procedural Pixel Art Generator (`scripts/generate-assets.ts`)**:
   - Programmatically renders baseline pixel-art tiles and sprites to PNG files using pure Canvas / node-canvas or raw PNG generation.
   - Generates character color variations (different shirt, hair, and skin tones for multiple agents).
2. **Modular File Storage**:
   - `client/public/assets/characters/`: Character spritesheets and color variants.
   - `client/public/assets/tiles/`: Floor, wall, and furniture tiles.
   - `client/public/assets/fx/`: Speech bubbles, exclamation icons, typing particles.
3. **External Art Pack Compatibility**:
   - The manifest system allows dropping in any sprite pack (e.g. itch.io CC0 packs, Aseprite exports) simply by providing a matching manifest.
