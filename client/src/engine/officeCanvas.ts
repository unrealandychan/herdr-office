import type { LoadedAssets } from './assetLoader';
import {
  createOfficeMap,
  DESK_STATIONS,
  GUILD_POIS,
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
  onAgentSpoke?: (fromName: string, toName: string, text: string) => void;
}

export interface ActiveConversation {
  fromPaneId: string;
  toPaneId: string;
  fromName: string;
  toName: string;
  fromText: string;
  replyText?: string;
  stage: 'walking_to' | 'speaking_from' | 'speaking_reply' | 'returning';
  stageTimer: number;
  meetX: number;
  meetY: number;
}

export interface AgentEntity {
  agent: HerdrAgent;
  station: DeskStation;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  homeX: number;
  homeY: number;
  direction: 'down' | 'up' | 'side';
  facingLeft: boolean;
  state: 'sitting' | 'walking' | 'talking' | 'visiting_poi';
  walkSpeed: number;
  bubbleText?: string;
  bubbleSpeaker?: string;
  bubbleDuration: number;
  nextAutonomousActionTime: number;
}

const COLLAB_DIALOGUES = [
  {
    msg: 'Greetings colleague! All unit tests pass with flying colors.',
    reply: 'Splendid! I shall merge the spellcraft branch immediately.',
  },
  {
    msg: 'Could you review the canvas rendering diff for the guild hall?',
    reply: 'Already inspected—the 32-bit pixel aesthetic is peerless!',
  },
  {
    msg: 'I detected a blocked subprocess. Should we dispatch an interrupt?',
    reply: 'Affirmative! Issuing clean recovery protocol now.',
  },
  {
    msg: 'The floating mana crystal energy readings are optimal.',
    reply: 'Our coding agent party is at peak efficiency!',
  },
  {
    msg: 'Synchronizing our workspace tasks across Herdr panes.',
    reply: 'Session locks aligned. Ready for next prompt!',
  },
];

export class OfficeCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private assets: LoadedAssets;
  private scale: number;
  private agents: HerdrAgent[] = [];
  private entities = new Map<string, AgentEntity>();
  private map = createOfficeMap();
  private animationFrameId: number | null = null;
  private lastTime = performance.now();
  private startTime = Date.now();
  private selectedPaneId: string | null = null;
  private hoveredPaneId: string | null = null;
  private onSelectAgent?: (agent: HerdrAgent | null) => void;
  private onAgentSpoke?: (fromName: string, toName: string, text: string) => void;
  private activeConversation: ActiveConversation | null = null;

  constructor(options: CanvasEngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D canvas context');
    this.ctx = ctx;
    this.assets = options.assets;
    this.scale = options.scale ?? 2;
    this.onSelectAgent = options.onSelectAgent;
    this.onAgentSpoke = options.onAgentSpoke;

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
    this.syncEntities();
  }

  public setSelectedPaneId(paneId: string | null) {
    this.selectedPaneId = paneId;
  }

  /**
   * User or AI triggered message exchange between agents.
   * Causes fromAgent to walk over to toAgent, display FF dialogue, and walk back.
   */
  public sendAgentMessage(fromPaneId: string, toPaneId: string, customText?: string) {
    const fromEntity = this.entities.get(fromPaneId);
    const toEntity = this.entities.get(toPaneId);
    if (!fromEntity || !toEntity) return;

    const dialog = COLLAB_DIALOGUES[Math.floor(Math.random() * COLLAB_DIALOGUES.length)];
    const fromText = customText || dialog.msg;
    const replyText = dialog.reply;

    // Meet near recipient's desk
    const meetX = toEntity.homeX - 28;
    const meetY = toEntity.homeY;

    this.activeConversation = {
      fromPaneId,
      toPaneId,
      fromName: fromEntity.agent.name || fromEntity.agent.agent,
      toName: toEntity.agent.name || toEntity.agent.agent,
      fromText,
      replyText,
      stage: 'walking_to',
      stageTimer: 0,
      meetX,
      meetY,
    };

    fromEntity.targetX = meetX;
    fromEntity.targetY = meetY;
    fromEntity.state = 'walking';

    this.onAgentSpoke?.(fromEntity.agent.name || fromEntity.agent.agent, toEntity.agent.name || toEntity.agent.agent, fromText);
  }

  public start() {
    if (this.animationFrameId !== null) return;
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.update(dt);
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

  private syncEntities() {
    const tileSize = this.assets.manifest.tileSize;
    const currentPaneIds = new Set(this.agents.map((a) => a.paneId));

    // Remove defunct entities
    for (const [paneId] of this.entities) {
      if (!currentPaneIds.has(paneId)) {
        this.entities.delete(paneId);
      }
    }

    // Add or update entities
    this.agents.forEach((agent, i) => {
      const station = DESK_STATIONS[i % DESK_STATIONS.length];
      const homeX = station.deskCol * tileSize + 16;
      const homeY = station.deskRow * tileSize - 14;

      let entity = this.entities.get(agent.paneId);
      if (!entity) {
        entity = {
          agent,
          station,
          x: homeX,
          y: homeY,
          targetX: homeX,
          targetY: homeY,
          homeX,
          homeY,
          direction: 'up',
          facingLeft: false,
          state: 'sitting',
          walkSpeed: 64, // pixels/sec
          bubbleDuration: 0,
          nextAutonomousActionTime: Date.now() + 6000 + Math.random() * 8000,
        };
        this.entities.set(agent.paneId, entity);
      } else {
        entity.agent = agent;
        entity.station = station;
        entity.homeX = homeX;
        entity.homeY = homeY;
      }
    });
  }

  private update(dt: number) {
    const now = Date.now();

    // 1. Update Autonomous Agents Walking & Visiting
    for (const [, entity] of this.entities) {
      // Manage bubble timer
      if (entity.bubbleDuration > 0) {
        entity.bubbleDuration -= dt;
        if (entity.bubbleDuration <= 0) {
          entity.bubbleText = undefined;
          entity.bubbleSpeaker = undefined;
        }
      }

      // Movement step
      if (entity.state === 'walking') {
        const dx = entity.targetX - entity.x;
        const dy = entity.targetY - entity.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= entity.walkSpeed * dt || dist < 2) {
          entity.x = entity.targetX;
          entity.y = entity.targetY;

          // Arrived at destination
          if (entity.x === entity.homeX && entity.y === entity.homeY) {
            entity.state = 'sitting';
            entity.direction = 'up';
          } else {
            entity.state = 'talking';
          }
        } else {
          entity.x += (dx / dist) * entity.walkSpeed * dt;
          entity.y += (dy / dist) * entity.walkSpeed * dt;

          if (Math.abs(dx) > Math.abs(dy)) {
            entity.direction = 'side';
            entity.facingLeft = dx < 0;
          } else {
            entity.direction = dy > 0 ? 'down' : 'up';
          }
        }
      }

      // Autonomous random wander / talk (if not currently in targeted conversation)
      if (
        entity.state === 'sitting' &&
        !this.activeConversation &&
        now >= entity.nextAutonomousActionTime
      ) {
        entity.nextAutonomousActionTime = now + 12000 + Math.random() * 14000;

        // If another agent exists, 50% chance to walk over and chat!
        const otherEntities = Array.from(this.entities.values()).filter((e) => e.agent.paneId !== entity.agent.paneId);
        if (otherEntities.length > 0 && Math.random() < 0.6) {
          const partner = otherEntities[Math.floor(Math.random() * otherEntities.length)];
          this.sendAgentMessage(entity.agent.paneId, partner.agent.paneId);
        } else {
          // Walk to visit Mana Save Crystal or Ancient Bookshelf
          const poi = GUILD_POIS[Math.floor(Math.random() * GUILD_POIS.length)];
          entity.targetX = poi.col * 32;
          entity.targetY = poi.row * 32;
          entity.state = 'walking';

          // Set return timer
          setTimeout(() => {
            if (entity.state !== 'walking' || entity.targetX !== entity.homeX) {
              entity.targetX = entity.homeX;
              entity.targetY = entity.homeY;
              entity.state = 'walking';
            }
          }, 4500);
        }
      }
    }

    // 2. Update Active Inter-Agent Conversation
    if (this.activeConversation) {
      const conv = this.activeConversation;
      const fromEntity = this.entities.get(conv.fromPaneId);
      const toEntity = this.entities.get(conv.toPaneId);

      if (!fromEntity || !toEntity) {
        this.activeConversation = null;
        return;
      }

      conv.stageTimer += dt;

      if (conv.stage === 'walking_to') {
        if (fromEntity.state !== 'walking') {
          // Arrived to talk
          conv.stage = 'speaking_from';
          conv.stageTimer = 0;
          fromEntity.direction = 'side';
          fromEntity.facingLeft = false;
          toEntity.direction = 'side';
          toEntity.facingLeft = true;

          fromEntity.bubbleText = conv.fromText;
          fromEntity.bubbleSpeaker = conv.fromName;
          fromEntity.bubbleDuration = 4.5;
        }
      } else if (conv.stage === 'speaking_from') {
        if (conv.stageTimer >= 4.0 && conv.replyText) {
          conv.stage = 'speaking_reply';
          conv.stageTimer = 0;
          fromEntity.bubbleText = undefined;
          toEntity.bubbleText = conv.replyText;
          toEntity.bubbleSpeaker = conv.toName;
          toEntity.bubbleDuration = 4.0;
        }
      } else if (conv.stage === 'speaking_reply') {
        if (conv.stageTimer >= 3.8) {
          conv.stage = 'returning';
          toEntity.bubbleText = undefined;
          toEntity.direction = 'up';

          fromEntity.targetX = fromEntity.homeX;
          fromEntity.targetY = fromEntity.homeY;
          fromEntity.state = 'walking';
        }
      } else if (conv.stage === 'returning') {
        if (fromEntity.state === 'sitting') {
          this.activeConversation = null;
        }
      }
    }
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

  private getStationUnderMouse(clientX: number, clientY: number): { agent: HerdrAgent; entity: AgentEntity } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / this.scale;
    const y = (clientY - rect.top) / this.scale;
    const tileSize = this.assets.manifest.tileSize;

    for (const [, entity] of this.entities) {
      const deskX = entity.station.deskCol * tileSize;
      const deskY = entity.station.deskRow * tileSize;
      // Hit area spans workstation desk and current entity position
      if (
        (x >= deskX - 4 && x <= deskX + 68 && y >= deskY - 30 && y <= deskY + 54) ||
        (x >= entity.x - 16 && x <= entity.x + 32 && y >= entity.y - 10 && y <= entity.y + 48)
      ) {
        return { agent: entity.agent, entity };
      }
    }
    return null;
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

    // 1. Clear background (Atmospheric Medieval Slate)
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, this.canvas.width / scale, this.canvas.height / scale);

    // 2. Render Castle Flooring (rows 1 to OFFICE_ROWS - 1)
    for (let r = 1; r < OFFICE_ROWS; r++) {
      for (let c = 0; c < OFFICE_COLS; c++) {
        const cell = map[r][c];
        const tileMeta = tiles[cell.type] || tiles.floor_wood;
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

    // 3. Render Castle Wall (row 0, height 48px: Gothic Windows, Bookshelves, Mana Crystal, Torches)
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

    // 4. Render Guild Props (Alchemist Potion Table & Treasure Chest)
    const potionsTile = tiles.potions || tiles.plant;
    if (potionsTile) {
      ctx.drawImage(tileset, potionsTile.x, potionsTile.y, potionsTile.w, potionsTile.h, 16.5 * tileSize, 2.8 * tileSize, potionsTile.w, potionsTile.h);
    }

    const chestTile = tiles.chest || tiles.water_cooler;
    if (chestTile) {
      ctx.drawImage(tileset, chestTile.x, chestTile.y, chestTile.w, chestTile.h, 18 * tileSize, 4.0 * tileSize, chestTile.w, chestTile.h);
    }

    // 5. Render Desks & Chairs
    for (const station of DESK_STATIONS) {
      const deskX = station.deskCol * tileSize;
      const deskY = station.deskRow * tileSize;
      const chairX = deskX + 16;
      const chairY = deskY + 6;

      // Chair behind desk
      const chairTile = tiles.chair;
      if (chairTile) {
        ctx.drawImage(tileset, chairTile.x, chairTile.y, chairTile.w, chairTile.h, chairX, chairY, chairTile.w, chairTile.h);
      }

      // Desk
      const deskTile = tiles.desk;
      if (deskTile) {
        ctx.drawImage(tileset, deskTile.x, deskTile.y, deskTile.w, deskTile.h, deskX, deskY, deskTile.w, deskTile.h);
      }
    }

    // 6. Render Agent Entities (Sorted by Y for proper 2.5D depth)
    const sortedEntities = Array.from(this.entities.values()).sort((a, b) => a.y - b.y);

    for (const entity of sortedEntities) {
      this.renderEntity(entity, elapsed);
    }

    // 7. Ambient Castle Lighting & Torchlight Glow
    this.renderAtmosphericLighting(elapsed);

    // 8. Render Classic Final Fantasy Dialogue Boxes (Overhead)
    for (const entity of sortedEntities) {
      if (entity.bubbleText) {
        this.renderFFDialogueBox(entity.bubbleSpeaker || entity.agent.agent, entity.bubbleText, entity.x + 16, entity.y - 18, elapsed);
      } else if (entity.agent.status === 'working' && entity.state === 'sitting') {
        // Floating thought spellbook rune
        const taskSnippet = entity.agent.currentTask || entity.agent.currentPrompt || 'Channeling spell...';
        this.renderFFMiniTaskBubble(entity.agent.name || entity.agent.agent, taskSnippet, entity.x + 16, entity.y - 18, elapsed);
      }
    }

    ctx.restore();
  }

  private renderEntity(entity: AgentEntity, elapsed: number) {
    const { ctx, assets } = this;
    const charW = assets.manifest.characters.frameWidth;
    const charH = assets.manifest.characters.frameHeight;

    let charImg = assets.characterImages.get(entity.agent.agent.toLowerCase());
    if (!charImg) {
      charImg = assets.characterImages.get('default') ?? assets.characterImages.values().next().value;
    }
    if (!charImg) return;

    // Pick animation row & frame
    let row = 0;
    let frameCount = 4;
    let frameRate = 3;

    if (entity.state === 'walking') {
      if (entity.direction === 'down') row = 2;
      else if (entity.direction === 'up') row = 3;
      else row = 4;
      frameRate = 6;
    } else if (entity.state === 'talking') {
      row = entity.direction === 'up' ? 1 : 0;
      frameRate = 3;
    } else {
      // Sitting at desk
      if (entity.agent.status === 'working') {
        row = 5; // Cast magic spell / typing
        frameRate = 8;
      } else if (entity.agent.status === 'blocked') {
        row = 6; // Alarmed / alert
        frameRate = 4;
      } else if (entity.agent.status === 'done') {
        row = 7; // Victory fanfare
        frameRate = 4;
      } else {
        row = 1; // Idle up facing desk
        frameRate = 3;
      }
    }

    const currentFrame = Math.floor((elapsed / 1000) * frameRate) % frameCount;

    // Selection Halo
    const isSelected = entity.agent.paneId === this.selectedPaneId;
    const isHovered = entity.agent.paneId === this.hoveredPaneId;
    if (isSelected || isHovered) {
      ctx.save();
      const pulse = Math.sin(elapsed / 200) * 0.2 + 0.8;
      ctx.strokeStyle = isSelected ? `rgba(251, 191, 36, ${pulse})` : 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(entity.x + 16, entity.y + 44, 14, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Classic FF white pointing hand cursor above selected hero!
      if (isSelected) {
        const handBob = Math.sin(elapsed / 180) * 3;
        const cursorTile = assets.manifest.tileset.tiles.cursor_hand;
        if (cursorTile) {
          ctx.drawImage(
            assets.tilesetImage,
            cursorTile.x,
            cursorTile.y,
            cursorTile.w,
            cursorTile.h,
            entity.x + 8,
            entity.y - 28 + handBob,
            cursorTile.w,
            cursorTile.h
          );
        }
      }
      ctx.restore();
    }

    // Draw Character Sprite with horizontal flipping if facing left
    ctx.save();
    if (entity.state === 'walking' && entity.direction === 'side' && entity.facingLeft) {
      ctx.translate(entity.x + charW, entity.y);
      ctx.scale(-1, 1);
      ctx.drawImage(charImg, currentFrame * charW, row * charH, charW, charH, 0, 0, charW, charH);
    } else {
      ctx.drawImage(charImg, currentFrame * charW, row * charH, charW, charH, entity.x, entity.y, charW, charH);
    }
    ctx.restore();

    // If sitting at desk, draw desk in front to ensure 2.5D occlusion
    if (entity.state === 'sitting') {
      const deskTile = assets.manifest.tileset.tiles.desk;
      if (deskTile) {
        const deskX = entity.station.deskCol * assets.manifest.tileSize;
        const deskY = entity.station.deskRow * assets.manifest.tileSize;
        ctx.drawImage(assets.tilesetImage, deskTile.x, deskTile.y, deskTile.w, deskTile.h, deskX, deskY, deskTile.w, deskTile.h);
      }
    }

    // Nameplate below character
    this.renderEntityNameplate(entity);
  }

  private renderEntityNameplate(entity: AgentEntity) {
    const { ctx } = this;
    ctx.save();
    ctx.font = 'bold 8px monospace';
    const name = entity.agent.name || entity.agent.agent;
    const textW = ctx.measureText(name).width;
    const badgeW = textW + 16;
    const badgeX = entity.x + 16 - badgeW / 2;
    const badgeY = entity.y + 48;

    // Classic FF Blue window styling for mini-nameplate
    ctx.fillStyle = '#06134a';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, 13, 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Status Gem Dot
    const gemColor =
      entity.agent.status === 'working'
        ? '#34d399'
        : entity.agent.status === 'blocked'
          ? '#ef4444'
          : entity.agent.status === 'done'
            ? '#fbbf24'
            : '#60a5fa';

    ctx.fillStyle = gemColor;
    ctx.beginPath();
    ctx.arc(badgeX + 5, badgeY + 6.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, badgeX + 11, badgeY + 9.5);
    ctx.restore();
  }

  /**
   * Renders a classic Final Fantasy Blue Dialogue Box with silver double-beveled border
   */
  private renderFFDialogueBox(speaker: string, text: string, anchorX: number, anchorY: number, elapsed: number) {
    const { ctx } = this;
    const bob = Math.sin(elapsed / 240) * 2;

    ctx.save();
    ctx.font = 'bold 8px monospace';

    // Format text lines
    const title = `【 ${speaker.toUpperCase()} 】`;
    let body = text;
    if (body.length > 56) body = body.slice(0, 54) + '…';

    const titleW = ctx.measureText(title).width;
    const bodyW = ctx.measureText(body).width;
    const boxW = Math.min(Math.max(titleW, bodyW) + 20, 220);
    const boxH = 34;

    const boxX = Math.max(10, Math.min(OFFICE_COLS * 32 - boxW - 10, anchorX - boxW / 2));
    const boxY = Math.max(12, anchorY - boxH - 10 + bob);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(boxX + 3, boxY + 3, boxW, boxH, 4);
    ctx.fill();

    // Final Fantasy Blue Gradient Fill
    const grad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
    grad.addColorStop(0, '#0c229c');
    grad.addColorStop(0.6, '#061362');
    grad.addColorStop(1, '#020630');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 3);
    ctx.fill();

    // White outer border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner grey bevel border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

    // Downward dialogue arrow pointer
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(anchorX - 4, boxY + boxH);
    ctx.lineTo(anchorX + 4, boxY + boxH);
    ctx.lineTo(anchorX, boxY + boxH + 5);
    ctx.closePath();
    ctx.fill();

    // Speaker Title (Gold)
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(title, boxX + 6, boxY + 12);

    // Message Body (White with slight shadow)
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(body, boxX + 6, boxY + 25);

    ctx.restore();
  }

  private renderFFMiniTaskBubble(speaker: string, task: string, anchorX: number, anchorY: number, elapsed: number) {
    const { ctx } = this;
    const bob = Math.sin(elapsed / 200) * 1.5;

    ctx.save();
    ctx.font = 'bold 8px monospace';
    let cleanTask = `${speaker}: ${task}`;
    if (cleanTask.length > 32) cleanTask = cleanTask.slice(0, 31) + '…';

    const textW = ctx.measureText(cleanTask).width;
    const boxW = Math.max(textW + 24, 60);
    const boxH = 18;
    const boxX = Math.max(10, Math.min(OFFICE_COLS * 32 - boxW - 10, anchorX - boxW / 2));
    const boxY = Math.max(12, anchorY - boxH - 6 + bob);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(boxX + 2, boxY + 2, boxW, boxH, 3);
    ctx.fill();

    // FF Blue Gradient
    const grad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
    grad.addColorStop(0, '#0a1d82');
    grad.addColorStop(1, '#020836');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 3);
    ctx.fill();

    // Silver border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pointer tail
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(anchorX - 3, boxY + boxH);
    ctx.lineTo(anchorX + 3, boxY + boxH);
    ctx.lineTo(anchorX, boxY + boxH + 4);
    ctx.closePath();
    ctx.fill();

    // Spinning magical crystal rune dot
    const runePulse = Math.sin(elapsed / 150) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(34, 211, 238, ${runePulse})`;
    ctx.beginPath();
    ctx.arc(boxX + 8, boxY + 9, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Task text
    ctx.fillStyle = '#ecfeff';
    ctx.fillText(cleanTask, boxX + 15, boxY + 12);

    ctx.restore();
  }

  private renderAtmosphericLighting(elapsed: number) {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. Flickering Wall Torches Lighting (Col 4 and Col 12)
    const torchFlicker = Math.sin(elapsed / 100) * 0.04 + Math.cos(elapsed / 170) * 0.03 + 0.12;
    const torchCols = [4.5, 12.5];
    for (const tc of torchCols) {
      const tx = tc * 32;
      const ty = 24;
      const rad = ctx.createRadialGradient(tx, ty, 4, tx, ty, 80);
      rad.addColorStop(0, `rgba(251, 191, 36, ${torchFlicker})`);
      rad.addColorStop(0.5, `rgba(249, 115, 22, ${torchFlicker * 0.6})`);
      rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rad;
      ctx.fillRect(tx - 80, ty - 80, 160, 160);
    }

    // 2. Floating Mana Crystal Cyan Glow (Col 14.5)
    const crystalPulse = Math.sin(elapsed / 300) * 0.08 + 0.22;
    const cx = 14.5 * 32;
    const cy = 24;
    const crystalRad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 96);
    crystalRad.addColorStop(0, `rgba(103, 232, 249, ${crystalPulse})`);
    crystalRad.addColorStop(0.6, `rgba(6, 182, 212, ${crystalPulse * 0.4})`);
    crystalRad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = crystalRad;
    ctx.fillRect(cx - 96, cy - 96, 192, 192);

    ctx.restore();
  }
}
