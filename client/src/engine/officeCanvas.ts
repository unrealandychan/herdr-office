import type { LoadedAssets } from './assetLoader';
import {
  createOfficeMap,
  DESK_STATIONS,
  OFFICE_COLS,
  OFFICE_ROWS,
  type DeskStation,
} from './officeLayout';
import type { HerdrAgent } from '../types';

export interface CanvasEngineOptions {
  canvas: HTMLCanvasElement;
  assets: LoadedAssets;
  scale?: number;
  onSelectAgent?: (agent: HerdrAgent | null) => void;
}

export class OfficeCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private assets: LoadedAssets;
  private scale: number;
  private agents: HerdrAgent[] = [];
  private map = createOfficeMap();
  private animationFrameId: number | null = null;
  private startTime = Date.now();
  private selectedPaneId: string | null = null;
  private onSelectAgent?: (agent: HerdrAgent | null) => void;

  constructor(options: CanvasEngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D canvas context');
    this.ctx = ctx;
    this.assets = options.assets;
    this.scale = options.scale ?? 3;
    this.onSelectAgent = options.onSelectAgent;

    this.resizeCanvas();
    this.canvas.addEventListener('click', this.handleClick);
  }

  public setScale(scale: number) {
    this.scale = scale;
    this.resizeCanvas();
  }

  public setAgents(agents: HerdrAgent[]) {
    this.agents = agents;
  }

  public setSelectedPaneId(paneId: string | null) {
    this.selectedPaneId = paneId;
  }

  public start() {
    if (this.animationFrameId !== null) return;
    const loop = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    this.canvas.removeEventListener('click', this.handleClick);
  }

  private resizeCanvas() {
    const tileSize = this.assets.manifest.tileSize;
    this.canvas.width = OFFICE_COLS * tileSize * this.scale;
    this.canvas.height = OFFICE_ROWS * tileSize * this.scale;
    this.ctx.imageSmoothingEnabled = false;
  }

  private handleClick = (event: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / this.scale;
    const y = (event.clientY - rect.top) / this.scale;

    const tileSize = this.assets.manifest.tileSize;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    // Check if clicked near an assigned desk
    const assignments = this.getDeskAssignments();
    for (const [agent, station] of assignments) {
      if (
        (col >= station.deskCol && col <= station.deskCol + 2 && row >= station.deskRow && row <= station.chairRow + 1)
      ) {
        this.selectedPaneId = agent.paneId;
        this.onSelectAgent?.(agent);
        return;
      }
    }

    this.selectedPaneId = null;
    this.onSelectAgent?.(null);
  };

  private getDeskAssignments(): Map<HerdrAgent, DeskStation> {
    const map = new Map<HerdrAgent, DeskStation>();
    this.agents.forEach((agent, i) => {
      const station = DESK_STATIONS[i % DESK_STATIONS.length];
      map.set(agent, station);
    });
    return map;
  }

  private render() {
    const { ctx, scale, map, assets } = this;
    const tileSize = assets.manifest.tileSize;
    const tileset = assets.tilesetImage;
    const tiles = assets.manifest.tileset.tiles;
    const elapsed = Date.now() - this.startTime;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    // 1. Clear background
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, this.canvas.width / scale, this.canvas.height / scale);

    // 2. Render Floor and Wall Tiles
    for (let r = 0; r < OFFICE_ROWS; r++) {
      for (let c = 0; c < OFFICE_COLS; c++) {
        const cell = map[r][c];
        const tileMeta = tiles[cell.type];
        if (tileMeta) {
          ctx.drawImage(
            tileset,
            tileMeta.x,
            tileMeta.y,
            tileMeta.w,
            tileMeta.h,
            c * tileSize,
            r * tileSize,
            tileMeta.w,
            tileMeta.h
          );
        }
      }
    }

    // 3. Render Breakroom Furniture (Plants & Water Cooler)
    const plantTile = tiles.plant;
    if (plantTile) {
      ctx.drawImage(tileset, plantTile.x, plantTile.y, plantTile.w, plantTile.h, 15 * tileSize, 3 * tileSize, plantTile.w, plantTile.h);
      ctx.drawImage(tileset, plantTile.x, plantTile.y, plantTile.w, plantTile.h, 18 * tileSize, 3 * tileSize, plantTile.w, plantTile.h);
    }
    const coolerTile = tiles.water_cooler;
    if (coolerTile) {
      ctx.drawImage(tileset, coolerTile.x, coolerTile.y, coolerTile.w, coolerTile.h, 16.5 * tileSize, 3 * tileSize, coolerTile.w, coolerTile.h);
    }

    // 4. Render Desks & Assigned Agents with Y-Sorting
    const assignments = this.getDeskAssignments();

    // Draw vacant desks first
    for (let i = 0; i < DESK_STATIONS.length; i++) {
      const station = DESK_STATIONS[i];
      const deskTile = tiles.desk;
      const chairTile = tiles.chair;

      // Draw chair behind desk
      ctx.drawImage(
        tileset,
        chairTile.x,
        chairTile.y,
        chairTile.w,
        chairTile.h,
        station.chairCol * tileSize - 4,
        station.chairRow * tileSize - 2,
        chairTile.w,
        chairTile.h
      );

      // Draw desk
      ctx.drawImage(
        tileset,
        deskTile.x,
        deskTile.y,
        deskTile.w,
        deskTile.h,
        station.deskCol * tileSize,
        station.deskRow * tileSize,
        deskTile.w,
        deskTile.h
      );
    }

    // Render active agents at their desks
    for (const [agent, station] of assignments) {
      this.renderAgent(agent, station, elapsed);
    }

    ctx.restore();
  }

  private renderAgent(agent: HerdrAgent, station: DeskStation, elapsed: number) {
    const { ctx, assets } = this;
    const tileSize = assets.manifest.tileSize;
    const charW = assets.manifest.characters.frameWidth;
    const charH = assets.manifest.characters.frameHeight;

    // Pick sprite sheet variant
    let charImg = assets.characterImages.get(agent.agent.toLowerCase());
    if (!charImg) {
      charImg = assets.characterImages.get('default') ?? assets.characterImages.values().next().value;
    }
    if (!charImg) return;

    // Select animation row & frame based on agent status
    let frameRate = 2;
    let frameCount = 2;
    let row = 1; // idle_up

    if (agent.status === 'working') {
      row = 5;
      frameRate = 8;
      frameCount = 4;
    } else if (agent.status === 'blocked') {
      row = 6;
      frameRate = 3;
      frameCount = 4;
    } else if (agent.status === 'done') {
      row = 7;
      frameRate = 3;
      frameCount = 4;
    }

    const currentFrame = Math.floor((elapsed / 1000) * frameRate) % frameCount;

    const charX = station.chairCol * tileSize - 4;
    const charY = station.chairRow * tileSize - 10;

    // Highlight focused or selected agent
    const isSelected = agent.paneId === this.selectedPaneId;
    if (isSelected || agent.focused) {
      ctx.save();
      ctx.strokeStyle = agent.focused ? '#10b981' : '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(charX - 2, charY - 2, charW + 4, charH + 4);
      ctx.restore();
    }

    // Draw character sprite
    ctx.drawImage(
      charImg,
      currentFrame * charW,
      row * charH,
      charW,
      charH,
      charX,
      charY,
      charW,
      charH
    );

    // Draw speech bubble for blocked or done statuses
    const tileset = assets.tilesetImage;
    const tiles = assets.manifest.tileset.tiles;
    const bubbleBob = Math.sin(elapsed / 200) * 2;

    if (agent.status === 'blocked') {
      const bubble = tiles.bubble_blocked;
      if (bubble) {
        ctx.drawImage(
          tileset,
          bubble.x,
          bubble.y,
          bubble.w,
          bubble.h,
          charX,
          charY - 18 + bubbleBob,
          bubble.w,
          bubble.h
        );
      }
    } else if (agent.status === 'done') {
      const bubble = tiles.bubble_done;
      if (bubble) {
        ctx.drawImage(
          tileset,
          bubble.x,
          bubble.y,
          bubble.w,
          bubble.h,
          charX,
          charY - 18 + bubbleBob,
          bubble.w,
          bubble.h
        );
      }
    }

    // Draw Agent Name Tag
    ctx.save();
    ctx.font = '6px monospace';
    const tag = `${agent.agent} (${agent.status})`;
    const tagWidth = ctx.measureText(tag).width;
    const tagX = charX + charW / 2 - tagWidth / 2;
    const tagY = charY + charH + 7;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(tagX - 2, tagY - 6, tagWidth + 4, 8);

    ctx.fillStyle = agent.status === 'working' ? '#34d399' : agent.status === 'blocked' ? '#f87171' : '#e2e8f0';
    ctx.fillText(tag, tagX, tagY);
    ctx.restore();
  }
}
