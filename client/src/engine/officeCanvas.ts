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
  private hoveredPaneId: string | null = null;
  private onSelectAgent?: (agent: HerdrAgent | null) => void;

  constructor(options: CanvasEngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D canvas context');
    this.ctx = ctx;
    this.assets = options.assets;
    this.scale = options.scale ?? 2;
    this.onSelectAgent = options.onSelectAgent;

    this.resizeCanvas();
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
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
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  private resizeCanvas() {
    const tileSize = this.assets.manifest.tileSize;
    this.canvas.width = OFFICE_COLS * tileSize * this.scale;
    this.canvas.height = OFFICE_ROWS * tileSize * this.scale;
    this.ctx.imageSmoothingEnabled = false;
  }

  private getDeskAssignments(): Map<HerdrAgent, DeskStation> {
    const map = new Map<HerdrAgent, DeskStation>();
    this.agents.forEach((agent, i) => {
      const station = DESK_STATIONS[i % DESK_STATIONS.length];
      map.set(agent, station);
    });
    return map;
  }

  private getStationUnderMouse(clientX: number, clientY: number): { agent: HerdrAgent; station: DeskStation } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / this.scale;
    const y = (clientY - rect.top) / this.scale;
    const tileSize = this.assets.manifest.tileSize;

    const assignments = this.getDeskAssignments();
    for (const [agent, station] of assignments) {
      const deskX = station.deskCol * tileSize;
      const deskY = station.deskRow * tileSize;
      // Hit area spans desk and chair zone
      if (x >= deskX - 4 && x <= deskX + 68 && y >= deskY - 30 && y <= deskY + 54) {
        return { agent, station };
      }
    }
    return null;
  }

  private handleClick = (event: MouseEvent) => {
    const hit = this.getStationUnderMouse(event.clientX, event.clientY);
    if (hit) {
      this.selectedPaneId = hit.agent.paneId;
      this.onSelectAgent?.(hit.agent);
    } else {
      this.selectedPaneId = null;
      this.onSelectAgent?.(null);
    }
  };

  private handleMouseMove = (event: MouseEvent) => {
    const hit = this.getStationUnderMouse(event.clientX, event.clientY);
    this.hoveredPaneId = hit ? hit.agent.paneId : null;
  };

  private handleMouseLeave = () => {
    this.hoveredPaneId = null;
  };

  private render() {
    const { ctx, scale, map, assets } = this;
    const tileSize = assets.manifest.tileSize;
    const tileset = assets.tilesetImage;
    const tiles = assets.manifest.tileset.tiles;
    const elapsed = Date.now() - this.startTime;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    // 1. Clear background with moody dark slate tone
    ctx.fillStyle = '#0b0d13';
    ctx.fillRect(0, 0, this.canvas.width / scale, this.canvas.height / scale);

    // 2. Render Floor Tiles (rows 1 to OFFICE_ROWS - 1)
    for (let r = 1; r < OFFICE_ROWS; r++) {
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

    // 3. Render Wall Tiles (row 0, height 48px to give high ceilings)
    for (let c = 0; c < OFFICE_COLS; c++) {
      const cell = map[0][c];
      const tileMeta = tiles[cell.type] || tiles.wall_top;
      if (tileMeta) {
        ctx.drawImage(
          tileset,
          tileMeta.x,
          tileMeta.y,
          tileMeta.w,
          tileMeta.h,
          c * tileSize,
          0,
          tileMeta.w,
          tileMeta.h
        );
      }
    }

    // 4. Render Breakroom Props (Water Cooler, Espresso Bar, Monstera Plants)
    const plantTile = tiles.plant;
    if (plantTile) {
      ctx.drawImage(tileset, plantTile.x, plantTile.y, plantTile.w, plantTile.h, 14 * tileSize, 1.2 * tileSize, plantTile.w, plantTile.h);
      ctx.drawImage(tileset, plantTile.x, plantTile.y, plantTile.w, plantTile.h, 19 * tileSize, 1.2 * tileSize, plantTile.w, plantTile.h);
    }

    const coolerTile = tiles.water_cooler;
    if (coolerTile) {
      ctx.drawImage(tileset, coolerTile.x, coolerTile.y, coolerTile.w, coolerTile.h, 15.5 * tileSize, 1.2 * tileSize, coolerTile.w, coolerTile.h);
    }

    const espressoTile = tiles.espresso_bar;
    if (espressoTile) {
      ctx.drawImage(tileset, espressoTile.x, espressoTile.y, espressoTile.w, espressoTile.h, 17.2 * tileSize, 1.2 * tileSize, espressoTile.w, espressoTile.h);
    }

    // 5. Render Desks & Assigned Agents with authentic 2.5D Layering
    const assignments = this.getDeskAssignments();
    const assignedStations = new Set(assignments.values());

    // Render vacant desks first
    for (const station of DESK_STATIONS) {
      if (assignedStations.has(station)) continue;
      this.renderDeskStation(station, null, elapsed);
    }

    // Render occupied desks with characters & active task bubbles
    for (const [agent, station] of assignments) {
      this.renderDeskStation(station, agent, elapsed);
    }

    // 6. Ambient Overhead Lighting Overlay (warm pendant light cones)
    this.renderAmbientLighting();

    ctx.restore();
  }

  private renderDeskStation(station: DeskStation, agent: HerdrAgent | null, elapsed: number) {
    const { ctx, assets } = this;
    const tileSize = assets.manifest.tileSize;
    const tileset = assets.tilesetImage;
    const tiles = assets.manifest.tileset.tiles;

    const deskX = station.deskCol * tileSize;
    const deskY = station.deskRow * tileSize;
    const chairX = deskX + 16;
    const chairY = deskY + 6;

    const isSelected = agent && agent.paneId === this.selectedPaneId;
    const isHovered = agent && agent.paneId === this.hoveredPaneId;

    // A. Selection / Hover Glow Ring
    if (isSelected || isHovered) {
      ctx.save();
      const pulse = Math.sin(elapsed / 250) * 0.2 + 0.8;
      ctx.strokeStyle = isSelected ? `rgba(59, 130, 246, ${pulse})` : 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(deskX - 4, deskY - 26, 72, 78, 6);
      ctx.stroke();
      ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.04)';
      ctx.fill();
      ctx.restore();
    }

    // B. Draw Chair (behind desk)
    const chairTile = tiles.chair;
    if (chairTile) {
      ctx.drawImage(
        tileset,
        chairTile.x,
        chairTile.y,
        chairTile.w,
        chairTile.h,
        chairX,
        chairY,
        chairTile.w,
        chairTile.h
      );
    }

    // C. Draw Character (sitting in chair)
    if (agent) {
      this.renderCharacter(agent, chairX, deskY - 14, elapsed);
    }

    // D. Draw Desk (in front of chair and character's lower body)
    const deskTile = tiles.desk;
    if (deskTile) {
      ctx.drawImage(
        tileset,
        deskTile.x,
        deskTile.y,
        deskTile.w,
        deskTile.h,
        deskX,
        deskY,
        deskTile.w,
        deskTile.h
      );
    }

    // E. Dynamic Screen Glow onto Desk when Working
    if (agent && agent.status === 'working') {
      ctx.save();
      const glowAlpha = Math.sin(elapsed / 180) * 0.15 + 0.35;
      const grad = ctx.createRadialGradient(deskX + 32, deskY + 16, 4, deskX + 32, deskY + 24, 32);
      grad.addColorStop(0, `rgba(56, 189, 248, ${glowAlpha})`);
      grad.addColorStop(0.6, `rgba(34, 197, 94, ${glowAlpha * 0.5})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(deskX + 6, deskY + 4, 52, 28);
      ctx.restore();
    }

    // F. Overhead Speech Bubble & Task Card
    if (agent) {
      this.renderAgentOverheadUI(agent, deskX + 32, deskY - 20, elapsed);
    }
  }

  private renderCharacter(agent: HerdrAgent, charX: number, charY: number, elapsed: number) {
    const { ctx, assets } = this;
    const charW = assets.manifest.characters.frameWidth;
    const charH = assets.manifest.characters.frameHeight;

    let charImg = assets.characterImages.get(agent.agent.toLowerCase());
    if (!charImg) {
      charImg = assets.characterImages.get('default') ?? assets.characterImages.values().next().value;
    }
    if (!charImg) return;

    let frameRate = 3;
    let frameCount = 4;
    let row = 1; // idle_up

    if (agent.status === 'working') {
      row = 5; // type_up
      frameRate = 8;
    } else if (agent.status === 'blocked') {
      row = 6; // alert
      frameRate = 3;
    } else if (agent.status === 'done') {
      row = 7; // celebratory done
      frameRate = 4;
    }

    const currentFrame = Math.floor((elapsed / 1000) * frameRate) % frameCount;

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
  }

  private renderAgentOverheadUI(agent: HerdrAgent, centerX: number, topY: number, elapsed: number) {
    const { ctx } = this;
    const bob = Math.sin(elapsed / 220) * 2;

    ctx.save();

    // 1. Overhead Task / Thought Bubble
    if (agent.status === 'working' || agent.status === 'blocked' || agent.status === 'done') {
      // Determine task snippet to display
      let displayText = '';
      if (agent.status === 'working') {
        displayText = agent.currentTask || agent.currentPrompt || 'Thinking...';
      } else if (agent.status === 'blocked') {
        displayText = '⚠️ Input Needed!';
      } else if (agent.status === 'done') {
        displayText = '✓ Task Complete!';
      }

      // Truncate to fit retro bubble cleanly
      if (displayText.length > 24) {
        displayText = displayText.slice(0, 23) + '…';
      }

      ctx.font = 'bold 8px monospace';
      const textWidth = ctx.measureText(displayText).width;
      const bubbleW = Math.max(textWidth + 20, 56);
      const bubbleH = 18;
      const bubbleX = centerX - bubbleW / 2;
      const bubbleY = topY - 14 + bob;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(bubbleX + 2, bubbleY + 2, bubbleW, bubbleH, 4);
      ctx.fill();

      // Bubble background
      ctx.fillStyle = agent.status === 'blocked' ? '#fee2e2' : agent.status === 'done' ? '#dcfce7' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 4);
      ctx.fill();

      // Bubble border
      ctx.strokeStyle = agent.status === 'blocked' ? '#ef4444' : agent.status === 'done' ? '#10b981' : '#1e293b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Downward pointer tail
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(centerX - 3, bubbleY + bubbleH);
      ctx.lineTo(centerX + 3, bubbleY + bubbleH);
      ctx.lineTo(centerX, bubbleY + bubbleH + 4);
      ctx.closePath();
      ctx.fill();

      // Typing animated icon or indicator
      if (agent.status === 'working') {
        const dotIndex = Math.floor(elapsed / 200) % 3;
        ctx.fillStyle = dotIndex === 0 ? '#38bdf8' : dotIndex === 1 ? '#a855f7' : '#22c55e';
        ctx.beginPath();
        ctx.arc(bubbleX + 8, bubbleY + 9, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Text inside bubble
      ctx.fillStyle = agent.status === 'blocked' ? '#b91c1c' : agent.status === 'done' ? '#15803d' : '#0f172a';
      ctx.fillText(displayText, bubbleX + (agent.status === 'working' ? 14 : 8), bubbleY + 12);
    }

    // 2. Desk Nameplate Badge below desk
    const badgeY = topY + 68;
    ctx.font = 'bold 8px monospace';
    const nameLabel = `${agent.name || agent.agent}`;
    const nameWidth = ctx.measureText(nameLabel).width;
    const badgeW = nameWidth + 18;
    const badgeH = 14;
    const badgeX = centerX - badgeW / 2;

    // Badge background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Status indicator LED dot
    const statusColor =
      agent.status === 'working'
        ? '#34d399'
        : agent.status === 'blocked'
          ? '#ef4444'
          : agent.status === 'done'
            ? '#a855f7'
            : '#60a5fa';

    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(badgeX + 6, badgeY + 7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Name text
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(nameLabel, badgeX + 12, badgeY + 10);

    ctx.restore();
  }

  private renderAmbientLighting() {
    const { ctx } = this;
    const tileSize = this.assets.manifest.tileSize;

    // Render soft warm lighting pools over workstation zones
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const station of DESK_STATIONS) {
      const cx = station.deskCol * tileSize + 32;
      const cy = station.deskRow * tileSize + 20;

      const radial = ctx.createRadialGradient(cx, cy, 10, cx, cy, 64);
      radial.addColorStop(0, 'rgba(254, 243, 199, 0.08)');
      radial.addColorStop(0.7, 'rgba(254, 215, 170, 0.03)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radial;
      ctx.fillRect(cx - 64, cy - 64, 128, 128);
    }

    ctx.restore();
  }
}
